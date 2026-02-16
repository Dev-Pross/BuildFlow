declare class LLMClient {
    call(prompt: any[], options?: {
        temperature: number;
        maxOutputTokens: number;
    }): Promise<{
        text: string;
        inputTokens: number;
        outputTokens: number;
        totalCount: number;
    }>;
}
export default LLMClient;
//# sourceMappingURL=LlmClient.d.ts.map