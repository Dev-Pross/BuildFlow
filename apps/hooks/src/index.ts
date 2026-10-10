
import { prismaClient } from "@repo/db/client";
import { emitLiveEvent } from "@repo/kafka";

import express from "express";
const app = express();
app.use(express.json());

app.post("/hooks/catch/:userId/:workflowId/:uniqueId", async (req, res) => {
  try {

    console.log("THIS LOG IS FROM HOOKS BACKEND THAT WE HAVE RECIEVED THE REQUEST")
    const { userId, workflowId, uniqueId } = req.params;
    const result = await prismaClient.$transaction(async (tx) => {
      console.log("Request Recieved to hooks backed with", userId, workflowId, uniqueId);

      const workflow = await tx.workflow.findFirst({
        where: { id: workflowId, userId },
        include: { Trigger: true, nodes: { orderBy: { position: "asc" } } },
      });
      if (!workflow || !workflow.Trigger) {
        throw new Error("Workflow not found or access denied");
      }

      if (workflow.Trigger.id != uniqueId)
        throw new Error("Webhook trigger is invalid or has been replaced");

      const webhookPayload = {
        body: req.body || {},
        headers: req.headers || {},
        query: req.query || {},
        method: req.method,
        receivedAt: new Date().toISOString()
      }

      const workflowExecution = await tx.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          status: "Pending",
          metadata: webhookPayload,
        },
      });

      const outBox = await tx.workflowExecutionTable.create({
        data: {
          workflowExecutionId: workflowExecution.id,
        },
      });
      return { workflowExecution, webhookPayload };
    });

    // Broadcast real-time webhook event over Kafka for instant ConfigModal testing
    await emitLiveEvent({
      type: "TEST_WEBHOOK",
      workflowId,
      executionId: result.workflowExecution.id,
      metadata: result.webhookPayload,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      workflowExecutionId: result.workflowExecution.id,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(error.message.includes("not found") || error.message.includes("invalid") ? 404 : 500).json({
      success: false,
      error: error.message || "Failed to process webhook"
    });
  }
});

app.listen(3003, () => {
  console.log("Server running on 3003");
});
