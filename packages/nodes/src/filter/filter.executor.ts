import { NodeExecutor, ExecutionContext, ExecutionResult } from "../registry/Execution.config.types.js";
import { FilterNodeInput } from "@repo/common/zod"



export class FilterExecutor implements NodeExecutor {

    private getValueByPath(obj: any, path: string): any {

        if (!obj || typeof obj !== 'object') return undefined;
        const target = ('json' in obj && typeof obj.json === 'object' && obj.json !== null) ? obj.json : obj;

        if (path === "__value__") return obj;

        const parts = path.split('.');
        let current = target;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }

    private handleUniqueRowsFromList(sourceData: any[], sourceKey?: string) {
        const filteredData: any[] = []
        const discardedData: any[] = [];
        const seenValues = new Set<string>();

        for (const item of sourceData) {
            let uniqueIdentifier = "";
            const rowData = (item && typeof item === 'object' && 'json' in item) ? item.json : item;
            if (sourceKey) {
                uniqueIdentifier = this.normalizeValue(this.getValueByPath(rowData, sourceKey))

                if (uniqueIdentifier === "[EMPTY]") {
                    discardedData.push(item);
                    continue
                }
            }
            else {
                uniqueIdentifier = this.deterministicStringify(rowData);
            }

            if (seenValues.has(uniqueIdentifier)) {
                discardedData.push(item)
            }
            else {
                filteredData.push(item);
                seenValues.add(uniqueIdentifier)
            }
        }

        return { filteredData, discardedData }
    }

    private normalizeValue(val: any): string {
        if (val === null || val === undefined) return "[EMPTY]";
        return String(val).trim(); // add .toLowerCase() here if you want case-insensitive matching
    }

    private deterministicStringify(obj: any): string {
        if (typeof obj !== 'object' || obj === null) return String(obj);

        const target = ('json' in obj && typeof obj.json === 'object' && obj.json !== null) ? obj.json : obj;
        const sortedKeys = Object.keys(target).sort();
        const sortedArray = sortedKeys.map(key => [key, target[key]]);
        return JSON.stringify(sortedArray);

    }

