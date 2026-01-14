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
} from "@repo/common/zod";
import { GoogleSheetsNodeExecutor } from "@repo/nodes";
const router: Router = Router();

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
    console.log("This is the error from Node creating", e);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal server Error from Node creation",
    });
  }
});

router.get(
  "/getAvailableNodes",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        message: "User has to be logged in , This is from getNodesEnd pont",
      });
    }
    const userID = req.user.id;
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

router.post(
  "/createAvaliableTriggers",
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

router.get(
  "/getAvailableTriggers",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      console.log("RequestRecieved  from the frontend");
      if (!req.user)
        return res
          .status(statusCodes.BAD_GATEWAY)
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

// //------------------------------ GET CREDENTIALS -----------------------------

// router.get('/getCredentials/:type',
//   userMiddleware,
//   async (req: AuthRequest, res) =>{
//     try{
//       console.log("user from getcredentials: ",req.user)
//       if(!req.user){
//           return res.status(statusCodes.BAD_REQUEST).json({
//             message: "User is not Loggedin"
//           })
//         }
//         const userId = req.user.sub;
//         const type = req.params.type
//         console.log(userId," -userid")
//         if(!type || !userId){
//           return res.status(statusCodes.BAD_REQUEST).json({
//             message: "Incorrect type Input",
//           });
//         }
//         const executor = new GoogleSheetsNodeExecutor()
//         const response = await executor.getAllCredentials(userId,type)
//         // console.log( typeof(response));
//         // console.log("response: ",response)
//         const authUrl = typeof response === 'string' ? response : null
//         // console.log(authUrl);

//         const credentials = response instanceof Object ? response : null
//         // console.log(credentials)
//         if(authUrl){
//           return res.status(statusCodes.OK).json({
//           message: "Credentials not found create credentials using this auth url",
//           Data: authUrl,
//         });
//         }
//         else return res.status(statusCodes.OK).json({
//           message: "Credentials Fetched succesfully",
//           Data: credentials,
//         });
//     }
//     catch(e){
//       console.log("Error Fetching the credentials ", e instanceof Error ? e.message : "Unkown reason");
//       return res
//         .status(statusCodes.INTERNAL_SERVER_ERROR)
//         .json({ message: "Internal server from fetching the credentials" });
//     }
//   }
// );

//------------------------------ GET CREDENTIALS -----------------------------

router.get(
  "/getCredentials/:type",
  userMiddleware,
  async (req: AuthRequest, res) => {
    try {
      console.log("user from getcredentials: ", req.user);
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not Loggedin",
        });
      }
      const userId = req.user.sub;
      const type = req.params.type;
      console.log(userId, " -userid");

      if (!type || !userId) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Incorrect type Input",
        });
      }

      // Check if credentials exist in database
      const credentials = await prismaClient.credential.findMany({
        where: {
          userId: userId,
          type: type,
        },
      });

      if (credentials.length === 0) {
        // No credentials found - return the correct auth URL
        const authUrl = `${process.env.BACKEND_URL || "http://localhost:3002"}/auth/google/initiate`;
        return res.status(statusCodes.OK).json({
          message:
            "Credentials not found create credentials using this auth url",
          Data: authUrl,
        });
      }

      // Credentials found - return them
      return res.status(statusCodes.OK).json({
        message: "Credentials Fetched successfully",
        Data: credentials,
      });
    } catch (e) {
      console.log(
        "Error Fetching the credentials ",
        e instanceof Error ? e.message : "Unknown reason"
      );
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: "Internal server error from fetching the credentials",
        });
    }
  }
);

router.get(
  "/getAllCreds",
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
// ----------------------------------- CREATE WORKFLOW ---------------------------------

router.post(
  "/create/workflow",
  userMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not logged in ",
        });
      }
      const Data = req.body;
      const ParsedData = WorkflowSchema.safeParse(Data);
      const UserID = req.user.id;
      // const UserID = "343c9a0a-9c3f-40d0-81de-9a5969e03f92";
      // Ensure that the required fields are present in the parsed data and create the workflow properly.
      if (!ParsedData.success) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Incorrect Workflow Inputs",
        });
      }
      const createWorkflow = await prismaClient.workflow.create({
        // Example JSON body to test this route:
        /*
      {
        "Name":"workflow-1",
        "UserId": "",
        "Config":[{}]
      }
      */
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
    } catch (e) {
      console.log("Internal server error from creating aworkflow", e);
      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error from CCreating Workflow",
      });
    }
  }
);

