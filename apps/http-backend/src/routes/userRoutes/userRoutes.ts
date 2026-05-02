import dotenv from "dotenv";
dotenv.config();
import { prismaClient } from "@repo/db";
import { Request, Response, Router } from "express";
import { AuthRequest, userMiddleware } from "./userMiddleware.js";
import {
  AvailableTriggers,
  statusCodes,
  AvailableNodes,
  TriggerSchema,
  WorkflowSchema,
  NodeSchema,
  NodeUpdateSchema,
  TriggerUpdateSchema,
  workflowUpdateSchema,
  ExecuteWorkflow,
  HOOKS_URL,
  DashboardRangeSchema,
} from "@repo/common/zod";
import { GoogleSheetsNodeExecutor } from "@repo/nodes";
import axios from "axios";
const router: Router = Router();

const DASHBOARD_RANGE_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
} as const;

const FALLBACK_EXECUTION_QUOTA = 1000;

const isTestingExecution = (metadata: unknown): boolean => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return (metadata as Record<string, unknown>).isTesting === true;
};

const toDayKey = (date: Date): string => date.toISOString().slice(0, 10);

const getExecutionQuota = (): number => {
  const parsedQuota = Number.parseInt(
    process.env.DASHBOARD_EXECUTION_QUOTA || "",
    10
  );

  if (Number.isFinite(parsedQuota) && parsedQuota > 0) {
    return parsedQuota;
  }

  return FALLBACK_EXECUTION_QUOTA;
};

router.post("/createAvaliableNode", async (req: AuthRequest, res: Response) => {
  try {
    const Data = req.body;
    // console.log("Thi is the Data from Normal Data", Data);
    const parseData = AvailableNodes.safeParse(Data);
    // console.log("This is the ParsedData", parseData.data);
    // if(!parseData) return
    if (!parseData.success) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid Input in node creating",
      });
    }
    const createNode = await prismaClient.availableNode.create({
      data: {
        name: parseData.data.Name,
        config: parseData.data.Config,
        type: parseData.data.Type,
      },
    });
    res.status(statusCodes.CREATED).json({
      message: "Node created Succesfully",
      Data: createNode,
    });
  } catch (e) {
    // console.log("This is the error from Node creating", e);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal server Error from Node creation",
    });
  }
});

router.get("/getAvailableNodes",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        message: "User has to be logged in , This is from getNodesEnd pont",
      });
    }
    // const userID = req.user.id;
    // console.log(userID)
    try {
      const Data = await prismaClient.availableNode.findMany();
      return res.status(statusCodes.OK).json({
        message: "Availabe Nodes Fetched Succesfuuly",
        Data: Data,
      });
    } catch (e) {
      console.log("Error From getting the data from Availabele Nodes", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error From getting Availabe Nodes",
      });
    }
  }
);

router.post("/createAvaliableTriggers",
  // userMiddleware,
  async (req: Request, res: Response) => {
    try {
      const Data = req.body;
      const ParsedData = AvailableTriggers.safeParse(Data);
      if (!ParsedData.success) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Incorrect Inputs from",
        });
      }
      const createTrigger = await prismaClient.availableTrigger.create({
        data: {
          name: ParsedData.data.Name,
          config: ParsedData.data.Config,
          type: ParsedData.data.Type,
        },
      });
      return res.status(statusCodes.CREATED).json({
        message: "Trigger Created Succesfully",
        Data: createTrigger,
      });
    } catch (e) {
      console.log(
        "There is error in creating Triggers in Avaiblble Triggers",
        e
      );
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error in Createring Triggers",
      });
    }
  }
);

router.get("/getAvailableTriggers",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // console.log("RequestRecieved  from the frontend");
      if (!req.user)
        return res
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User isnot logged in /not authorized" });

      const Data = await prismaClient.availableTrigger.findMany();
      return res.status(statusCodes.OK).json({
        message: "Availabe Triggers Fetched Succesfuuly",
        Data: Data,
      });
    } catch (e) {
      console.log("Error From getting the data from Availabele Triggers", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error From getting Availabe Triggers",
      });
    }
  }
);


