import z from "zod";
import { number } from "zod/v4";

// Export interpolation utilities
export * from "./interpolation";

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
  Position: z.object({x: z.number(), y: z.number()}).optional()
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
  }),
  CredentialId: z.string().optional()
});

export const ExecuteWorkflow = z.object({
  workflowId : z.string(),
})

export const ExecuteNode = z.object({
  NodeId: z.string(),
  Config: z.any().optional()
})
export const NodeUpdateSchema = z.object({
  NodeId: z.string(),
  Config: z.any().optional(),
  position: z.any().optional(),
});

export const TriggerUpdateSchema = z.object({
  TriggerId: z.string(),
  Config: z.any().optional(),
  Position: z.object({ x: z.number(), y: z.number()}).optional(),
  CredentialID: z.string().optional()
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

// Execution Logs Schemas - for GET /user/workflow/logs/:workflowId
export const ExecutionStatusEnum = z.enum(['Start', 'Pending', 'InProgress', 'ReConnecting', 'Failed', 'Completed']);

export const NodeExecutionSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  workflowExecId: z.string(),
  status: ExecutionStatusEnum,
  startedAt: z.string().or(z.date()),
  completedAt: z.string().or(z.date()).nullable().optional(),
  inputData: z.any().nullable().optional(),
  outputData: z.any().nullable().optional(),
  error: z.string().nullable().optional(),
  retries: z.number().default(0),
  isTest: z.boolean().default(false),
  node: z.object({
    id: z.string(),
    name: z.string(),
    config: z.any(),
    AvailableNode: z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: ExecutionStatusEnum,
  startAt: z.string().or(z.date()),
  completedAt: z.string().or(z.date()).nullable().optional(),
  error: z.string().nullable().optional(),
  metadata: z.any().optional(),
  nodeExecutions: z.array(NodeExecutionSchema).optional(),
});

export const WorkflowExecutionResponseSchema = z.object({
  message: z.string(),
  data: z.array(WorkflowExecutionSchema),
});

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
