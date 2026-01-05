import { prismaClient } from "@repo/db/client";

async function createExecution() {
  const execution = await prismaClient.workflowExecution.create({
    data: {
      workflowId: 'f5d1ae7c-104c-44ab-ab49-917f4716e2f3',
      status: 'Pending',
      metadata: { trigger: 'manual', test: 'gmail-api-enabled' }
    }
  });
  console.log('✅ New execution created!');
  console.log('Execution ID:', execution.id);
  console.log('\n📝 Update test.ts with:');
  console.log(`await executeWorkflow("${execution.id}");`);
}

createExecution();
