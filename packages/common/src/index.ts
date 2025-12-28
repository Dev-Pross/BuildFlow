import z from "zod";


export const BACKEND_URL="http://localhost:3002";

export const AvailableTriggers = z.object({
  Name: z.string(),
  AvailableTriggerID: z.string().optional(),
  Config: z.any().optional(),
  Type : z.string()
});

export const AvailableNodes = z.object({
  Name: z.string(),
  AvailableNodeId: z.string().optional(),
  Config: z.any(),
  Type : z.string()
});

export const TriggerSchema = z.object({
  Name: z.string(),
  AvailableTriggerID: z.string(),
  Config: z.any(),
  WorkflowId: z.string(),
  TriggerType: z.string(),
});

export const NodeSchema = z.object({
  Name: z.string(),
  AvailableNodeId: z.string(),
  Config: z.any(),
  Position: z.number(),
  WorkflowId: z.string(),
});


export const WorkflowSchema = z.object({
  Name: z.string(),
  UserId: z.string(),
  Config: z.any(),

});

export enum statusCodes {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

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