    private normalizeToObjects(data: any[]): any[] {
        if (!data || data.length === 0) return [];

        // If it's already an array of objects, just return it
        if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
            return data;
        }
        // If it's a 2D array (like from Google Sheets), convert it using row 0 as headers!
        if (Array.isArray(data[0])) {
            const headers = data[0] as string[];
            const objects: any[] = [];

            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const obj: Record<string, any> = {};
                for (let j = 0; j < headers.length; j++) {
                    if (headers[j]) obj[headers[j]!] = row[j];
                }
                objects.push(obj);
            }
            return objects;
        }
        return data;
    }

    private compareDataSet(sourceData: any[], referenceData: any[], sourceKey: string, referenceKey: string) {
        const uniqueData: any[] = []
        const existingData: any[] = []
        const discardedData: any[] = []

        const referenceIndex = new Set<string>()
        for (const item of referenceData) {
            const val = this.normalizeValue(this.getValueByPath(item, referenceKey))
            if (val !== "[EMPTY]") {
                referenceIndex.add(val)
            }
        }
        for (const item of sourceData) {
            const rowId = this.normalizeValue(this.getValueByPath(item, sourceKey));
            if (rowId === "[EMPTY]") {
                discardedData.push(item)
                continue
            }

            const doesExists = referenceIndex.has(rowId)
            if (doesExists) {
                existingData.push(item)
            } else {
                uniqueData.push(item)
            }
        }

        return { uniqueData, existingData, discardedData }
    }

    private handleGroupBy(sourceData: any[], sourceKey: string) {
        const groupMap: Record<string, any[]> = {};
        let emptyCount = 0;
        for (const item of sourceData) {
            const key = this.normalizeValue(this.getValueByPath(item, sourceKey))

            if (key === "[EMPTY]") emptyCount++;

            if (!groupMap[key]) {
                groupMap[key] = []
            }
            groupMap[key].push(item)

        }

        const groupArray = Object.keys(groupMap).map(key => ({
            groupName: key,
            rows: groupMap[key]
        }))

        return {
            groupMap, groupArray,
            total_processed: sourceData.length,
            emptyCount
        }
    }
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const parsed = FilterNodeInput.safeParse(context.config[0] || context.config)
            if (!parsed.success) {
                return {
                    success: false,
                    error: `Validation failed: ${parsed.error.message}`
                };
            }

            const { sourceData, referenceData, sourceKey, referenceKey, operation } = parsed.data;
            if (typeof sourceData === 'string' && sourceData.trim().startsWith('{{')) {
                return {
                    success: false, error: `Source data contains an unresolved variable (${sourceData}). Please test or run the upstream node first.`
                }
            }
            if (!Array.isArray(sourceData)) {
                return {
                    success: false, error: `Source data is not an array (received ${typeof sourceData}). Please verify upstream output.`
                }
            }

            if (typeof referenceData === 'string' && referenceData.trim().startsWith('{{')) {
                return {
                    success: false, error: `Reference data contains an unresolved variable (${referenceData}). Please test or run the upstream node first.`
                }
            }
            if (referenceData !== undefined && !Array.isArray(referenceData)) {
                return {
                    success: false, error: `Reference data is not an array (received ${typeof referenceData}). Please verify upstream output.`
                }
            }

            const normalizedSource = this.normalizeToObjects(sourceData);
            const normalizedRef = referenceData ? this.normalizeToObjects(referenceData) : undefined

            let filteredData: any[] = []
            let discardedData: any[] = []

            switch (operation) {
                case 'unique_rows':
                    const unique_results = this.handleUniqueRowsFromList(normalizedSource, sourceKey);
                    filteredData = unique_results.filteredData;
                    discardedData = unique_results.discardedData;
                    break;

                case 'new_data_only':
                    if (!sourceKey || !referenceKey) return {
                        success: false,
                        error: "sourceKey and referenceKey are required to compare datasets"
                    }
                    if (normalizedRef === undefined) return {
                        success: false,
                        error: "reference data is required to compare datasets"
                    }
                    const newResult = this.compareDataSet(normalizedSource, normalizedRef, sourceKey, referenceKey);

                    filteredData = newResult.uniqueData;
                    discardedData = [...newResult.existingData, ...newResult.discardedData]
                    break;

                case 'existing_data_only':
                    if (!sourceKey || !referenceKey) return {
                        success: false,
                        error: "sourceKey and referenceKey are required to compare datasets"
                    }
                    if (normalizedRef === undefined) return {
                        success: false,
                        error: "reference data is required to compare datasets"
                    }

                    const existing_data = this.compareDataSet(normalizedSource, normalizedRef, sourceKey, referenceKey);

                    filteredData = existing_data.existingData;
                    discardedData = [...existing_data.discardedData, ...existing_data.uniqueData];
                    break;

                case 'group_by':
                    if (!sourceKey) return {
                        success: false,
                        error: "sourceKey is required to group datasets"
                    }
                    const groupResult = this.handleGroupBy(normalizedSource, sourceKey)
                    
                    // GroupBy returns an array of objects, where each object represents a group.
                    // This is much easier for non-tech users to map (fixed keys: 'groupKey' and 'items').
                    const outputWire = groupResult.groupArray.map((group, idx) => {
                        const items = (group.rows || []).map((row: any) => {
                            return row && row.json ? row.json : row;
                        });
                        
                        return {
                            json: {
                                groupKey: group.groupName,
                                items: items
                            },
                            sourceRefs: {
                                [context.nodeId]: { wireIndex: 0, rowIndex: idx }
                            }
                        };
                    });

                    return {
                        success: true,
                        output: [outputWire],
                        metadata: {
                            operation_used: operation,
                            total_groups: groupResult.groupArray.length,
                            items_processed: groupResult.total_processed,
                            items_without_key: groupResult.emptyCount,
                            group_names: groupResult.groupArray.map(g => g.groupName)
                        }
                    }
                default:
                    return { success: false, error: `Unknown operation: ${operation}` };
            }

            const wire0 = filteredData.map((item, index) => {
                const json = (item && typeof item === 'object' && 'json' in item) ? item.json : item;
                const sourceRefs = (item && typeof item === 'object' && 'sourceRefs' in item) ? item.sourceRefs : {};
                return {
                    json,
                    sourceRefs: {
                        ...sourceRefs,
                        [context.nodeId]: { wireIndex: 0, rowIndex: index }
                    }
                };
            });

            const wire1 = discardedData.map((item, index) => {
                const json = (item && typeof item === 'object' && 'json' in item) ? item.json : item;
                const sourceRefs = (item && typeof item === 'object' && 'sourceRefs' in item) ? item.sourceRefs : {};
                return {
                    json,
                    sourceRefs: {
                        ...sourceRefs,
                        [context.nodeId]: { wireIndex: 1, rowIndex: index }
                    }
                };
            });

            return {
                success: true,
                output: [wire0, wire1],

                metadata: {
                    operation_used: operation,
                    items_kept: filteredData.length,
                    items_discard: discardedData.length,
                    group_names: ['Kept Data', 'Discarded Data']
                }
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}