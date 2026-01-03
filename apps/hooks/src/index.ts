
import { prismaClient } from "@repo/db/client";

import express from "express";
const app = express();
app.use(express.json());

app.post("/hooks/catch/:userId/:workflowId", async (req, res) => {
  try {
    const { userId, workflowId } = req.params;
    const { triggerData } = req.body;

    const result = await prismaClient.$transaction(async (tx) => {
      console.log("Request Recieved to hooks backed with", userId, workflowId);

      const workflow = await tx.workflow.findFirst({
        where: { id: workflowId, userId },
        include: { nodes: { orderBy: { position: "asc" } } },
      });
      if (!workflow) {
        throw new Error("Didn't find the work flow or unauthenticated");
      }

      const workflowExecution = await tx.workflowExecution.create({
        data: {
          workflowId: workflow.id,

          status: "Pending",
          metadata: triggerData,
        },
      });

      const outBox = await tx.workflowExecutionTable.create({
        data: {
          workflowExecutionId: workflowExecution.id,
        },
      });
      return { workflowExecution };
    });
    return res.status(200).json({
      success: true,
      workflowExecutionId:  result.workflowExecution.id,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3003, () => {
  console.log("Server running on 3003");
});
