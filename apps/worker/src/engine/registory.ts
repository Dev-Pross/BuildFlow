import { ExecutionContext, ExecutionResult, NodeExecutor } from "../types.js";
import { GmailExecutor } from "@repo/nodes/nodeClient";
class ExecutionRegistry {
  private executors = new Map<string, NodeExecutor>();

  register(nodeType: string, executor: NodeExecutor) {
    this.executors.set(nodeType, executor);
  }

  async execute(
    nodeType: string,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const executor = this.executors.get(nodeType);
    if (!executor) {
      return {
        success: false,
        error: `No Executor found for ${nodeType}`,
      };
    }
    try {
      const result = await executor.execute(context);
      console.log("Execute result:", result);

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error,
      };
    }
  }
  initialize() {
    // TODO: Ensure GmailExecutor implements NodeExecutor and is compatible with ExecutionContext
    // If needed, adapt/extract a compatible Executor for registration.
    // For now, this cast suppresses the type error. Refactor as soon as possible!


    //wehen visits this next time make sure chang gmail executor implements NodeExecutor
    this.register("gmail", new GmailExecutor() as unknown as NodeExecutor);
    console.log(`The current Executors are ${this.executors.size}`);
  }
}

export const register = new ExecutionRegistry();
