import z from "zod";
import { number } from "zod/v4";

export const BACKEND_URL = "http://localhost:3002";
export const HOOKS_URL = "http://localhost:3003";
export const AvailableTriggers = z.object({
  Name: z.string(),
  AvailableTriggerID: z.string().optional(),
  Config: z.any().optional(),
  Type: z.string(),
});

export const AvailableNodes = z.object({
  Name: z.string(),
  AvailableNodeId: z.string().optional(),
  Config: z.any(),
  Type: z.string(),
});

export const TriggerSchema = z.object({
  Name: z.string(),
  AvailableTriggerID: z.string(),
  Config: z.any().optional(),
  WorkflowId: z.string(),
  TriggerType: z.string().optional(),
});

export const NodeSchema = z.object({
  Name: z.string(),
  AvailableNodeId: z.string(),
  Config: z.any().optional(),
  stage: z.number().optional(),
  WorkflowId: z.string(),
  position : z.object({
    x : z.number() ,
    y : z.number()
  })
});

export const ExecuteWorkflow = z.object({
  workflowId : z.string(),
})
export const NodeUpdateSchema = z.object({
  NodeId: z.string(),
  Config: z.any().optional(),
  position: z.any().optional(),
});

export const TriggerUpdateSchema = z.object({
  TriggerId: z.string(),
  Config: z.any(),
});

export const WorkflowSchema = z.object({
  Name: z.string(),
  Config: z.any(),
  description: z.string().optional(),
});

export const workflowUpdateSchema = z.object({
  nodes : z.any().optional(),
  edges : z.any().optional(),
  workflowId : z.string()
})
export enum statusCodes {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  FOUND = 302,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,

  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}
