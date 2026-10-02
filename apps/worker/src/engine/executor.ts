import { prismaClient } from "@repo/db/client";
// import { register } from "./registory.js";
import { ExecutionRegister } from "@repo/nodes";
import {
  resolveConfigVariables,
  buildInterpolationContext,
  InterpolationContext
} from "@repo/common/zod";

// Track node outputs during workflow execution for variable resolution
interface NodeExecutionOutput {
  nodeName: string;
  nodeId?: string;
  outputData: any;
}

interface QueueItem {
  nodeId: string;
  inputData: any;
}

// Result tracking for looped executions
interface LoopExecutionResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  failures: Array<{ row: number; error: string; retries: number }>;
  skippedRows: Array<{ row: number; reason: string }>;
  results: any[];
}



/**
 * Small delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeWorkflow(
  workflowExecutionId: string
): Promise<void> {
  try {
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
            },
            Trigger: true,
          },
        },
        nodeExecutions: true
      },
    });

    // Collect outputs from all executed nodes for variable interpolation
    const executedNodeOutputs: NodeExecutionOutput[] = [];

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
    // for (const node of nodes) {
    //   console.log(`${node.name}, ${node.stage}, ${node.id}th - started Execution`);
    //   const nodeExecution = await prismaClient.nodeExecution.create({
    //     data: {
    //       nodeId: node.id,
    //       workflowExecId: workflowExecutionId,
    //       status: "Start",
    //       inputData: currentInputData ? currentInputData : {},
    //       startedAt: new Date()
    //     }
    //   })
    //   const nodeType = node.AvailableNode.type;

    //   // Create mutable copy of config
    //   let nodeConfig = { ...(node.config as Record<string, any>) };

    //   // Build interpolation context from all previously executed nodes
    //   const interpolationContext = buildInterpolationContext(executedNodeOutputs);
    //   for (const out of executedNodeOutputs) {
    //     if (out.nodeId) interpolationContext[out.nodeId] = out.outputData;
    //   }
    //   console.log(`[Interpolation] Before: ${JSON.stringify(interpolationContext)}`);
    //   // Resolve any {{variable}} references in the config
    //   console.log(`[nodeConfig] Before: ${JSON.stringify(nodeConfig)}`);
    //   nodeConfig = resolveConfigVariables(nodeConfig, interpolationContext);
    //   console.log(`[Interpolation] After: ${JSON.stringify(nodeConfig)}`);

    //   // NOTE: Removed legacy body concatenation that appended raw JSON to email body.
    //   // Variables should be resolved via the {{interpolation}} system instead.
    //   if (!node.CredentialsID) {
    //     await prismaClient.workflowExecution.update({
    //       where: { id: workflowExecutionId },
    //       data: {
    //         status: "Failed",
    //         error: "Credential id not found",
    //         completedAt: new Date(),
    //       },
    //     });

    //     await prismaClient.nodeExecution.update({
    //       where: { id: nodeExecution.id },
    //       data: {
    //         status: "Failed",
    //         error: "Credential id not found",
    //         completedAt: new Date()
    //       }
    //     })
    //     return;
    //   }

    //   // Check if we need to loop (inputData is spreadsheet + config has column variables)


    //   let execute: { success: boolean; output?: any; error?: string };


    //   if (!execute.success) {
    //     // Check if it's a partial loop failure (some rows succeeded)
    //     const isPartialFailure = execute.output?.successful > 0 && execute.output?.failed > 0;

    //     await prismaClient.workflowExecution.update({
    //       where: { id: workflowExecutionId },
    //       data: {
    //         status: "Failed",
    //         error: execute.error,
    //         completedAt: new Date(),
    //       }
    //     });

    //     await prismaClient.nodeExecution.update({
    //       where: { id: nodeExecution.id },
    //       data: {
    //         status: "Failed",
    //         error: execute.error,
    //         outputData: isPartialFailure ? execute.output : undefined,
    //         completedAt: new Date()
    //       }
    //     })
    //     return;
    //   }
    //   await prismaClient.nodeExecution.update({
    //     where: { id: nodeExecution.id },
    //     data: {
    //       completedAt: new Date(),
    //       outputData: execute.output,
    //       status: "Completed"
    //     }
    //   })

    //   // Store this node's output for variable resolution in subsequent nodes
    //   executedNodeOutputs.push({
    //     nodeName: node.name,
    //     nodeId: node.id,
    //     outputData: execute.output
    //   });
    //   console.log(`[Interpolation] Added ${node.name} output to context. Total nodes in context: ${executedNodeOutputs.length}`);

    //   currentInputData = execute.output;

    //   console.log("output: ", JSON.stringify(execute));
    // }
    const allEdges = (data.workflow.Edges as any[]) || [];
    const triggerId = data.workflow.Trigger?.id;
    const triggerOutgoingEdges = triggerId ? allEdges.filter(e => e.source === triggerId) : [];

    // Inject Trigger metadata into execution context so downstream nodes can access {{webhook.body}}
    if (data.workflow.Trigger) {
      executedNodeOutputs.push({
        nodeName: data.workflow.Trigger.name,
        nodeId: data.workflow.Trigger.id,
        outputData: data.metadata,
      });
      console.log(`[Interpolation] Injected Trigger payload into context: ${JSON.stringify(data.metadata)}`);
    }

    const queue: QueueItem[] = [];
    const executedNodeIds = new Set<string>();

    if (triggerOutgoingEdges.length > 0) {
      for (const edge of triggerOutgoingEdges) {
        queue.push({
          nodeId: edge.target,
          inputData: data?.metadata
        });
      }
    } else {
      // Legacy fallback
      const firstActionNode = data.workflow.nodes.find(n => n.stage === 0);
      if (!firstActionNode) {
        console.log("No Trigger node found!");
        await prismaClient.workflowExecution.update({
          where: { id: workflowExecutionId },
          data: {
            status: "Failed",
            completedAt: new Date(),
            error: "No Trigger node found!"
          }
        });
        return;
      }
      queue.push({
        nodeId: firstActionNode.id,
        inputData: data?.metadata
      });
    }

    while (queue.length > 0) {
      const currentTask = queue.shift()
      if (!currentTask || !currentTask.nodeId) continue;
      
      // Prevent infinite loops or multiple executions of the same node
      if (executedNodeIds.has(currentTask.nodeId)) {
        console.log(`Node ${currentTask.nodeId} already executed, skipping...`);
        continue;
      }
      executedNodeIds.add(currentTask.nodeId);

      let currentInputData = currentTask.inputData;

      const node = data.workflow.nodes.find(n => n.id === currentTask.nodeId)
      if (!node) {
        console.log(`Failed to find node with ID ${currentTask?.nodeId}`);
        await prismaClient.workflowExecution.update({
          where: { id: workflowExecutionId },
          data: {
            status: "Failed",
            error: `Failed to find node with ID ${currentTask?.nodeId}`,
            completedAt: new Date()
          }
        })
        return
      }

      console.log(`Executing Action: ${node?.id}`)
      // creating a row in db
      const nodeExecution = await prismaClient.nodeExecution.create({
        data: {
          nodeId: node.id,
          workflowExecId: workflowExecutionId,
          status: "Start",
          inputData: currentInputData ? currentInputData : {},
          startedAt: new Date()
        }
      })

      // checking node type
      const nodeType = node?.AvailableNode;
      let nodeConfig = { ...(node.config as Record<string, any>) };

      let itemsToProcess = [];
      if (Array.isArray(currentInputData)) {
        if (currentInputData.length > 0 && Array.isArray(currentInputData[0])) {
          itemsToProcess = currentInputData[0]
        }
        else
          itemsToProcess = currentInputData
      }
      else {
        itemsToProcess = currentInputData ? [{ json: currentInputData }] : []
      }


      // Build interpolation context from all previously executed nodes
      const interpolationContext = buildInterpolationContext(executedNodeOutputs);
      for (const out of executedNodeOutputs) {
        if (out.nodeId) interpolationContext[out.nodeId] = out.outputData;
      }
      console.log(`[Interpolation] Before: ${JSON.stringify(interpolationContext)}`);
      // Resolve any {{variable}} references in the config
      console.log(`[nodeConfig] Before: ${JSON.stringify(nodeConfig)}`);
      const itemsConfig = itemsToProcess.map(e =>
        resolveConfigVariables({ ...node.config as Record<string, any> },
          interpolationContext, e?.sourceRefs
        )
      )
      nodeConfig = resolveConfigVariables(nodeConfig, interpolationContext, itemsToProcess[0]?.sourceRefs);
      console.log(`[Interpolation] After: ${JSON.stringify(nodeConfig)}`);

      //  checking node authentication with credential id
      if (nodeType.requireAuth) {
        if (!node.CredentialsID) {
          await prismaClient.workflowExecution.update({
            where: { id: workflowExecutionId },
            data: {
              status: "Failed",
              error: "Credential id not found",
              completedAt: new Date(),
            },
          });

          await prismaClient.nodeExecution.update({
            where: { id: nodeExecution.id },
            data: {
              status: "Failed",
              error: "Credential id not found",
              completedAt: new Date()
            }
          })
          return;
        }
      }

      const context = {
        nodeId: node.id,
        userId: data.workflow.userId,
        credentialId: node.CredentialsID!,
        config: itemsConfig.length > 0 ? itemsConfig : [nodeConfig],
        items: itemsToProcess.length > 0 ? itemsToProcess : [{ json: {} }]
      }
      let execute: { success: boolean; output?: any; error?: string };

      try {
        execute = await ExecutionRegister.execute(nodeType.type, context);
      } catch (err: any) {
        execute = { success: false, error: err.message || "Unknown error" };
      }

      if (!execute.success) {
        // Check if it's a partial loop failure (some rows succeeded)
        const isPartialFailure = execute.output?.successful > 0 && execute.output?.failed > 0;

        await prismaClient.workflowExecution.update({
          where: { id: workflowExecutionId },
          data: {
            status: "Failed",
            error: execute.error,
            completedAt: new Date(),
          }
        });

        await prismaClient.nodeExecution.update({
          where: { id: nodeExecution.id },
          data: {
            status: "Failed",
            error: execute.error,
            outputData: isPartialFailure ? execute.output : undefined,
            completedAt: new Date()
          }
        })
        return;
      }
      await prismaClient.nodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          completedAt: new Date(),
          outputData: execute.output,
          status: "Completed"
        }
      })

      // Store this node's output for variable resolution in subsequent nodes
      executedNodeOutputs.push({
        nodeName: node.name,
        nodeId: node.id,
        outputData: execute.output
      });

      console.log(`[Interpolation] Added ${node.name} output to context. Total nodes in context: ${executedNodeOutputs.length}`);
      console.log("output: ", JSON.stringify(execute));

      const allEdges = (data.workflow.Edges as any[]) || []
      const outgoingEdges = allEdges.filter(
        (edge) => edge.source === node.id
      )

      for (const edge of outgoingEdges) {
        // Resolve pin index from sourceHandle (e.g. "out-0", "out-1", "a-out" -> 0)
        const match = edge.sourceHandle ? String(edge.sourceHandle).match(/\d+$/) : null;
        const outputPinIndex = match ? parseInt(match[0], 10) : 0;

        // Safe extraction from 2D Output Matrix ([wireIndex][rowIndex])
        const is2DMatrix = Array.isArray(execute.output) && Array.isArray(execute.output[0]);
        const branchData = is2DMatrix
          ? (execute.output[outputPinIndex] ?? execute.output[0] ?? [])
          : (execute.output ?? []);

        queue.push({
          nodeId: edge.target,
          inputData: branchData
        });

        console.log(`Pushed Node ${edge.target} with pin index ${outputPinIndex} into the queue!`);
      }
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
  catch (err: any) {
    //update workflow with failed message
  }
}