router.get("/getCredentials/:type",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // console.log("user from getcredentials: ", req.user);
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not Loggedin",
        });
      }
      const userId = req.user.sub;
      const type = req.params.type;
      // console.log("The type of data comming to backed is ", type)
      // console.log(userId, " -userid");

      if (!type || !userId) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Incorrect type Input",
        });
      }
      const exec = new GoogleSheetsNodeExecutor()

      // Check if credentials exist in database
      // const credentials = await prismaClient.credential.findMany({
      //   where: {
      //     userId: userId,
      //     type: type,
      //   },
      // });
      const credentials = await exec.getAllCredentials(userId, type)

      // if (credentials.length === 0) {
      //   // No credentials found - return the correct auth URL
      //   const authUrl = `${process.env.BACKEND_URL || "http://localhost:3002"}/oauth/google/initiate`;
      //   return res.status(statusCodes.OK).json({
      //     message:
      //       "Credentials not found create credentials using this auth url",
      //     Data: authUrl,
      //   });
      // }

      // // Credentials found - return them
      // return res.status(statusCodes.OK).json({
      //   message: "Credentials Fetched successfully",
      //   Data: credentials,
      // });
      if (credentials.length === 0) {
        return res.status(statusCodes.OK).json({
          message: "No credentials found",
        });
      }

      return res.status(statusCodes.OK).json({
        message: "Credentials fetched",
        data: credentials,
        hasCredentials: true,
      });
    } catch (e) {
      console.log(
        "Error Fetching the credentials ",
        e instanceof Error ? e.message : "Unknown reason"
      );
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error from fetching the credentials",
      });
    }
  }
);

router.get("/getAllCreds",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not Loggedin",
        });
      }
      const userId = req.user.sub;
      const creds = await prismaClient.credential.findMany({
        where: { userId: userId },
      });
      if (creds) {
        return res.status(statusCodes.OK).json({
          message: "Fetched all credentials of the User!",
          data: creds,
        });
      }
    } catch (e) {
      console.log(
        "Error Fetching the credentials ",
        e instanceof Error ? e.message : "Unkown reason"
      );
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server from fetching the credentials" });
    }
  }
);

router.get("/dashboard/overview",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(statusCodes.UNAUTHORIZED).json({
          message: "User is not authorized",
        });
      }

      const [workflowCount, recentWorkflows, credentials, executionRows] =
        await Promise.all([
          prismaClient.workflow.count({
            where: { userId },
          }),
          prismaClient.workflow.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              status: true,
            },
          }),
          prismaClient.credential.findMany({
            where: { userId },
            select: { type: true },
          }),
          prismaClient.workflowExecution.findMany({
            where: {
              workflow: {
                userId,
              },
            },
            select: {
              status: true,
              metadata: true,
            },
          }),
        ]);

      const executions = executionRows.filter(
        (execution) => !isTestingExecution(execution.metadata)
      );

      const executionCount = executions.length;
      const failedExecutions = executions.filter(
        (execution) => execution.status === "Failed"
      ).length;
      const successfulExecutions = executions.filter(
        (execution) => execution.status === "Completed"
      ).length;

      const failedRate = executionCount
        ? Number(((failedExecutions / executionCount) * 100).toFixed(2))
        : 0;
      const successRate = executionCount
        ? Number(((successfulExecutions / executionCount) * 100).toFixed(2))
        : 0;

      const executionQuota = getExecutionQuota();
      const remainingExecutions = Math.max(0, executionQuota - executionCount);

      const credentialTypes = new Set(credentials.map((credential) => credential.type));
      const hasSharedGoogleOAuth = credentialTypes.has("google_oauth");

      const gmailConnected =
        hasSharedGoogleOAuth || credentialTypes.has("gmail_oauth");
      const googleSheetsConnected =
        hasSharedGoogleOAuth || credentialTypes.has("google_sheets_oauth");

      return res.status(statusCodes.OK).json({
        message: "Dashboard overview fetched successfully",
        data: {
          workflowCount,
          executionCount,
          failedRate,
          successRate,
          executionQuota,
          remainingExecutions,
          integrations: [
            {
              key: "gmail",
              label: "Gmail",
              connected: gmailConnected,
            },
            {
              key: "googleSheets",
              label: "Google Sheets",
              connected: googleSheetsConnected,
            },
          ],
          recentWorkflows,
        },
      });
    } catch (error) {
      console.log("Error fetching dashboard overview", error);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error while fetching dashboard overview",
      });
    }
  }
);

