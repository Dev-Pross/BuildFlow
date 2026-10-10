import { prismaClient } from "@repo/db/client";

import { getKafkaProducer, TOPIC_WORKFLOW_EXECUTIONS } from "@repo/kafka";
import { retryLogic } from "./lib/retry.js";

async function main() {
  let producer = await getKafkaProducer();

  while (true) {
    try {
      const pendingRows = await prismaClient.workflowExecutionTable.findMany({
        // take: 10,
        where : {sent : false}
      });
      if (pendingRows.length > 0) {
        await producer.send({
          topic: TOPIC_WORKFLOW_EXECUTIONS,
          
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
