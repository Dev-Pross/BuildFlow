import { Router } from 'express';
import { prismaClient } from '@repo/db/client'
import { GoogleSheetNode } from '@repo/nodes';

const router: Router = Router()

router.post('/test-execute', async(req, res)=>{
    try{
        const { userId, nodeType, config } = req.body;

        const workflow  = await prismaClient.workflow.create({
            data  : {
                id: `workflow_test_${Date.now()}`,
                userId: userId,
                name: `Test ${nodeType} - ${new Date().toISOString()}`,
                description: 'Auto-created for testing',
                status: 'Start',
                config: {}
            }      
        });

        const availableNode = await prismaClient.availableNode.findUnique({
            where:{
                type: nodeType
            }
        });

        if(!availableNode){
            return res.status(404).json({error:"NOde type not found"})
        }

        const node = await prismaClient.node.create({
            data:{
                id: `node_test_${Date.now()}`,
                workflowId: workflow.id,
                config: config,
                typeId: availableNode.id,
                position: 1,
                name: `${availableNode.name} Node`
            }
        })

        const workflowExecution = await prismaClient.workflowExecution.create({
            data : {
                id: `exec_${Date.now()}`,
                workflowId: workflow.id,
                status: 'InProgress',
                metadata: {}

            }
        });

        const nodeExecution = await prismaClient.nodeExecution.create({
            data: {
                id: `node_exec_${Date.now()}`,
                workflowExecId: workflowExecution.id,
                status: 'InProgress',
                nodeId: node.id
            }
        });

        const executor = GoogleSheetNode.getExecutor()
        const result = await executor.execute({
            nodeId: node.id,
            userId: userId,
            config: config,
            inputData: null
        });

        await prismaClient.nodeExecution.update({
            where: {
                id: nodeExecution.id
            },
            data:{
                status: result.success ? 'Completed' : 'Failed',
                outputData: result.output ? result.output : null,
                error: result.error ? result.error : null,
                completedAt: new Date()
            }
        });

        await prismaClient.workflowExecution.update({
            where:{
                id: workflowExecution.id
            },
            data: {
                status: result.success ? 'Completed' : 'Failed',
                completedAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            workflowId: workflow.id,
            nodeId: node.id,
            workflowExecutionId: workflowExecution.id,
            nodeExecution: nodeExecution.id,
            result: result 
        });
    }
    catch(e){
        res.status(500).json({
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error'
        })
    }
});

export default router;