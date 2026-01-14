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
  if (!update.error) console.log("updated the workflow execution");

  const nodes = data?.workflow.nodes;

  console.log(`Total nodes - ${nodes.length}`);
  for (const node of nodes) {
    console.log(`${node.name}, ${node.position}th - started Execution`);
    const nodeType = node.AvailableNode.type;
    const context = {
      // nodeId: node.id,
      userId: data.workflow.userId,
      credId: node.credentials[0]?.id,
      config: node.config as Record<string, any>,
      inputData: currentInputData,
    };
    console.log(`Executing with context: ${context}`);
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
    console.log("output: ", JSON.stringify(execute));
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
