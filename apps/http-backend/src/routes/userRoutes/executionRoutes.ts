import { Response, Request, Router } from "express";
import { AuthRequest, userMiddleware } from "./userMiddleware.js";
import { ExecuteNode, statusCodes } from "@repo/common/zod";
import { prismaClient } from "@repo/db";
import { ExecutionRegister } from '@repo/nodes'
export const execRouter: Router = Router()

function sanitizeForPrismaJson(data: any): any {
    if (data === undefined) return undefined;
    try {
        return JSON.parse(
            JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
        );
    } catch (err) {
        console.error('[sanitizeForPrismaJson] Failed to sanitize data, returning null:', err);
        return null;
    }
}

execRouter.post('/node', userMiddleware, async (req: AuthRequest, res: Response) => {


    let workflowExecutionId: string | null = null;
    let nodeExecutionId: string | null = null;
    try {
        if (!req.user?.sub) {
            return res.status(statusCodes.BAD_REQUEST).json({
                message: "User is not logged in ",
            });
        }
        const data = req.body;
        const dataSafe = ExecuteNode.safeParse(data)
        if (!dataSafe.success) {
            return res.status(statusCodes.BAD_REQUEST).json({
                message: "Invalid input"
            })
        }
        const nodeData = await prismaClient.node.findFirst({
            where: { id: dataSafe.data.NodeId },
            include: {
                AvailableNode: true
            }
        })


        if (nodeData) {
            const type = nodeData.AvailableNode.type;
            const config = dataSafe.data.Config ? dataSafe.data.Config : nodeData.config; // for test api data prefered first then config in db 

            const rawItems = dataSafe.data.items || (dataSafe.data.Config && dataSafe.data.Config.items) || [];
            const context = {
                userId: req.user.sub,
                config: [config],
                credentialId: nodeData.CredentialsID || config?.credentialId || "",
                authType: nodeData.AvailableNode.authType,
                nodeId: nodeData.id,
                items: Array.isArray(rawItems) ? rawItems : [rawItems]
            };

            // 1. Create execution records (committed immediately, no long-held transaction)
            const workflowExecution = await prismaClient.workflowExecution.create({
                data: {
                    workflowId: nodeData.workflowId || "",
                    status: "Start",
                    startAt: new Date(),
                    metadata: { "isTesting": true },
                }
            });
            workflowExecutionId = workflowExecution.id;

            const nodeExecution = await prismaClient.nodeExecution.create({
                data: {
                    status: "Start",
                    nodeId: nodeData.id,
                    workflowExecId: workflowExecution.id,
                    startedAt: new Date(),
                    inputData: sanitizeForPrismaJson(context) ?? {},
                    isTest: true
                }
            });
            nodeExecutionId = nodeExecution.id;

            // 2. Execute node outside any SQL transaction (avoids Prisma 5s timeout & pool starvation)
            const executionResult = await ExecutionRegister.execute(type, context);

            // 3. Settle records based on execution result
            if (executionResult.success) {
                await prismaClient.nodeExecution.update({
                    where: { id: nodeExecutionId },
                    data: {
                        status: "Completed",
                        outputData: sanitizeForPrismaJson(executionResult.output),
                        completedAt: new Date()
                    }
                });
                await prismaClient.workflowExecution.update({
                    where: { id: workflowExecutionId },
                    data: {
                        status: "Completed",
                        completedAt: new Date()
                    }
                });
                return res.status(statusCodes.ACCEPTED).json({
                    message: `${nodeData.name} node execution done`,
                    data: executionResult
                });
            } else {
                await prismaClient.nodeExecution.update({
                    where: { id: nodeExecutionId },
                    data: {
                        status: "Failed",
                        completedAt: new Date(),
                        error: executionResult.error
                    }
                });
                await prismaClient.workflowExecution.update({
                    where: { id: workflowExecutionId },
                    data: {
                        status: "Failed",
                        completedAt: new Date(),
                        error: executionResult.error
                    }
                });
                return res.status(statusCodes.FORBIDDEN).json({
                    message: `${nodeData.name} node execution failed`,
                    data: executionResult
                });
            }
        }
        return res.status(statusCodes.NOT_FOUND).json({
            message: `${dataSafe.data.NodeId} not found`
        });

    } catch (e) {
        console.error("Error executing node:", e);

        // Safely record failure if execution records were already created
        if (nodeExecutionId) {
            try {
                await prismaClient.nodeExecution.update({
                    where: { id: nodeExecutionId },
                    data: {
                        status: "Failed",
                        completedAt: new Date(),
                        error: e instanceof Error ? e.message : String(e)
                    }
                });
            } catch (updateErr) {
                console.error("Failed to update nodeExecution status in catch block:", updateErr);
            }
        }

        if (workflowExecutionId) {
            try {
                await prismaClient.workflowExecution.update({
                    where: { id: workflowExecutionId },
                    data: {
                        status: "Failed",
                        completedAt: new Date(),
                        error: e instanceof Error ? e.message : String(e)
                    }
                });
            } catch (updateErr) {
                console.error("Failed to update workflowExecution status in catch block:", updateErr);
            }
        }

        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Internal server Error from node execution",
        });
    }
});