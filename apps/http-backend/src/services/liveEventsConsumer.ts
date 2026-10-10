import { Consumer, createKafkaConsumer, TOPIC_LIVE_EVENTS, WorkflowLiveEvent } from "@repo/kafka";
import { sseManager } from "./sseManager.js";

let consumer: Consumer | null = null;
let isRunning = false;

/**
 * Initializes the static Kafka consumer for real-time live events.
 * Exactly 1 consumer runs per backend instance, fanning out in memory via sseManager.
 */
export async function initLiveEventsConsumer(): Promise<void> {
  if (isRunning) {
    console.log("[Kafka Live Consumer] Consumer already initialized and running.");
    return;
  }

  try {
    consumer = createKafkaConsumer("http-backend-live-events-group");
    await consumer.connect();

    await consumer.subscribe({
      topic: TOPIC_LIVE_EVENTS,
      fromBeginning: false, // Only stream real-time events, skip historical
    });

    isRunning = true;
    console.log(`[Kafka Live Consumer] Subscribed to topic '${TOPIC_LIVE_EVENTS}'`);

    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ message }: any) => {
        try {
          if (!message.value) return;

          const rawData = message.value.toString();
          const event = JSON.parse(rawData) as WorkflowLiveEvent;

          if (event && event.workflowId) {
            sseManager.broadcastToWorkflow(event.workflowId, event);
          }
        } catch (parseError) {
          console.error("[Kafka Live Consumer] Error processing live event message:", parseError);
        }
      },
    });
  } catch (error) {
    console.error("[Kafka Live Consumer] Fatal error during consumer startup:", error);
    isRunning = false;
  }
}

/**
 * Gracefully disconnects the consumer on SIGTERM/SIGINT
 */
export async function shutdownLiveEventsConsumer(): Promise<void> {
  if (consumer && isRunning) {
    console.log("[Kafka Live Consumer] Disconnecting consumer cleanly...");
    try {
      await consumer.disconnect();
      isRunning = false;
      console.log("[Kafka Live Consumer] Disconnected successfully.");
    } catch (err) {
      console.error("[Kafka Live Consumer] Error during consumer disconnect:", err);
    }
  }
}