router.get("/dashboard/executions/trend",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(statusCodes.UNAUTHORIZED).json({
          message: "User is not authorized",
        });
      }

      const rangeInput = req.query.range ?? "7d";
      const parsedRange = DashboardRangeSchema.safeParse(rangeInput);

      if (!parsedRange.success) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Invalid range. Supported values: 7d, 30d, 90d",
        });
      }

      const range = parsedRange.data;
      const days = DASHBOARD_RANGE_DAYS[range];

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - (days - 1));

      const executionRows = await prismaClient.workflowExecution.findMany({
        where: {
          workflow: {
            userId,
          },
          startAt: {
            gte: startDate,
          },
        },
        select: {
          startAt: true,
          status: true,
          metadata: true,
        },
        orderBy: {
          startAt: "asc",
        },
      });

      const executions = executionRows.filter(
        (execution) => !isTestingExecution(execution.metadata)
      );

      const pointsMap = new Map<
        string,
        {
          date: string;
          total: number;
          completed: number;
          failed: number;
          inFlight: number;
        }
      >();

      for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + dayOffset);
        const dayKey = toDayKey(currentDate);

        pointsMap.set(dayKey, {
          date: dayKey,
          total: 0,
          completed: 0,
          failed: 0,
          inFlight: 0,
        });
      }

      for (const execution of executions) {
        const dayKey = toDayKey(execution.startAt);
        const point = pointsMap.get(dayKey);

        if (!point) {
          continue;
        }

        point.total += 1;

        if (execution.status === "Completed") {
          point.completed += 1;
        } else if (execution.status === "Failed") {
          point.failed += 1;
        } else {
          point.inFlight += 1;
        }
      }

      const points = Array.from(pointsMap.values());
      const totals = points.reduce(
        (acc, point) => {
          acc.total += point.total;
          acc.completed += point.completed;
          acc.failed += point.failed;
          acc.inFlight += point.inFlight;
          return acc;
        },
        { total: 0, completed: 0, failed: 0, inFlight: 0 }
      );

      return res.status(statusCodes.OK).json({
        message: "Dashboard trend fetched successfully",
        data: {
          range,
          points,
          totals,
        },
      });
    } catch (error) {
      console.log("Error fetching dashboard trend", error);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error while fetching dashboard trend",
      });
    }
  }
);
// ----------------------------------- CREATE WORKFLOW ---------------------------------

router.post("/create/workflow",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {

    if (!req.user) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "User is not logged in ",
      });
    }
    const Data = req.body;
    const ParsedData = WorkflowSchema.safeParse(Data);
    const UserID = req.user.sub;
    // const UserID = "343c9a0a-9c3f-40d0-81de-9a5969e03f92";
    // Ensure that the required fields are present in the parsed data and create the workflow properly.
    if (!ParsedData.success) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Incorrect Workflow Inputs",
      });
    } try {
      const createWorkflow = await prismaClient.workflow.create({
        data: {
          user: {
            connect: { id: UserID },
          },
          description: ParsedData.data.description || "Workflow-Created",
          name: ParsedData.data.Name,
          config: ParsedData.data.Config,
        },
      });
      return res.status(statusCodes.CREATED).json({
        message: "Workflow Created Successfully",
        Data: createWorkflow,
      });
    } catch (e: any) {
      console.log("Internal server error from creating aworkflow", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error from CCreating Workflow",
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }
  }


);

