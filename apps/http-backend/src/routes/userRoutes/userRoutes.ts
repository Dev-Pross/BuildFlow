import { prismaClient } from "@repo/db";
import { Express, Response, Router } from "express";
import { AuthRequest, userMiddleware } from "./userMiddleware.js";
import {
  AvailableTriggers,
  statusCodes,
  AvailableNodes,
  TriggerSchema,
  WorkflowSchmea,
} from "@repo/common/zod";
import { config } from "dotenv";
const router: Router = Router();
router.post("/create", async (req, res) => {
  // const Data = req.body;

  // const {name , email , password} = req.body
  // console.log(Data)
  try {
    const user = await prismaClient.user.create({
      data: {
        name: "name",
        email: "email",
        password: "password",
      },
    });
    res.json({
      message: "Signup DOne",
      user,
    });
  } catch (e) {
    console.log("Detailed Error", e);
  }
});

router.post("/createNode", async (req: AuthRequest, res: Response) => {
  try {
    const Data = req.body;
    console.log("Thi is the Data from Normal Data", Data);
    const parseData = AvailableNodes.safeParse(Data);
    console.log("This is the ParsedData", parseData.data);
    // if(!parseData) return
    if (!parseData.success) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Invalid Inpput in node creating",
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
    console.log("This is the error from Node creatig", e);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal server Error from Node creation",
    });
  }
});

router.get("/getAvailableNodes", async (req: AuthRequest, res: Response) => {
  // if(!req.user) {
  //   return  res.status(statusCodes.UNAUTHORIZED).json({
  //     message : "User has to be logged in , This is from getNodesEnd pont"
  //   })
  // }
  // const userID = req.user.id
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
});

router.post("/createTriggers", async (req: AuthRequest, res: Response) => {
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
    console.log("There is error in creating Triggers in Avaiblble Triggers", e);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error in Createring Triggers",
    });
  }
});

router.get("/getAvailableTriggers", async (req: AuthRequest, res: Response) => {
  try {
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
});

router.post("/create/workflow", async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "User is not logged in ",
      });
    }
    const Data = req.body;
    const ParsedData = WorkflowSchmea.safeParse(Data);
    const UserID = req.user.id;
    // Ensure that the required fields are present in the parsed data and create the workflow properly.
    if (!ParsedData.success) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: "Incorrect Workflow Inputs",
      });
    }
    const createTrigger = await prismaClient.workflow.create({
      data: {
        user: {
          connect: { id: UserID },
        },
        description: "First Workflow",
        name: "Intial Workflow",
        config: "",
        trigger: {
          create: {
            name: ParsedData.data.Name,
            AvailableTriggerID: ParsedData.data.AvailableTriggerId,
            config: ParsedData.data.Config,
          },
        },
        nodes: {
          create: ParsedData.data.AvailableNodes.map(
            (node: any, index: number) => ({
              name: node.name,
              config: node.config,
              type: node.type,
              AvailabeNodeID:
                node.id || node.nodeId || node.AvailabeNodeID || "",
              position: index,
            })
          ),
        },
      },
    });
    return res.status(statusCodes.CREATED).json({
      message: "Workflow Created Successfully",
      Data,
    });
  } catch (e) {
    console.log("Internal server error from creating aworkflow", e);
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error from CCreating Workflow",
    });
  }
});
router.get("/protected", userMiddleware, (req: AuthRequest, res) => {
  return res.json({
    ok: true,
    userId: req.user?.id,
    email: req.user?.email,
  });
});
export const userRouter = router;
