import { prismaClient } from "@repo/db/client";

async function updateNode() {
  await prismaClient.node.update({
    where: { id: 'f058ac5a-f329-4d6f-986a-e9a1f65d0b14' },
    data: {
      config: {
        to: 'iamvamsi0@gmail.com',
        subject: 'Test from BuildFlow - Self Send',
        body: 'This email is sent from and to the same account: iamvamsi0@gmail.com'
      }
    }
  });
  console.log('✅ Updated node config');
}

updateNode();
