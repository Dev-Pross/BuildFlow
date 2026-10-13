import dotenv from "dotenv";
dotenv.config();
import { prismaClient } from "@repo/db/client";
import { getKafkaProducer, TOPIC_WORKFLOW_EXECUTIONS } from "@repo/kafka";
import { Client } from "pg";

async function main() {
  const producer = await getKafkaProducer();
  let isSweeping = false;
  let hasPending = false;

  async function sweep() {
    if (isSweeping) {
      hasPending = true;
      return;
    }
    isSweeping = true;
    try {
      const pending = await prismaClient.workflowExecutionTable.findMany({
        where: { sent: false },
      });

      if (pending.length > 0) {
        await producer.send({
          topic: TOPIC_WORKFLOW_EXECUTIONS,
          messages: pending.map((v) => ({
            value: v.workflowExecutionId,
          })),
        });

        await prismaClient.workflowExecutionTable.updateMany({
          where: { id: { in: pending.map((r) => r.id) } },
          data: { sent: true },
        });
        console.log(`[Processor] Published ${pending.length} execution(s) to Kafka.`);
      }
    } catch (error) {
      console.error("[Processor] Sweep error:", error);
    } finally {
      isSweeping = false;
      if (hasPending) {
        hasPending = false;
        sweep();
      }
    }
  }

  let client: Client | null = null;
  let isReconnecting = false;
  let reconnectDelayMs = 1000;
  const MAX_RECONNECT_DELAY_MS = 30000;

  async function connectPgListener() {
    try {
      const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL_DIRECT;
      if (!connectionString) {
        throw new Error("Missing DIRECT_URL or DATABASE_URL_DIRECT in environment");
      }

      client = new Client({ connectionString });
      await client.connect();
      await client.query("LISTEN new_outbox_entry");
      console.log("[Processor] Successfully listening on 'new_outbox_entry' channel.");

      // Reset backoff delay on successful connection
      reconnectDelayMs = 1000;

      client.on("notification", () => {
        console.log("[Processor] Received outbox notification, triggering sweep.");
        sweep();
      });

      client.on("error", (err) => {
        console.error("[Processor] PG client error:", err.message);
        scheduleReconnect();
      });

      client.on("end", () => {
        console.warn("[Processor] PG client connection ended.");
        scheduleReconnect();
      });

      // Run initial sweep to process backlog from offline periods
      await sweep();
    } catch (error) {
      console.error("[Processor] Failed to connect PG listener:", error);
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (isReconnecting) return;
    isReconnecting = true;

    console.log(`[Processor] Reconnecting in ${reconnectDelayMs / 1000}s...`);
    setTimeout(async () => {
      isReconnecting = false;
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS);

      if (client) {
        try {
          await client.end();
        } catch {
          // Ignore error closing dead socket
        }
        client = null;
      }

      await connectPgListener();
    }, reconnectDelayMs);
  }

  await connectPgListener();

  const handleShutdown = async (signal: string) => {
    console.log(`[Processor] Received ${signal}. Shutting down gracefully...`);
    if (client) {
      try {
        await client.end();
      } catch (e) {
        console.error("[Processor] Error closing PG client:", e);
      }
    }
    try {
      await producer.disconnect();
    } catch (e) {
      console.error("[Processor] Error disconnecting Kafka producer:", e);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

main();

