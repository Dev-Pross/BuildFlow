import { prismaClient } from "@repo/db/client";
import express from "express";

const app = express();
app.use(express.json());

app.post("/hooks/catch/:userId/:workflowId", async (req, res) => {
  console.log("REcieved Here  in the initla error")

  const userId = req.params.userId;
  const Data = req.body
  try {
    const result = await prismaClient.$transaction(
      async (tx) => {
        console.log("REcieved Here")
        const workflow = await tx.workflow.create({
          data: {
            userId,
            name: "Sample Workflow",
            description: "Auto-generated workflow",
            status: "Start",
            config: {},
          },
        });
        console.log("REcieved Here  2222")

        const workflowExecution = await tx.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: "Start",
            metadata: Data
          },
        });
        console.log("REcieved Here  22222")

        // Assuming that workflowExecutionTable requires a valid workflowExecution connection
        const datInWork = await tx.workflowExecutionTable.create({
          data : {
            workflowExecution : {
              connect : {id : workflowExecution.id}
            }
          }
        });
        return { workflow, workflowExecution , datInWork };
      }
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.listen(3002, () => console.log("Server listening on port 3002"));

