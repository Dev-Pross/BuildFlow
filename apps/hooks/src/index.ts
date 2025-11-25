import { prismaClient, Prisma } from "@repo/db/client";
import express from "express";

const app = express();
app.use(express.json());

app.post("/hooks/catch/:userId/:workflowId", async (req, res) => {
  const userId = req.params.userId;
  const workflowId = req.params.workflowId;

  try {
    const result = await prismaClient.$transaction(
      async (tx) => {
        const workflow = await tx.workflow.create({
          data: {
            id: workflowId,
            userId,
            name: "Sample Workflow",
            description: "Auto-generated workflow",
            status: "Start",
            config: {},
          },
        });

        const workflowExecution = await tx.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: "Start",
            metadata: {},
          },
        });

        return { workflow, workflowExecution };
      }
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.listen(3002, () => console.log("Server listening on port 3002"));