// ------------------------------------ FETCHING WORKFLOWS -----------------------------------

router.get("/workflows",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User is not logged in /not authorized" });
      const userId = req.user.sub;

      const workflows = await prismaClient.workflow.findMany({
        where: {
          userId,
        },
      });
      // console.log(workflows);
      return res
        .status(statusCodes.OK)
        .json({ message: "Workflows fetched succesfullu", Data: workflows });
    } catch (error: any) {
      console.log("The error is from getting wrkflows", error.message);

      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error From  getting workflows for the user",
      });
    }
  }
);

router.get("/empty/workflow",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User is not logged in /not authorized" });
      const userId = req.user.sub;
      const workflow = await prismaClient.workflow.findFirst({
        where: {
          userId: userId,
          isEmpty: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return res
        .status(statusCodes.OK)
        .json({ message: "Workflow fetched succesful", Data: workflow });
    } catch (e) {
      console.log(
        "The error is from getting wrkflows",
        e instanceof Error ? e.message : "UNKNOWN ERROR"
      );

      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error From  getting workflows for the user",
      });
    }
  }
);

router.get("/workflow/:workflowId",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User isnot logged in /not authorized" });
      const userId = req.user.sub;

      const workflowId = req.params.workflowId;
      const getWorkflow = await prismaClient.workflow.findFirst({
        where: {
          id: workflowId,
          userId: userId,
        },
        include: {
          Trigger: {
            include: {
              triggerType: {
                select: { icon: true }
              }
            }
          },
          nodes: {
            orderBy: { stage: "asc" },
            include: {
              AvailableNode: {
                select: { icon: true }
              }
            }
          },
        },
      });
      if (!getWorkflow) {
        return res.status(statusCodes.UNAUTHORIZED).json({
          message: "Workflow Not found or not authorized",
        });
      }
      const workflow = {
        ...getWorkflow,
        Trigger: getWorkflow.Trigger ? {
          ...getWorkflow.Trigger,
          icon: getWorkflow.Trigger.triggerType.icon || null,
          AvailableTrigger: undefined
        } : null,
        nodes: getWorkflow.nodes.map(node => ({
          ...node,
          icon: node.AvailableNode.icon || null,
          AvailableNode: undefined
        }))
      }
      return res.status(statusCodes.OK).json({
        message: "workflow Fetched succesfully",
        Data: workflow,
      });
    } catch (error: any) {
      console.log("Error Fetching the workflow ", error.message);
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server from fetching the workflow" });
    }
  }
);

router.put("/workflow/update", userMiddleware, async (req: AuthRequest, res: Response) => {

  const data = req.body;
  const parsedData = workflowUpdateSchema.safeParse(data);

  if (!parsedData.success) {
    return res.status(statusCodes.BAD_REQUEST).json({
      message: "Incorrect Input",
      error: parsedData.error
    })
  }
  const workflowId = parsedData.data.workflowId;
  if (!req.user) {
    return res.status(statusCodes.UNAUTHORIZED).json({
      message: "User Not Authenticated"
    })
  }
  const userId = req.user.sub
  try {
    const workflowValid = await prismaClient.workflow.findFirst({
      where: { id: workflowId, userId: userId }
    })
    if (!workflowValid) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Didn't find the workflow"
      })
    }
    const update = await prismaClient.workflow.update({
      where: { id: workflowId, userId: userId },
      data: {
        // Nodes: parsedData.data.nodes,
        Edges: parsedData.data.edges
      }
    })
    return res.status(statusCodes.ACCEPTED).json({
      message: "Workflow Updated Succesfuly",
      Data: update
    })
  } catch (error: any) {
    console.log("Error updating workflow:", error);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error from Updating workflow",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

//------------------------------------------ TRIGGER AND NODE CREATION ------------------------------

//TRIGGER CREATION
router.post("/create/trigger",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not logged in ",
        });
      }
      const data = req.body;
      const dataSafe = TriggerSchema.safeParse(data);
      // console.log("The error from creation of trigger is ", dataSafe.error);

      if (!dataSafe.success)
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Invalid input",
        });
      const createdTrigger = await prismaClient.trigger.create({
        data: {
          name: dataSafe.data.Name,
          AvailableTriggerID: dataSafe.data.AvailableTriggerID,
          config: dataSafe.data.Config,
          workflowId: dataSafe.data.WorkflowId,
          Position: dataSafe.data.Position || {}
          // trigger type pettla db lo ledu aa column
        },
      });
      await prismaClient.workflow.update({
        where: { id: dataSafe.data.WorkflowId },
        data: {
          isEmpty: false,
        },
      });

      if (createdTrigger) {
        return res.status(statusCodes.CREATED).json({
          message: "Trigger created",
          data: createdTrigger,
        });
      }
    } catch (e) {
      console.log("This is the error from Trigger creatig", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server Error from Trigger creation ",
      });
    }

    // INPUT FORMAT
    // {
    // "Name": "test-1",
    // "AvailableTriggerID": "153c62fb-d61e-4e10-a8f4-d54780883200",
    // "Config": {},
    // "WorkflowId": "d0216fca-ca9b-4f3f-b01c-0a29b4305708",
    // "TriggerType":""
    // }
  }
);

