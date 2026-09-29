import { ExecuteItem } from "@repo/common/zod";

export interface ExecutionContext {
  nodeId: string;
  userId: string;
  credentialId?: string;
  config: Record<string, any>;
  items: ExecuteItem[]
}
export interface ExecutionResult {
  success: boolean;
  output?: ExecuteItem[][];
  error?: string;
  metadata?: Record<any, any>;
}
export interface NodeExecutor {
  execute(context: ExecutionContext): Promise<ExecutionResult>;
}
