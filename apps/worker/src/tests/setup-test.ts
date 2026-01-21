import { prismaClient } from "@repo/db/client";

async function setupTestWorkflow() {
  const userId = "b3be6569-f174-4ea6-b2b9-05a62b75b280"; // Your user ID
  
  console.log("🔧 Setting up test workflow...\n");
  
  // 1. Find your credential
  const credential = await prismaClient.credential.findFirst({
    where: { 
      userId: userId,
      type: "google_oauth"
    }
  });
  
  if (!credential) {
    console.log("❌ No credential found! Create one from frontend first.");
    return;
  }
  console.log("✅ Found credential:", credential.id);
  
  // 2. Find AvailableNode for Gmail
  const availableNode = await prismaClient.availableNode.findFirst({
    where: { type: "gmail" }
  });
  
  if (!availableNode) {
    console.log("❌ Gmail node not found in AvailableNode table!");
    console.log("Available node types:");
    const nodes = await prismaClient.availableNode.findMany();
    nodes.forEach(n => console.log("-", n.type));
    return;
  }
  console.log("✅ Found AvailableNode:", availableNode.type);
  
  // 3. Create workflow
  const workflow = await prismaClient.workflow.create({
    data: {
      name: "Test Gmail Workflow",
      userId: userId,
      description : "First Workflow Creating for Testing" ,
      config : {}
    }
  });
  console.log("✅ Created workflow:", workflow.id);
  
  // 4. Create node
  const node = await prismaClient.node.create({
    data: {
      name: "Send Test Email",
      workflowId: workflow.id,
      AvailableNodeID: availableNode.id,
      position: 0,
      stage : 1,
      config: {
        to: "iamvamsi0@gmail.com",
        subject: "Test from BuildFlow Worker",
        body: "This is a test email sent from the worker!"
      }
    }
  });
  console.log("✅ Created node:", node.id);
  
  // 5. Link credential to node
  await prismaClient.credential.update({
    where: { id: credential.id },
    data: {
      nodeId: node.id
    }
  });
  console.log("✅ Linked credential to node");
  
  // 6. Create workflow execution
  const execution = await prismaClient.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      status: "Pending",
      metadata: { 
        trigger: "manual",
        from: "Test setup script"
      }
    }
  });
  
  console.log("\n🎉 Test workflow setup complete!\n");
  console.log("📋 Details:");
  console.log("  - Workflow ID:", workflow.id);
  console.log("  - Node ID:", node.id);
  console.log("  - WorkflowExecution ID:", execution.id);
  console.log("\n▶️  Run this command to test:");
  console.log(`   Update test.ts with: await executeWorkflow("${execution.id}")`);
}

setupTestWorkflow().catch(console.error);