//NODE CREATION
router.post("/create/node",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not logged in ",
        });
      }
      const data = req.body;
      // console.log(" from http-backeden", data);

      const dataSafe = NodeSchema.safeParse(data);
      // console.log("The error is ", dataSafe.error);
      if (!dataSafe.success) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Invalid input",
        });
      }
      // Fix: Only provide required fields for node creation, exclude credentials/credentialsId
      // Use an empty array for credentials (if required) or don't pass it at all
      // Config must be valid JSON (not an empty string)
      // const stage = dataSafe.data.Position
      // console.log("This is from the backend log of positions", dataSafe.data.position)
      const createdNode = await prismaClient.node.create({
        data: {
          name: dataSafe.data.Name,
          workflowId: dataSafe.data.WorkflowId,
          config: dataSafe.data.Config || {},
          stage: Number(dataSafe.data.stage ?? 0),
          position: {
            x: dataSafe.data.position.x,
            y: dataSafe.data.position.y
          },
          AvailableNodeID: dataSafe.data.AvailableNodeId,
          CredentialsID: dataSafe.data.CredentialId
        },
      });

      if (createdNode)
        return res.status(statusCodes.CREATED).json({
          message: "Node created",
          data: createdNode,
        });
    } catch (e) {
      console.log("This is the error from Node creating", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server Error from Node creation",
      });
    }
  }
);

// ------------------------- UPDATE NODES AND TRIGGES ---------------------------

router.put("/update/node",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not logged in ",
        });
      }
      const data = req.body;
      const dataSafe = NodeUpdateSchema.safeParse(data);

      if (!dataSafe.success) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Invalid input",
        });
      }
      // const { credentialId, ...restConfig } = dataSafe.data.Config;
      const updateNode = await prismaClient.node.update({
        where: { id: dataSafe.data.NodeId },
        data: {

          ...(dataSafe.data.position !== undefined ? { position: dataSafe.data.position } : {}),
          ...(dataSafe.data.Config !== undefined ? { config: dataSafe.data.Config } : {}),
          ...(dataSafe.data.Config?.credentialId ? { CredentialsID: dataSafe.data.Config.credentialId } : {})
        }
      });

      if (updateNode)
        return res.status(statusCodes.CREATED).json({
          message: "Node updated",
          data: updateNode,
        });
    } catch (e) {
      console.log("This is the error from Node updating", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server Error from Node Updation.",
      });
    }
  }
);

