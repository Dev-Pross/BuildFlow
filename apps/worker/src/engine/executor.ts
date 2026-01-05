import { prismaClient } from "@repo/db/client";
import { register } from "./registory.js";
export async function executeWorkflow(
  workflowExecutionId: string
): Promise<void> {
  console.log(`workflowExecutionId is ${workflowExecutionId}`);
  const data = await prismaClient.workflowExecution.findUnique({
    where: { id: workflowExecutionId },
    include: {
      workflow: {
        include: {
          nodes: {
            include: {
              AvailableNode: true,
              credentials: true,
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  let currentInputData = data?.metadata;
  if (!data) {
    console.log(`No workflow execution found for id ${workflowExecutionId}`);
    return;
  }

  const update = await prismaClient.workflowExecution.update({
    where: {
      id: workflowExecutionId,
    },
    data: {
      status: "InProgress",
    },
  });

  const nodes = data?.workflow.nodes;

  for (const node of nodes) {
    const nodeType = node.AvailableNode.type;
    const context = {
      nodeId: node.id,
      userId: data.workflow.userId,
      credentialId: node.credentials[0]?.id,
      config: node.config as Record<string, any>,
      inputData: currentInputData,
    };

    const execute = await register.execute(nodeType, context);
    if (!execute.success) {
      await prismaClient.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: {
          status: "Failed",
          error: execute.error,
          completedAt: new Date(),
        },
      });
      return;
    }
    currentInputData = execute.output;
  }
  const updatedStatus = await prismaClient.workflowExecution.update({
    where: { id: workflowExecutionId },
    data: {
      status: "Completed",
      completedAt: new Date(),
    },
  });
  console.log(updatedStatus);
}
