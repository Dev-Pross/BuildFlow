import { Response, Request, Router } from "express";
import { AuthRequest, userMiddleware } from "./userMiddleware.js"; 
import { ExecuteNode, statusCodes } from "@repo/common/zod";
import { prismaClient } from "@repo/db";
import { ExecutionRegister } from '@repo/nodes'
export const execRouter: Router = Router()

execRouter.post('/node', userMiddleware,  async(req: AuthRequest, res: Response)=>{
    try{
        if(!req.user?.sub){
            return res.status(statusCodes.BAD_REQUEST).json({
            message: "User is not logged in ",
        });
        }
        const data = req.body;
        const dataSafe = ExecuteNode.safeParse(data)
        if(!dataSafe.success){
            return res.status(statusCodes.BAD_REQUEST).json({
                message: "Invalid input"
            })
        }
        const nodeData = await prismaClient.node.findFirst({
            where: {id: dataSafe.data.NodeId},
            include: {
                AvailableNode: true
            }
        })

        if(nodeData){
            const type = nodeData.AvailableNode.type
            const config = dataSafe.data.Config ? dataSafe.data.Config : nodeData.config // for test api data prefered fist then config in db 
            // // console.log(`config and type: ${JSON.stringify(config)} & ${type}`)
            
            const context = {
                userId: req.user.sub,
                config: config,
                credentialId: nodeData.CredentialsID || config?.credentialId || ""
            }
            const result = await prismaClient.$transaction(async(tx)=>{
                // // console.log(`Execution context: ${JSON.stringify(context)}`)
                const workflowExecution = await tx.workflowExecution.create({
                    data:{
                        workflowId: nodeData.workflowId || "",
                        status: "Start",
                        startAt: new Date(),
                        metadata:{"isTesting": true},
                    }
                })
                const NodeExecution = await tx.nodeExecution.create({
                    data:{
                        status: "Start",
                        nodeId: nodeData.id,
                        workflowExecId: workflowExecution.id,
                        startedAt: new Date(),
                        inputData: context,
                        isTest: true
                    }
                })
                const executionResult = await ExecutionRegister.execute(type, context)
                    
                
                // console.log(`Execution result: ${executionResult}`)
                
                if(executionResult.success){
                    await tx.nodeExecution.update({
                        where: { id: NodeExecution.id},
                        data:{
                            status: "Completed",
                            outputData: executionResult.output,
                            completedAt: new Date()
                        }
                    })
                    await tx.workflowExecution.update({
                        where: {id: workflowExecution.id},
                        data: {
                            status: "Completed",
                            completedAt: new Date()
                        }
                    })
                    return res.status(statusCodes.ACCEPTED).json({
                        message: `${nodeData.name} node execution done` ,
                        data: executionResult       
                        })
                }
                await tx.nodeExecution.update({
                    where: {id : NodeExecution.id},
                    data:{
                        status: "Failed",
                        completedAt: new Date(),
                        error: executionResult.error
                    }
                })
                await tx.workflowExecution.update({
                    where: {id: workflowExecution.id},
                    data:{
                        status: "Failed",
                        completedAt: new Date(),
                        error: executionResult.output
                    }
                })
            })

            return res.status(statusCodes.FORBIDDEN).json({
                message: `${nodeData.name} node execution failed`
            })
        }  
        return res.status(statusCodes.NOT_FOUND).json({
            message: `${dataSafe.data.NodeId} not found`
        })      

    }catch(e){
    // console.log("This is the error from executing node", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server Error from node execution ",
      });
    }
})