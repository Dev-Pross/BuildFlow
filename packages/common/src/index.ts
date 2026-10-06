import z from "zod";

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
  Position: z.object({ x: z.number(), y: z.number() }).optional()
});

export const NodeSchema = z.object({
  id: z.string().optional(),
  Name: z.string(),
  AvailableNodeId: z.string(),
  Config: z.any().optional(),
  stage: z.number().optional(),
  WorkflowId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  CredentialId: z.string().optional()
});

export const ExecuteWorkflow = z.object({
  workflowId: z.string(),
})

export const ExecuteNode = z.object({
  NodeId: z.string(),
  Config: z.any().optional(),
  items: z.any().optional()
})
export const NodeUpdateSchema = z.object({
  NodeId: z.string(),
  Config: z.any().optional(),
  position: z.any().optional(),
});

export const TriggerUpdateSchema = z.object({
  TriggerId: z.string(),
  Config: z.any().optional(),
  Position: z.object({ x: z.number(), y: z.number() }).optional(),
  CredentialID: z.string().optional()
});

export const WorkflowSchema = z.object({
  Name: z.string(),
  Config: z.any(),
  description: z.string().optional(),
});

export const workflowUpdateSchema = z.object({
  nodes: z.any().optional(),
  edges: z.any().optional(),
  workflowId: z.string()
})

export const WorkflowSyncSchema = z.object({
  workflowId: z.string(),
  deletedNodeIds: z.array(z.string()).optional(),
  deletedTriggerId: z.string().optional(),

  newNodes: z.array(z.object({
    NodeId: z.string(),
    name: z.string(),
    AvailableNodeID: z.string(),
    stage: z.number().optional(),
    Config: z.any().optional(),
    icon: z.string().optional(),
    position: z.any().optional(),
    workflowId: z.string()
  })).optional(),

  changedNodes: z.array(z.object({
    NodeId: z.string(),
    Config: z.any().optional(),
    position: z.any().optional()
  })).optional(),

  trigger: z.object({
    TriggerId: z.string(),
    Config: z.any().optional(),
    position: z.any().optional(),
    CredentialID: z.string().optional()
  }).optional(),
  edges: z.any().optional()

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

export const DashboardRangeSchema = z.enum(["7d", "30d", "90d"]);

export const DashboardIntegrationSchema = z.object({
  key: z.enum(["gmail", "googleSheets"]),
  label: z.string(),
  connected: z.boolean(),
});

export const DashboardRecentWorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
  status: z.string().nullable().optional(),
});

export const DashboardOverviewSchema = z.object({
  workflowCount: z.number(),
  executionCount: z.number(),
  failedRate: z.number(),
  successRate: z.number(),
  executionQuota: z.number(),
  remainingExecutions: z.number(),
  integrations: z.array(DashboardIntegrationSchema),
  recentWorkflows: z.array(DashboardRecentWorkflowSchema),
});

export const DashboardOverviewResponseSchema = z.object({
  message: z.string(),
  data: DashboardOverviewSchema,
});

export const DashboardExecutionTrendPointSchema = z.object({
  date: z.string(),
  total: z.number(),
  completed: z.number(),
  failed: z.number(),
  inFlight: z.number(),
});

export const DashboardExecutionTrendSchema = z.object({
  range: DashboardRangeSchema,
  points: z.array(DashboardExecutionTrendPointSchema),
  totals: z.object({
    total: z.number(),
    completed: z.number(),
    failed: z.number(),
    inFlight: z.number(),
  }),
});

export const DashboardExecutionTrendResponseSchema = z.object({
  message: z.string(),
  data: DashboardExecutionTrendSchema,
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


export const FilterNodeInput = z.object({
  operation: z.enum([
    "unique_rows",
    "new_data_only",
    "existing_data_only",
    "group_by"
  ]),
  sourceData: z.array(z.any()).or(z.string()),
  referenceData: z.array(z.any()).or(z.string()).optional(),
  sourceKey: z.string().optional(),
  referenceKey: z.string().optional()
})

export const ExecuteItemSchema = z.object({
  json: z.record(z.string(), z.any()),
  sourceRefs: z.record(z.string(),
    z.object({
      wireIndex: z.number().default(0),
      rowIndex: z.number()
    })).optional()
});


export type ExecuteItem = z.infer<typeof ExecuteItemSchema>

export type FilterNodeInput = z.infer<typeof FilterNodeInput>;

export const HttpRequestNodeSchema = z.object({
  url: z.string().trim().min(1, "URL is required").refine(
    (val) => /^(https?:\/\/|\{\{)/.test(val),
    { message: "URL must start with http://, https://, or a {{variable}}" }
  ),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  headers: z.union([z.record(z.string(), z.any()), z.array(z.any()), z.string()]).optional(),
  body: z.any().optional(),
  queryParams: z.union([z.record(z.string(), z.any()), z.array(z.any()), z.string()]).optional(),
  timeout: z.number().int().positive().optional().default(30000)
});


export const IfElseOperatorSchema = z.enum([
  'equals', 'not_equals',

  "greater_than", "less_than", "greater_than_or_equal", "less_than_or_equal",

  "contains", "not_contains", "starts_with", "ends_with", "regex_match",

  "is_any_of", "is_not_any_of",

  "is_empty", "is_not_empty", "is_true", "is_false"
])

export const IfElseRuleSchema = z.object({
  id: z.string().optional(),          // Unique identifier for React keys & updates
  operand1: z.any(),                  // The left operand (e.g. {{price}} or {{status}})
  operator: IfElseOperatorSchema,           // The condition
  operand2: z.any().optional()
})

export const IfElseGroupSchema = z.object({
  id: z.string().optional(),
  combinator: z.enum(['AND', 'OR']).default('AND'),

  conditions: z.array(IfElseRuleSchema).default([])

})

export const IfElseNodeSchema = z.object({
  combinator: z.enum(['AND', 'OR']).default('OR'),
  conditionGroups: z.array(IfElseGroupSchema).default([])
})

export const IteratorNodeSchema = z.object({
  arrayPath: z.string().min(1, "Array Path is required").default(""),
})
export type IteratorNodeInput = z.infer<typeof IteratorNodeSchema>;

export type IfElseOperator = z.infer<typeof IfElseOperatorSchema>;
export type IfElseRule = z.infer<typeof IfElseRuleSchema>;
export type IfElseGroup = z.infer<typeof IfElseGroupSchema>;
export type IfElseNodeInput = z.infer<typeof IfElseNodeSchema>;


export type HttpRequestNodeInput = z.infer<typeof HttpRequestNodeSchema>;
export type HttpRequestInput = HttpRequestNodeInput;
