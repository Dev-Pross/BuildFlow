import { ExecutionContext, ExecutionResult, NodeExecutor } from "../registry/Execution.config.types.js";
import { IteratorNodeSchema } from "@repo/common/zod";
import { ExecuteItem } from "@repo/common/zod";

export class IteratorExecutor implements NodeExecutor {
    private getValueByPath(obj: any, path: string): any {
        if (!obj || typeof obj !== 'object') return undefined;
        
        // Remove variables wrappers if present
        let cleanPath = path;
        if (path.startsWith('{{') && path.endsWith('}}')) {
            cleanPath = path.slice(2, -2).trim();
        }
        
        // Strip node name prefix if present (e.g. "HTTP Request.[0].json.body...")
        if (cleanPath.includes('.')) {
            cleanPath = cleanPath.replace(/^[^.]+\.(?:\[\d+\]\.)?(?:json\.)?/, '');
        }

        const parts = cleanPath.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]!;
            if (current === null || current === undefined) return undefined;

            const arrayMatch = part.match(/^\[(\d+)\]$/);
            if (arrayMatch) {
                const index = parseInt(arrayMatch[1]!, 10);
                if (Array.isArray(current)) {
                    current = current[index];
                    continue;
                } else if (index === 0 && typeof current === 'object' && current !== null) {
                    // Artificial [0] from frontend table wrapper around an object
                    // Just ignore the [0] and continue with the object
                    continue;
                }
            }

            if (Array.isArray(current) && isNaN(Number(part))) {
                const remainingPath = parts.slice(i).join('.');
                return current.map(item => this.getValueByPath(item, remainingPath)).filter(v => v !== undefined);
            }

            current = current[part];
        }
        return current;
    }

    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const inputConfig = Array.isArray(context.config) ? context.config[0] || {} : context.config || {};
            const parsed = IteratorNodeSchema.safeParse(inputConfig);
            if (!parsed.success) {
                return { success: false, error: "Invalid Iterator configuration" };
            }
            const { arrayPath } = parsed.data;
            const items = (context.items && context.items.length > 0) ? context.items : [{ json: {} }];
            
            // Extract a meaningful key for primitive arrays (e.g. "price" from "body.products.price")
            let wrapperKey = 'value';
            if (arrayPath) {
                let cleanPath = arrayPath;
                if (cleanPath.startsWith('{{') && cleanPath.endsWith('}}')) {
                    cleanPath = cleanPath.slice(2, -2).trim();
                }
                const parts = cleanPath.split('.');
                const lastPart = parts[parts.length - 1];
                if (lastPart && !lastPart.match(/^\[\d+\]$/)) {
                    wrapperKey = lastPart;
                }
                console.log("Iterator debug:", { arrayPath, cleanPath, parts, lastPart, wrapperKey });
            }
            
            const outputItems: ExecuteItem[] = [];
            let totalExtracted = 0;

            for (let i = 0; i < items.length; i++) {
                const item = items[i]!;
                const arrayData = arrayPath ? this.getValueByPath(item.json, arrayPath) : undefined;

                if (Array.isArray(arrayData)) {
                    arrayData.forEach((element) => {
                        outputItems.push({
                            json: typeof element === 'object' && element !== null ? element : { [wrapperKey]: element },
                            sourceRefs: {
                                ...(item.sourceRefs || {}),
                                [context.nodeId]: { wireIndex: 0, rowIndex: outputItems.length }
                            }
                        });
                        totalExtracted++;
                    });
                } else if (arrayData !== undefined) {
                    // Not an array, but we found data. Wrap it.
                    outputItems.push({
                        json: typeof arrayData === 'object' && arrayData !== null ? arrayData : { [wrapperKey]: arrayData },
                        sourceRefs: {
                            ...(item.sourceRefs || {}),
                            [context.nodeId]: { wireIndex: 0, rowIndex: outputItems.length }
                        }
                    });
                    totalExtracted++;
                } else {
                    // Pass original item if path failed
                    outputItems.push({
                        json: item.json,
                        sourceRefs: {
                            ...(item.sourceRefs || {}),
                            [context.nodeId]: { wireIndex: 0, rowIndex: outputItems.length }
                        }
                    });
                }
            }

            return {
                success: true,
                output: [outputItems],
                metadata: {
                    operation: 'extract_items',
                    items_processed: items.length,
                    items_extracted: totalExtracted
                }
            };
        } catch (error: any) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }
}
