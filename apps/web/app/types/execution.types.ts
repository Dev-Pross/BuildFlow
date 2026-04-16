/**
 * Execution Types
 * Type definitions for workflow execution logs and node executions
 */

/**
 * Valid workflow status values
 */
export type Status = 'Start' | 'Pending' | 'InProgress' | 'ReConnecting' | 'Failed' | 'Completed';

/**
 * Execution error details
 */
export interface ExecutionError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Node information included with node execution
 */
export interface NodeInfo {
  id: string;
  name: string;
  config: Record<string, unknown>;
  type: string; // From AvailableNode.type
}

/**
 * Node execution log - represents a single node's execution in a workflow
 */
export interface NodeExecutionLog {
  id: string;
  nodeId: string;
  workflowExecId: string;
  status: Status;
  startedAt: string; // ISO 8601 DateTime
  completedAt: string | null; // ISO 8601 DateTime or null
  inputData: Record<string, unknown> | null;
  outputData: Record<string, unknown> | null;
  error: string | null;
  retries: number;
  isTest: boolean;
  node: NodeInfo;
}

/**
 * Workflow execution log - represents a complete workflow execution with all node executions
 */
export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  status: Status;
  startAt: string; // ISO 8601 DateTime
  completedAt: string | null; // ISO 8601 DateTime or null
  error: string | null;
  metadata: Record<string, unknown>;
  nodeExecutions: NodeExecutionLog[];
}

/**
 * Response format for GET /user/workflow/logs/:workflowId
 */
export interface WorkflowExecutionResponse {
  success: boolean;
  data: WorkflowExecutionLog | null;
  message?: string;
}
