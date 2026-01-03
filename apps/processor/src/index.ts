import { prismaClient } from "@repo/db/client";

import { Kafka } from "kafkajs";
import { retryLogic } from "./lib/retry.js";

const TOPIC_NAME = "First-Client";


const kafka = new Kafka({
  brokers: ["localhost:9092"],
  clientId: "Processing App",
});
async function main() {
  const producer = kafka.producer();
  
  await retryLogic(async () => {
    await producer.connect();
    console.log("Producer connected to kafka successfully");
  }, 3);

  while (true) {
    try {
      const pendingRows = await prismaClient.workflowExecutionTable.findMany({
        // take: 10,
        where : {sent : false}
      });
      if (pendingRows.length > 0) {
        await producer.send({
          topic: TOPIC_NAME,
          
          messages: pendingRows.map((r) => ({
            value: r.workflowExecutionId,
          })),
        });

        await prismaClient.workflowExecutionTable.updateMany({
          where: { id: { in: pendingRows.map((r) => r.id) } },
          data : {sent : true}
        });
        console.log(`Published to kafka with ${pendingRows.length} to kafka `);
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log("Processing Error", error);
      // Continue loop even if there's an error
    }
  }
}

main();
