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
  outputData: any;
}

// Result tracking for looped executions
interface LoopExecutionResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  failures: Array<{ row: number; error: string; retries: number }>;
  results: any[];
}

/**
 * Checks if inputData is spreadsheet data that should trigger looping
 */
function isSpreadsheetInput(data: any): boolean {
  return data?.rows && Array.isArray(data.rows) &&
         data?.columns && typeof data.columns === 'object' &&
         data?.dataStartIndex !== undefined;
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
    let nodeConfig = { ...(node.config as Record<string, any>) };
    
    // Build interpolation context from all previously executed nodes
    const interpolationContext = buildInterpolationContext(executedNodeOutputs);
    console.log(`[Interpolation] Before: ${JSON.stringify(interpolationContext)}`);
    // Resolve any {{variable}} references in the config
    console.log(`[nodeConfig] Before: ${JSON.stringify(nodeConfig)}`);
    nodeConfig = resolveConfigVariables(nodeConfig, interpolationContext);
    console.log(`[Interpolation] After: ${JSON.stringify(nodeConfig)}`);
    
    // Properly concatenate body with input data (legacy behavior, skip for spreadsheet loop)
    if (nodeConfig.body && currentInputData && !isSpreadsheetInput(currentInputData)) {
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

    // Check if we need to loop (inputData is spreadsheet + config has column variables)
    const shouldLoop = isSpreadsheetInput(currentInputData) && 
      JSON.stringify(node.config).includes('{{');
    
    let execute: { success: boolean; output?: any; error?: string };

    if (shouldLoop) {
      // === AUTO-LOOP: Execute node once per data row ===
      console.log(`[Loop] Detected spreadsheet input for ${node.name}, looping through rows...`);
      const spreadsheet = currentInputData as any;
      const startIdx = spreadsheet.dataStartIndex ?? 1;
      const totalRows = spreadsheet.rows.length - startIdx;
      console.log(`[Loop] Processing ${totalRows} data rows (starting at index ${startIdx})`);

      const loopResult: LoopExecutionResult = {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        failures: [],
        results: []
      };

      for (let rowIdx = startIdx; rowIdx < spreadsheet.rows.length; rowIdx++) {
        loopResult.totalProcessed++;
        
        // Set _currentRowIndex on the spreadsheet data for column resolution
        const rowContext = { ...spreadsheet, _currentRowIndex: rowIdx };
        
        // Rebuild interpolation context with current row index
        const loopOutputs = executedNodeOutputs.map(o => {
          if (o.outputData === currentInputData) {
            return { ...o, outputData: rowContext };
          }
          return o;
        });
        const loopInterpolationCtx = buildInterpolationContext(loopOutputs);
        
        // Re-resolve config with current row
        const originalConfig = { ...(node.config as Record<string, any>) };
        const resolvedRowConfig = resolveConfigVariables(originalConfig, loopInterpolationCtx);
        
        console.log(`[Loop] Row ${rowIdx}: resolved config = ${JSON.stringify(resolvedRowConfig)}`);
        
        const rowCtx = {
          userId: data.workflow.userId,
          credentialId: node.CredentialsID,
          config: resolvedRowConfig,
          inputData: rowContext,
        };

        // Retry logic: up to 3 attempts per row
        let rowSuccess = false;
        let lastError: string | undefined;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const rowResult = await ExecutionRegister.execute(nodeType, rowCtx);
            if (rowResult.success) {
              rowSuccess = true;
              loopResult.successful++;
              loopResult.results.push(rowResult.output);
              break;
            } else {
              lastError = rowResult.error;
              console.log(`[Loop] Row ${rowIdx} attempt ${attempt} failed: ${lastError}`);
            }
          } catch (err) {
            lastError = err instanceof Error ? err.message : 'Unknown error';
            console.log(`[Loop] Row ${rowIdx} attempt ${attempt} threw: ${lastError}`);
          }
          
          if (attempt < 3) {
            await delay(200 * attempt); // Backoff: 200ms, 400ms
          }
        }

        if (!rowSuccess) {
          loopResult.failed++;
          loopResult.failures.push({
            row: rowIdx,
            error: lastError || 'Unknown error',
            retries: 3
          });
        }

        // Rate limiting delay between iterations
        await delay(100);
      }

      console.log(`[Loop] Completed: ${loopResult.successful}/${loopResult.totalProcessed} successful, ${loopResult.failed} failed`);

      // Loop completes even if some rows fail
      const hasFailures = loopResult.failed > 0;
      execute = {
        success: !hasFailures,
        output: loopResult,
        error: hasFailures 
          ? JSON.stringify({
              summary: `${loopResult.failed}/${loopResult.totalProcessed} rows failed`,
              failures: loopResult.failures
            })
          : undefined
      };
    } else {
      // === SINGLE EXECUTION (no loop) ===
      const context = {
        userId: data.workflow.userId,
        credentialId: node.CredentialsID,
        config: nodeConfig,
        inputData: currentInputData,
      };
      console.log(`Executing with context: ${JSON.stringify(context)}`);
      execute = await ExecutionRegister.execute(nodeType, context);
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
        },
      });

      await prismaClient.nodeExecution.update({
        where: {id: nodeExecution.id},
        data:{
          status: "Failed" ,
          error: execute.error,
          outputData: isPartialFailure ? execute.output : undefined,
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
    
    // Store this node's output for variable resolution in subsequent nodes
    executedNodeOutputs.push({
      nodeName: node.name,
      outputData: execute.output
    });
    console.log(`[Interpolation] Added ${node.name} output to context. Total nodes in context: ${executedNodeOutputs.length}`);
    
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