router.put("/update/trigger",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not logged in ",
        });
      }
      const data = req.body;
      const dataSafe = TriggerUpdateSchema.safeParse(data);

      if (!dataSafe.success)
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Invalid input",
        });

      const updatedTrigger = await prismaClient.trigger.update({
        where: { id: dataSafe.data.TriggerId },
        data: {
          ...(dataSafe.data.Config !== undefined ? { config: dataSafe.data.Config } : {}),
          ...(dataSafe.data.CredentialID !== undefined ? { CredentialsID: dataSafe.data.CredentialID } : {}),
          ...(dataSafe.data.Position !== undefined ? { Position: dataSafe.data.Position } : {})
        },
      });

      if (updatedTrigger)
        return res.status(statusCodes.CREATED).json({
          message: "Trigger updated",
          data: updatedTrigger,
        });
    } catch (e) {
      console.log("This is the error from Trigger updating", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal server Error from Trigger Updation",
      });
    }
  }
);

router.post("/executeWorkflow", userMiddleware, async (req: AuthRequest, res: Response) => {
  // console.log("REcieved REquest to the  execute route ")
  const Data = req.body
  if (!req.user) {
    return res.status(statusCodes.UNAUTHORIZED).json({
      message: "User Not Authorized"
    })
  }
  const parsedData = ExecuteWorkflow.safeParse(Data);
  // console.log("This is the log data of execute work flow zod", parsedData.error)
  if (!parsedData.success) {
    return res.status(statusCodes.BAD_REQUEST).json({
      message: "Error in Zod Schma",
      Data: parsedData.error
    })
  }
  const workflowId = parsedData.data.workflowId;
  const userId = req.user.sub
  try {
    const trigger = await prismaClient.workflow.findFirst({
      where: { id: workflowId, userId: userId },
      include: {
        Trigger: true
      }
    })
    if (!trigger) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: "Workflow not found or not authorized"
      });
    }
    // console.log("This is the Trigger Name of  the workflow", trigger?.Trigger?.name)
    // console.log("This is the Trigger Data of  the workflow", trigger)

    if (trigger?.Trigger?.name === "webhook") {
      const data = await axios.post(`${HOOKS_URL}/hooks/catch/${userId}/${workflowId}`, {
        triggerData: "",

      },
        { timeout: 30000 },)
      // console.log("Workflow Execution for webhook  started with Execution Id is ", data.data.workflowExecutionId)
      const workflowExecutionId = data.data.workflowExecutionId;
      if (!workflowExecutionId) {
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Failed to start workflow execution"
        }
        )
      }
      return res.status(statusCodes.OK).json({
        success: true,
        workflowExecutionId: data.data.workflowExecutionId
      });
    }
    else {

      return res.status(statusCodes.FORBIDDEN).json({
        message: "Trigger is not webhook"
      });
    }


  } catch (error: any) {
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error ",
      Error: error instanceof Error ? error.message : "Unknown Error"
    })
  }

})

router.get("/workflow/logs/:workflowId", userMiddleware, async (req: AuthRequest, res) => {
  try {
    // if (!req.user)
    //     return res
    //       .status(statusCodes.UNAUTHORIZED)
    //       .json({ message: "User isnot logged in /not authorized" });
    // const userId = req.user.sub;
    const workflowId = req.params.workflowId;
    if (!workflowId)
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid input"
      })

    const executions = await prismaClient.workflowExecution.findMany({
      where: { workflowId: workflowId },
      include: {
        nodeExecutions: { include: { node: true } },
      },
      orderBy: { startAt: "desc" },
    })

    if (!executions) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: `logs not found for ${workflowId}`
      })
    }

    return res.status(statusCodes.ACCEPTED).json({
      message: `logs found for ${workflowId}`,
      data: executions
    })

  }
  catch (e) {
    console.log("Error workflow logs:", e);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error from workflow logs",
      error: e instanceof Error ? e.message : "Unknown error"
    })
  }
})

router.get("/protected", userMiddleware, (req: AuthRequest, res) => {
  return res.json({
    ok: true,
    userId: req.user?.id,
    email: req.user?.email,
  });
});
export const userRouter = router;
