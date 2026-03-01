export interface SystemMessage {
    role: "system";
    content: string;
}
export interface UserMessage {
    role: "user";
    content: string;
}
export interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}
export interface AssistantMessage {
    role: "assistant";
    content: string | null;
    tool_calls?: ToolCall[];
}
export interface ToolMessage {
    role: "tool";
    tool_call_id: string;
    content: string;
}
export type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage;
export interface ExecuteParams {
    task: string;
    toolNames: string[];
    model: string;
    systemPrompt?: string;
    maxIterations?: number;
}
export interface ExecuteResult {
    success: boolean;
    result: string;
    iterations: number;
    tokensUsed: number;
    stopReason: "completed" | "max_iterations" | "error";
}
export interface AgentContext {
    task: string;
    model: string;
    maxIterations: number;
    systemPrompt: string;
    messages: Message[];
    iterationCount: number;
    totalTokens: number;
}
export interface StopCheck {
    shouldStop: boolean;
    reason: "completed" | "max_iterations" | "error" | "continue";
}
//# sourceMappingURL=types.d.ts.map