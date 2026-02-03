import { prismaClient } from "@repo/db/client";
// import { register } from "./registory.js";
import { ExecutionRegister } from "@repo/nodes";
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
    const nodeExecution = await prismaClient.nodeExecution.create({
      data:{
        nodeId: node.id,
        workflowExecId: workflowExecutionId,
        status: "Start",
        inputData: currentInputData ? currentInputData : {},
        startedAt: new Date()
      }
    })
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
    if(!node.CredentialsID){
      await prismaClient.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: {
          status: "Failed",
          error: "Credential id not found",
          completedAt: new Date(),
        },
      });

      await prismaClient.nodeExecution.update({
        where: {id: nodeExecution.id},
        data:{
          status: "Failed",
          error: "Credential id not found",
          completedAt: new Date()
        }
      })
      return;
    }
    const context = {
      // nodeId: node.id,
      userId: data.workflow.userId,
      credentialId: node.CredentialsID,
      // config: node.config as Record<string, any>,
      config: nodeConfig,
      inputData: currentInputData,
    };
    console.log(`Executing with context: ${JSON.stringify(context)}`);
    console.log(`Executing with context: ${context.credentialId}`);

    const execute = await ExecutionRegister.execute(nodeType, context);
    if (!execute.success) {
      await prismaClient.workflowExecution.update({
        where: { id: workflowExecutionId },
        data: {
          status: "Failed",
          error: execute.error,
          completedAt: new Date(),
        },
      });

      await prismaClient.nodeExecution.update({
        where: {id: nodeExecution.id},
        data:{
          status: "Failed",
          error: execute.error,
          completedAt: new Date()
        }
      })
      return;
    }
    await prismaClient.nodeExecution.update({
      where: {id: nodeExecution.id},
      data: {
        completedAt: new Date(),
        outputData: execute.output,
        status: "Completed"
      }
    })
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
