import { createKafkaConsumer, TOPIC_WORKFLOW_EXECUTIONS } from "@repo/kafka";
import { executeWorkflow } from "./engine/executor.js";
import { ExecutionRegister } from "@repo/nodes";

ExecutionRegister.initialize();

async function main() {
  const consumer = createKafkaConsumer("buildflow-worker-group");
  await consumer.connect();

  await consumer.subscribe({
    topic: TOPIC_WORKFLOW_EXECUTIONS,
    fromBeginning: true,
  });
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const workflowExecutionId = message.value?.toString();
      console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
        topic,
      });
      if (!workflowExecutionId) {
        console.warn("message not found  skipping");
        return ;
      }
      console.log(`Recieved workflowExecutionId ${workflowExecutionId}`);
      console.log("The value we get from processor", message.value);
      console.log(
        "The value we get from processor to make it string",
        message.value?.toString()
      );
     const result =  await executeWorkflow(workflowExecutionId)
     console.log("This is the result fo the execuitng" , result)
      // await new Promise((r) => setTimeout(r, 5000));

      console.log("Processing Job Done");

      try {
        await consumer.commitOffsets([
          {
            topic: TOPIC_WORKFLOW_EXECUTIONS,
            partition: partition,

            offset: (parseInt(message.offset) + 1).toString(),
          },
        ]);
      } catch (error) {
        console.log(`Failed for ${workflowExecutionId}`, error);
      }
      console.log(typeof message.offset);
    },
  });
}

main().catch((error) => {
  console.error("failed , fatal error", error);
});
