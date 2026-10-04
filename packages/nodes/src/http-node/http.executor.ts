import { NodeExecutor, ExecutionContext, ExecutionResult } from "../registry/Execution.config.types.js";
import { HttpRequestNodeSchema } from "@repo/common/zod";
import axios from "axios";

export class HttpNodeExecutor implements NodeExecutor {
    private parseKeyValues(input: any): Record<string, any> | undefined {
        if (!input)
            return undefined
        if (Array.isArray(input)) {
            const result: Record<string, any> = {};
            for (const item of input) {
                if (item && typeof item === 'object' && item.key && item.key.trim() !== '') {
                    result[item.key.trim()] = item.value;
                }
            }
            return Object.keys(result).length > 0 ? result : undefined;
        }
        if (typeof input === 'object') {
            return Object.keys(input).length > 0 ? input : undefined;
        }
        if (typeof input === 'string') {

            if (input.trim() === "")
                return undefined

            try {
                const values = JSON.parse(input)
                return values
            }
            catch (e) {
                throw new Error(e instanceof Error ? e.message : "JSON parsing error")
            }
        }
        return undefined;
    }


    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        const inputConfig = Array.isArray(context.config) ? context.config[0] || {} : context.config || {}
        const parsed = HttpRequestNodeSchema.safeParse(inputConfig)

        if (!parsed.success)
            return { success: false, error: "Invalid configuration: " + parsed.error.issues.map(e => e.message).join(", ") }

        const config = {
            url: parsed.data.url,
            method: parsed.data.method,
            headers: this.parseKeyValues(parsed.data.headers),
            data: parsed.data.method !== 'GET' ? parsed.data.body : undefined,
            params: this.parseKeyValues(parsed.data.queryParams),
            timeout: parsed.data.timeout || 30000,
            validateStatus: () => true
        }

        console.log("-------------------------")
        console.log(config)

        try {
            const response = await axios(config);
            const output = {
                json: {
                    statusCode: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    body: response.data,
                },
                sourceRefs: {
                    ...(context.items?.[0]?.sourceRefs),
                    [context.nodeId]: { wireIndex: 0, rowIndex: 0 }
                }
            }

            return {
                success: true,
                output: [[output]],
                metadata: {
                    statusCode: response.status,
                    statusText: response.statusText,
                    url: parsed.data.url,
                    method: parsed.data.method
                }
            }
        }
        catch (e: any) {
            return {
                success: false,
                error: e.message || "HTTP node failed"
            }
        }
    }
}