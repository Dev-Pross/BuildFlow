import {prismaClient} from "@repo/db/client"

import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'Processing App',
    brokers: ['localhost:9092']
  })

  const TOPIC_NAME =  "First-Client"
async function main  () {
    const producer = kafka.producer();
    await producer.connect();


    while (1) {
        const  pedningRows = await prismaClient.workflowExecutionTable.findMany({
            where : {},
            take : 10
        }) 
        await producer.send({
            topic: TOPIC_NAME,
            messages: pedningRows.map(r => ({ value: String(r.workflowExecutionId) }))
        });

        await prismaClient.workflowExecutionTable.deleteMany({
            where : {
                id : {
                    in : pedningRows.map(r => r.id)
                }
            }
        })
    }
}
main()

console.log("Hello world");
