import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "Processing App",
  brokers: ["localhost:9092"],
});
const TOPIC_NAME = "First-Client";

async function main() {
  const consumer = kafka.consumer({ groupId: "test-group" });
  await consumer.connect();

  await consumer.subscribe({
    topic: TOPIC_NAME,
    fromBeginning: true,
  });
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
        topic
      });
      await new Promise((r) => setTimeout(r, 5000));

      console.log("Processing Job Done");

      await consumer.commitOffsets([
        {
          topic: TOPIC_NAME,
          partition: partition,

          offset: (parseInt(message.offset) + 1).toString()
        },
      ]);
      console.log(typeof message.offset);
    },
  });
}

main();
