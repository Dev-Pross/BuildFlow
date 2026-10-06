import { ExecutionContext, ExecutionResult, NodeExecutor } from "../registry/Execution.config.types.js";
import { GmailExecutor } from "@repo/nodes/nodeClient";
import { GoogleSheetsNodeExecutor } from "@repo/nodes/nodeClient";
import { FilterExecutor } from "../filter/filter.executor.js";
import { HttpNodeExecutor } from "../http-node/http.executor.js";
import { IfElseNodeExecutor } from "../if-else-node/if-else-executor.js";
import { IteratorExecutor } from "../iterator-node/iterator.executor.js";

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
      const result = await executor.execute(context)
      console.log("Execute result:", result);

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  initialize() {
    // TODO: Ensure GmailExecutor implements NodeExecutor and is compatible with ExecutionContext
    // If needed, adapt/extract a compatible Executor for registration.
    // For now, this cast suppresses the type error. Refactor as soon as possible!


    //wehen visits this next time make sure chang gmail executor implements NodeExecutor
    this.register("gmail", new GmailExecutor() as NodeExecutor);
    this.register("google_sheet", new GoogleSheetsNodeExecutor() as NodeExecutor)
    this.register("filter", new FilterExecutor() as NodeExecutor)
    this.register("http_request", new HttpNodeExecutor() as NodeExecutor)
    this.register('if_else', new IfElseNodeExecutor() as NodeExecutor);
    this.register('iterator', new IteratorExecutor() as NodeExecutor);
    
    console.log(`The current Executors are ${this.executors.size}`);
  }
}

export const ExecutionRegister = new ExecutionRegistry();
