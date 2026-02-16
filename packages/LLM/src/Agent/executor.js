import LLMClient from "../LlmClient.js";
export class AgentExecution {
    constructor() {
        this.llmClinet = new LLMClient();
    }
    async Execute(paramas) {
        if (!paramas)
            return;
        const prompt = paramas.task;
        try {
            const context = {
                task: prompt,
                model: paramas.model,
                maxIterations: paramas.maxIterations,
                systemPrompt: paramas.systemPrompt,
                messages: [],
                iterationCount: 0,
                totalTokens: 0
            };
            context.messages.push({
                role: "system",
                content: context.systemPrompt
            }, {
                role: "user",
                content: prompt
            });
            while (context.iterationCount < context.maxIterations) {
                try {
                    const input = context.messages;
                    const result = await this.llmClinet.call(input);
                    // if(!stopReason.){
                    //     return {
                    //         success: true,
                    //         result: result.text,
                    //         iterations: context.iterationCount + 1,
                    //         tokensUsed: result.inputTokens + result.outputTokens,
                    //         stopReason: "completed"
                    //     }
                    // }
                }
                catch (e) {
                    console.warn("Internal Server Error");
                }
            }
        }
        catch (e) {
            console.warn("Internal Server Error");
        }
        return;
    }
}
