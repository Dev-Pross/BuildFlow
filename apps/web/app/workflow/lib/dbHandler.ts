'use server'

import { prismaClient } from "@repo/db";

export const getEmptyWorkflow = async() =>{
  const workflow_id = await prismaClient.workflow.findFirst({
    where:{
      isEmpty: true
    },
    orderBy:{
      createdAt: 'desc'
    }
  });
  return workflow_id || null
}