// ------------------------------------ FETCHING WORKFLOWS -----------------------------------

router.get(
  "/workflows",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User is not logged in /not authorized" });
      const userId = req.user.id;

      const workflows = await prismaClient.workflow.findMany({
        where: {
          userId,
        },
      });
      console.log(workflows);
      return res
        .status(statusCodes.OK)
        .json({ message: "Workflows fetched succesfullu", Data: workflows });
    } catch (error: any) {
      console.log("The error is from getting wrkflows", error.message);

      return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
        meesage: "Internal Server Error From  getting workflows for the user",
      });
    }
  }
);

router.get(
  "/empty/workflow",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.UNAUTHORIZED)
          .json({ message: "User is not logged in /not authorized" });
      const userId = req.user.id;
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
        meesage: "Internal Server Error From  getting workflows for the user",
      });
    }
  }
);

router.get(
  "/workflow/:workflowId",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user)
        return res
          .status(statusCodes.BAD_GATEWAY)
          .json({ message: "User isnot logged in /not authorized" });
      const userId = req.user.id;

      const workflowId = req.params.workflowId;
      const getWorkflow = await prismaClient.workflow.findFirst({
        where: {
          id: workflowId,
          userId: userId,
        },
        include: {
          Trigger: true,
          nodes: { orderBy: { position: "asc" } },
        },
      });
      if (!getWorkflow) {
        return res.status(statusCodes.UNAUTHORIZED).json({
          message: "Workflow Not found or not authorized",
        });
      }
      return res.status(statusCodes.OK).json({
        message: "workflow Fetched succesfully",
        Data: getWorkflow,
      });
    } catch (error: any) {
      console.log("Error Fetching the workflow ", error.message);
      return res
        .status(statusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server from fetching the workflow" });
    }
  }
);


// router.put("/workflow/update" , userMiddleware , (req : AuthRequest , res : Response) => {

// })
// ---------------------------------------- INSERTING DATA INTO NODES/ TRIGGER TABLE-----------------------------

router.post(
  "/create/trigger",
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
      console.log("The error from creation of trigger is ", dataSafe.error);

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

router.post(
  "/create/node",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "User is not logged in ",
        });
      }
      const data = req.body;
      console.log(" from http-backeden" , data);

      const dataSafe = NodeSchema.safeParse(data);
      console.log("The error is ", dataSafe.error);
      if (!dataSafe.success) {
        return res.status(statusCodes.BAD_REQUEST).json({
          message: "Invalid input",
        });
      }
      // Fix: Only provide required fields for node creation, exclude credentials/credentialsId
      // Use an empty array for credentials (if required) or don't pass it at all
      // Config must be valid JSON (not an empty string)
      // const stage = dataSafe.data.Position
      const createdNode = await prismaClient.node.create({
        data: {
          name: dataSafe.data.Name,
          workflowId: dataSafe.data.WorkflowId,
          AvailableNodeID: dataSafe.data.AvailableNodeId,
          config: {}, // Config is an empty object by default
          stage: Number(dataSafe.data.stage),
          position: {}
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

router.put(
  "/update/node",
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

      const updateNode = await prismaClient.node.update({
        where: { id: dataSafe.data.NodeId },
        data: {
          position: dataSafe.data.position,
          config: dataSafe.data.Config,
        },
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

router.put(
  "/update/trigger",
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
          config: dataSafe.data.Config,
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



router.get("/protected", userMiddleware, (req: AuthRequest, res) => {
  return res.json({
    ok: true,
    userId: req.user?.id,
    email: req.user?.email,
  });
});
export const userRouter = router;
