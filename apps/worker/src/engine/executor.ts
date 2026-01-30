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
            orderBy: { stage: "asc" },
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
    console.log(`${node.name}, ${node.stage}, ${node.id}th - started Execution`);
    const nodeType = node.AvailableNode.type;
    // Create mutable copy of config
    const nodeConfig = { ...(node.config as Record<string, any>) };
    
    // Properly concatenate body with input data
    if (nodeConfig.body && currentInputData) {
      const inputStr = typeof currentInputData === 'object' 
        ? JSON.stringify(currentInputData) 
        : String(currentInputData);
      nodeConfig.body = nodeConfig.body + inputStr;
    }
    const context = {
      // nodeId: node.id,
      userId: data.workflow.userId,
      credId: node.CredentialsID,
      // config: node.config as Record<string, any>,
      config: nodeConfig,
      inputData: currentInputData,
    };
    console.log(`Executing with context: ${JSON.stringify(context)}`);
    console.log(`Executing with context: ${context.credId}`);

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
