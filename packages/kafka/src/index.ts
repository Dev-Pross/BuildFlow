import dotenv from "dotenv";
dotenv.config();

import { Kafka, Producer, Consumer, SASLOptions, KafkaConfig } from "kafkajs";

export type { Consumer, Producer };
export { Kafka };

// ─── Centralized Topic Constants ───
export const TOPIC_WORKFLOW_EXECUTIONS = "First-Client";
export const TOPIC_LIVE_EVENTS = "workflow-live-events";

// ─── Event Interfaces for Real-Time Telemetry ───
export type WorkflowLiveEventType =
  | "TEST_WEBHOOK"
  | "NODE_START"
  | "NODE_FINISH"
  | "WORKFLOW_FINISH";

export interface TestWebhookLiveEvent {
  type: "TEST_WEBHOOK";
  workflowId: string;
  executionId?: string;
  metadata: any;
  timestamp: string;
}

export interface NodeStartLiveEvent {
  type: "NODE_START";
  workflowId: string;
  executionId: string;
  nodeId: string;
  startedAt: string;
}

export interface NodeFinishLiveEvent {
  type: "NODE_FINISH";
  workflowId: string;
  executionId: string;
  nodeId: string;
  status: "Completed" | "Failed";
  completedAt: string;
  durationMs?: number;
  error?: string;
}

export interface WorkflowFinishLiveEvent {
  type: "WORKFLOW_FINISH";
  workflowId: string;
  executionId: string;
  status: "Completed" | "Failed";
  completedAt: string;
  error?: string;
}

export type WorkflowLiveEvent =
  | TestWebhookLiveEvent
  | NodeStartLiveEvent
  | NodeFinishLiveEvent
  | WorkflowFinishLiveEvent;

// ─── Dynamic Broker & SASL/SSL Configuration ───
const brokersEnv = process.env.KAFKA_BROKERS || "localhost:9092";
const brokers = brokersEnv.split(",").map((b) => b.trim());

const username = process.env.KAFKA_USERNAME;
const password = process.env.KAFKA_PASSWORD;
const mechanism = (process.env.KAFKA_MECHANISM || "scram-sha-256") as
  | "plain"
  | "scram-sha-256"
  | "scram-sha-512";

const isSaslEnabled = Boolean(username && password);

const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || "buildflow",
  brokers,
  connectionTimeout: 10000,
  requestTimeout: 30000,
  ...(isSaslEnabled
    ? {
        ssl: {
          rejectUnauthorized: process.env.KAFKA_SSL_REJECT_UNAUTHORIZED === "true",
        },
        sasl: {
          mechanism,
          username: username!,
          password: password!,
        } as SASLOptions,
      }
    : {}),
};

export const kafka = new Kafka(kafkaConfig);

// ─── Shared Producer Singleton Helper ───
let sharedProducer: Producer | null = null;

export async function getKafkaProducer(): Promise<Producer> {
  if (!sharedProducer) {
    sharedProducer = kafka.producer();
    await sharedProducer.connect();
    console.log(
      `[Kafka] Connected producer to [${brokers.join(", ")}] (SASL: ${isSaslEnabled})`
    );
  }
  return sharedProducer;
}

// ─── Consumer Factory Helper ───
export function createKafkaConsumer(groupId: string): Consumer {
  return kafka.consumer({ groupId });
}

// ─── Fire-and-Forget Live Event Publisher ───
export async function emitLiveEvent(event: WorkflowLiveEvent): Promise<void> {
  try {
    const producer = await getKafkaProducer();
    await producer.send({
      topic: TOPIC_LIVE_EVENTS,
      messages: [
        {
          key: event.workflowId,
          value: JSON.stringify(event),
        },
      ],
    });
  } catch (error) {
    console.error(
      `[Kafka] Failed to emit live event (${event.type}) for workflow ${event.workflowId}:`,
      error
    );
  }
}
