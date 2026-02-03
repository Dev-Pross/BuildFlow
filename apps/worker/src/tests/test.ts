import { executeWorkflow } from "../engine/executor.js";
// import { register } from "../engine/registory.js";
import { ExecutionRegister as register } from "@repo/nodes";
async function testDirect() {
  console.log("🧪 Testing Gmail integration directly...\n");

  // Initialize registry
  register.initialize();

  // Use the NEW execution ID from setup
  await executeWorkflow("83b1e9ef-c8f2-45a6-9f91-ef48d29fbb4c");

  console.log("\n✅ Test complete! Check your email inbox.");
}

testDirect().catch(console.error);



import { prismaClient } from "@repo/db/client";

async function debug() {
  const executionId = "ca4210e3-c830-408e-a86d-961508e9b325";
  
  // Step 1: Get execution only
  const execution = await prismaClient.workflowExecution.findUnique({
    where: { id: executionId }
  });
  console.log("Execution:", execution);
  
  if (execution?.workflowId) {
    // Step 2: Get workflow
    const workflow = await prismaClient.workflow.findUnique({
      where: { id: execution.workflowId },
      include: { nodes: true }
    });
    console.log("Workflow:", workflow);
    console.log("Number of nodes:", workflow?.nodes?.length);
  }
}

debug();
