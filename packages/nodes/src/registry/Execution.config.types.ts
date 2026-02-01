export interface ExecutionContext {
  nodeId?: string;
  userId: string;
  credentialsId?: string;
  config: Record<string, any>;
  inputData?: any;
}
export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: Record<any, any>;
}
export interface NodeExecutor {
  execute(context: ExecutionContext): Promise<ExecutionResult>;
}
