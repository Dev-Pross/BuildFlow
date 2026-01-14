// import { prismaClient } from "@repo/db/client";
import { prismaClient } from ".";
async function setupTestWorkflow() {
  console.log("🔧 Setting up test workflow...");

  // Step 1: Create AvailableNode for Gmail
  const availableNode = await prismaClient.availableNode.upsert({
    where: { id: "gmail_node_001" },
    update: {},
    create: {
      id: "gmail_node_001",
      name: "Gmail",
      type: "gmail",
      description: "Send emails via Gmail",
    //   category: "Communication",
      config: {
        to: { type: "string", required: true },
        subject: { type: "string", required: true },
        body: { type: "string", required: true },
      },
    },
  });
  console.log("✅ AvailableNode created:", availableNode.id);

  // Step 2: Check for existing credential
  const credential = await prismaClient.credential.findFirst({
    where: { type: "google_oauth" },
  });

  if (!credential) {
    console.error("❌ No Gmail credential found!");
    console.log("👉 Connect Gmail via your frontend first");
    return;
  }
  console.log("✅ Found credential:", credential.id);

  // Step 3: Create Workflow
  const workflow = await prismaClient.workflow.upsert({
    where: { id: "test_workflow_001" },
    update: {},
    create: {
      id: "test_workflow_001",
      name: "Test Gmail Workflow",
      description: "Testing Gmail integration",
      userId: credential.userId,
      config: {}, // Add required 'config' field
      status: "InProgress"
    },
  });
  console.log("✅ Workflow created:", workflow.id);

  // Step 4: Create Node with credential
  const node = await prismaClient.node.upsert({
    where: { id: "test_node_001" },
    update: {},
    create: {
      id: "test_node_001",
      name: "Send Test Email",
      stage: 1,
      position : {x : 250 , y : 200},
      workflowId: workflow.id,
      AvailableNodeID: availableNode.id,
      config: {
        to: "iamvamsi0@gmail.com",  // ← CHANGE THIS!
        subject: "BuildFlow Test Email",
        body: "This is a test email from BuildFlow worker!",
      },
      credentials: {
        connect: { id: credential.id },
      },
    },
  });
  console.log("✅ Node created:", node.id);

  // Step 5: Create WorkflowExecution
  const execution = await prismaClient.workflowExecution.create({
    data: {
      id: "test_exec_001",
      workflowId: workflow.id,
      status: "Pending",
      metadata: {
        trigger: "manual",
        timestamp: new Date().toISOString(),
      },
    },
  });
  console.log("✅ Execution created:", execution.id);

  console.log("\n🎉 Test workflow ready!");
  console.log("📧 Email will be sent to: your-email@gmail.com");
}

setupTestWorkflow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
