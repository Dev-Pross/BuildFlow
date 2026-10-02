import { google } from "googleapis";
import { GoogleOAuthService } from "../common/google-oauth-service.js";
import { GoogleSheetsService, GoogleSheetsCredentials } from "./google-sheets.service.js";
import { ExecuteItem } from "@repo/common/zod";


interface SheetAuthContext {
    userId: string;
    credentialId: string;
    authType?: string
}
interface NodeExecutionContext extends SheetAuthContext {
    nodeId: string,
    config: any[],    //sheet id / range...
    items: ExecuteItem[]
}

interface NodeExecutionResult {
    success: boolean,
    output?: ExecuteItem[][],
    error?: string,
    authUrl?: string,
    requiresAuth?: boolean

}

class GoogleSheetsNodeExecutor {

    private oauthService: GoogleOAuthService;
    private sheetService: GoogleSheetsService | null = null;
    constructor() {
        this.oauthService = new GoogleOAuthService();

    }
    async getSheets(context: SheetAuthContext) {
        const init = await this.ensureSheetService(context);
        if ('success' in init) return init;
        const sheetService = this.sheetService;
        if (!sheetService) {
            return {
                success: false,
                error: 'Sheet service not initialized'
            };
        }

        try {
            return await sheetService.getSheets();
        } catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : 'Failed to load sheets'
            };
        }
    }

    async ensureCredentials(context: SheetAuthContext) {
        return this.ensureSheetService(context);
    }

    async getAllCredentials(userId: string, type: string) {
        try {

            const credentials = await this.oauthService.getAllCredentials(userId, type);
            console.log("log from executor - ", credentials)
            if (credentials.length > 0) return credentials
            else return []

        } catch (e) {
            console.log(`Error in fetching credentials: ${e}`);
            return [];
        }
    }

    async getSheetTabs(context: SheetAuthContext, spreadsheetId: string) {
        const init = await this.ensureSheetService(context);
        if ('success' in init) return init;
        const sheetService = this.sheetService;
        if (!sheetService) {
            return {
                success: false,
                error: 'Sheet service not initialized'
            };
        }

        try {
            return await sheetService.getSheetTabs(spreadsheetId);
        } catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : 'Failed to load sheet tabs'
            };
        }
    }

    private async ensureSheetService(context: SheetAuthContext): Promise<{ credentialId: string } | NodeExecutionResult> {
        try {
            const type = context.authType ? context.authType : 'gsheet_oauth'
            const credentials = await this.oauthService.getCredentials(context.userId, context.credentialId, type);
            console.log("credentails from sheet.executor: ", credentials)
            if (!credentials) {
                return {
                    success: false,
                    error: 'Google Sheets authorization required',
                    authUrl: this.oauthService.getAuthUrl(context.userId, context.authType!),
                    requiresAuth: true
                };
            }

            const { id: credentialId, tokens } = credentials;
            this.sheetService = new GoogleSheetsService(tokens);
            return { credentialId };
        } catch (e) {
            if (e instanceof Error && e.message.includes('No Google credentials found')) {
                return {
                    success: false,
                    error: 'Google account not connected.',
                    authUrl: this.oauthService.getAuthUrl(context.userId, context.authType!),
                    requiresAuth: true
                };
            }
            return {
                success: false,
                error: e instanceof Error ? e.message : 'unknown error'
            };
        }
    }
    async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try {

            const init = await this.ensureSheetService(context);
            if ('success' in init) return init;

            const { credentialId } = init;

            const sheetService = this.sheetService;
            if (!sheetService) {
                return {
                    success: false,
                    error: 'Sheet service not initialized'
                };
            }


            const operation = context.config[0]?.operation;
            console.log("operation from sheet executor: ", operation)
            switch (operation) {
                case 'read_rows':
                    return await this.executeReadRows(sheetService, context);

                case 'append_rows':
                    return await this.executeAppendRows(sheetService, context);

                case 'write_rows':
                    return await this.executeWriteRows(sheetService, context);

                case 'clear_rows':
                    return await this.executeClearRows(sheetService, context);
                default:
                    return {
                        success: false,
                        error: `unknown operation: ${operation}`
                    }
            }
        }

        catch (e) {

            if (e instanceof Error && e.message.includes('No Google credentials found')) {
                return {
                    success: false,
                    error: 'Google account not connected.',
                    authUrl: this.oauthService.getAuthUrl(context.userId, context.authType!),
                    requiresAuth: true
                };
            }
            return {
                success: false,
                error: e instanceof Error ? e.message : 'unknown error'
            }
        }
    }

    async getHeaderRow(context: SheetAuthContext, sheetId: string, sheetName: string): Promise<{ success: boolean, output?: string[], error?: string }> {
        const init = await this.ensureCredentials(context);
        if ('success' in init) return init as any;

        const sheetService = this.sheetService;
        if (!sheetService) {
            return {
                success: false,
                error: 'Sheet service not initialized'
            };
        }
        try {
            const rows = await sheetService.readRows({
                spreadsheetId: sheetId,
                range: `${sheetName}!1:1`
            })
            const headers = (rows && rows.length > 0 && Array.isArray(rows[0]) ? rows[0] : []);
            return {
                success: true,
                output: headers
            }
        } catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : 'Failed to load headers'
            };
        }
    }

    private async prepareValuesForSheet(context: NodeExecutionContext): Promise<any[][]> {
        const mode = context.config[0]?.mappingMode || 'visual';

        if (mode === 'bulk') {
            const rawValues = context.config[0]?.bulkValues || context.items.map(item => item.json);
            return this.normalizeValues(rawValues)
        }

        const headerResult = await this.getHeaderRow(
            context,
            context.config[0]?.spreadsheetId,
            context.config[0]?.sheetName
        );
        if (!headerResult.success) {
            throw new Error(`Could not fetch headers for mapping: ${headerResult.error}`);
        }

        const headers = headerResult.output as string[];
        if (!headers || headers.length === 0) {
            return [Object.values(context.config[0]?.mappedColumns || {})];
        }

        const allRows: any[][] = [];
        const itemsConfig = context.config;

        for (const config of itemsConfig) {
            const mappedColumns = config.mappedColumns || {};
            
            // Detect if any mapped column is an Array
            const isBulkArrayMapping = Object.values(mappedColumns).some(val => Array.isArray(val));
            
            if (isBulkArrayMapping) {
                // Find max array length to determine how many rows to build
                let maxRows = 1;
                for (const val of Object.values(mappedColumns)) {
                    if (Array.isArray(val) && val.length > maxRows) maxRows = val.length;
                }
                
                // Pivot the arrays into multiple rows
                for (let i = 0; i < maxRows; i++) {
                    const row = headers.map(headerName => {
                        const val = mappedColumns[headerName];
                        if (Array.isArray(val)) return val[i] !== undefined ? val[i] : "";
                        return val !== undefined ? val : ""; // Duplicate standard strings
                    });
                    allRows.push(row);
                }
            } else {
                // Standard single row mapping
                const row = headers.map(headerName => {
                    return mappedColumns[headerName] !== undefined ? mappedColumns[headerName] : ""
                });
                allRows.push(row);
            }
        }

        return allRows;
    }
    /**
     * Checks if user's range starts from row 1 (includes headers)
     * "A1:Z100" → true, "A7:Z100" → false, "1:100" → true
     */
    private rangeStartsFromRow1(range: string): boolean {
        const match = range.match(/(\d+)/);
        return match && match[1] ? parseInt(match[1]) === 1 : false;
    }

    /**
     * Builds column name → index mapping from header row
     * ["Email", "Job Title"] → { "email": 0, "job_title": 1 }
     */
    private buildColumnsMap(headerRow: any[]): Record<string, number> {
        const columns: Record<string, number> = {};
        headerRow.forEach((header, index) => {
            const normalized = String(header).trim().toLowerCase().replace(/\s+/g, '_');
            if (normalized) {
                columns[normalized] = index;
            }
        });
        return columns;
    }

    async executeReadRows(sheetsService: GoogleSheetsService, context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try {
            const spreadsheetId = context.config[0]?.spreadsheetId;
            const sheetName = context.config[0]?.sheetName;
            const userRange = (!context.config[0]?.fetchEntireTable && context.config[0]?.range) ? context.config[0]?.range : 'A1:Z'

            let combinedRows: any[];
            let dataRowCount: number;

            if (this.rangeStartsFromRow1(userRange)) {
                // User range already includes row 1 (headers) — single fetch
                const allRows = await sheetsService.readRows({
                    spreadsheetId: spreadsheetId,
                    range: `${sheetName}!${userRange}`
                });
                combinedRows = allRows;
                dataRowCount = Math.max(0, allRows.length - 1);
            } else {
                // User range starts after row 1 — fetch headers separately
                let headers: any[][] = [];
                try {
                    headers = await sheetsService.readRows({
                        spreadsheetId: spreadsheetId,
                        range: `${sheetName}!1:1`
                    });
                } catch (e) {
                    console.log('[GoogleSheets] Failed to fetch headers:', e);
                }

                const dataRows = await sheetsService.readRows({
                    spreadsheetId: spreadsheetId,
                    range: `${sheetName}!${userRange}`
                });

                combinedRows = headers.length > 0
                    ? [headers[0], ...dataRows]
                    : dataRows;
                dataRowCount = dataRows.length;
            }

            // // Build columns mapping from first row (headers)
            // const columns = combinedRows.length > 0 && combinedRows[0]
            //     ? this.buildColumnsMap(combinedRows[0] as any[])
            //     : {};

            // return {
            //     success: true,
            //     output: {
            //         rows: combinedRows,
            //         columns: columns,
            //         dataStartIndex: 1,
            //         rowCount: dataRowCount,
            //         sheetId: spreadsheetId,
            //         hasHeaders: Object.keys(columns).length > 0
            //     }
            // }
            const headers = (combinedRows.length > 0 && combinedRows[0]) ? (combinedRows[0] as string[]) : [];

            const outputBoxes: ExecuteItem[] = [];

            for (let i = 1; i < combinedRows.length; i++) {
                const rowArray = combinedRows[i]
                const rowObject: Record<string, any> = {};

                headers.forEach((header, index) => {
                    const cleanHeader = String(header).trim().toLowerCase().replace(/\s+/g, '_');

                    if (cleanHeader) {
                        rowObject[cleanHeader] = rowArray[index]
                    }
                })

                outputBoxes.push({
                    json: rowObject,
                    sourceRefs: {
                        [context.nodeId]: { wireIndex: 0, rowIndex: i - 1 }
                    }
                })
            }
            return {
                success: true,
                output: [outputBoxes]
            };

        } catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : "Failed to read rows"
            }
        }

    }

    private normalizeValues(rawValues: any): any[][] {
        if (!rawValues) return [];

        // If string, attempt JSON.parse first
        if (typeof rawValues === 'string') {
            const trimmed = rawValues.trim();
            // Handle single quotes if user typed [['a', 'b']]
            const formattedJson = trimmed.replace(/'/g, '"');
            try {
                const parsed = JSON.parse(formattedJson);
                return this.normalizeValues(parsed);
            } catch {
                return [[trimmed]];
            }
        }

        // If Array
        if (Array.isArray(rawValues) && rawValues.length > 0) {
            // Case 1: 2D Array of arrays [ [a, b], [c, d] ]
            if (Array.isArray(rawValues[0])) {
                return rawValues;
            }

            // Case 2: Array of Objects [ { col1: "val1", col2: "val2" }, ... ] (e.g. dragged from previous node)
            if (typeof rawValues[0] === 'object' && rawValues[0] !== null) {
                return rawValues.map(item =>
                    typeof item === 'object' && item !== null ? Object.values(item) : [item]
                );
            }

            // Case 3: 1D Array of primitives [a, b, c] -> [[a, b, c]]
            return [rawValues];
        }

        // If Single Object { col1: "val1", col2: "val2" } (e.g. single node output)
        if (typeof rawValues === 'object' && rawValues !== null) {
            return [Object.values(rawValues)];
        }

        return [[String(rawValues)]];
    }

    async executeWriteRows(sheetService: GoogleSheetsService, context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try {
            const spreadsheetId = context.config[0]?.spreadsheetId;
            const range = context.config[0]?.range;
            const values = await this.prepareValuesForSheet(context);

            if (!range) {
                return {
                    success: false,
                    error: "Target Range / Cell is required for Update Rows operation (e.g. A2 or A1)"
                };
            }
            const response = await sheetService.writeRows({
                spreadsheetId: spreadsheetId,
                range: `${context.config[0]?.sheetName}!${range}`,
                values: values
            })
            const itemsToMap: ExecuteItem[] = context.items.length > 0 ? context.items : [{ json: context.config[0]?.mappedColumns || {} }];

            const outputBoxes = itemsToMap.map((item, index) => {
                return {
                    json: {
                        ...item.json,
                        googleSheetResponse: {
                            operation: "Update Rows",
                            rowsUpdated: response.updatedRows || 1,
                        }
                    },
                    sourceRefs: {
                        ...(item.sourceRefs),
                        [context.nodeId]: { wireIndex: 0, rowIndex: index }
                    }
                }
            })
            return {
                success: true,
                output: [outputBoxes]
            }
        } catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : "Failed to update rows"
            }
        }
    }

    async executeAppendRows(sheetService: GoogleSheetsService, context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try {
            const spreadsheetId = context.config[0]?.spreadsheetId;
            const range = context.config[0]?.sheetName;

            const values = await this.prepareValuesForSheet(context);

            const response = await sheetService.appendRows({
                spreadsheetId: spreadsheetId,
                range: range,
                values: values
            })
            console.log(`append rows: ${response}`)
            const itemsToMap: ExecuteItem[] = context.items.length > 0 ? context.items : [{ json: context.config[0]?.mappedColumns || {} }];
            const outputBoxes = itemsToMap.map((item, index) => {
                return {
                    json: {
                        ...item.json,
                        googleSheetResponse: {
                            operation: "Append Rows",
                            rowUpdated: response.updates.updatedRange || response.tableRange
                        }
                    },
                    sourceRefs: {
                        ...(item.sourceRefs || {}),
                        [context.nodeId]: { wireIndex: 0, rowIndex: index }
                    }
                }
            })
            return {
                success: true,
                output: [outputBoxes]
            }
        }
        catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : "Failed to append rows"
            }
        }
    }

    async executeClearRows(sheetService: GoogleSheetsService, context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try {
            const spreadsheetId = context.config[0]?.spreadsheetId;
            const range = (!context.config[0]?.clearEntireTable && context.config[0]?.range) ? `${context.config[0]?.sheetName}!${context.config[0]?.range}` : (context.config[0]?.includeHeaderRow ? `${context.config[0]?.sheetName}!A1:Z` : `${context.config[0]?.sheetName}!A2:Z`);

            const response = await sheetService.clearRows({
                spreadsheetId: spreadsheetId,
                range: range
            })
            const itemsToMap: ExecuteItem[] = context.items.length > 0 ? context.items : [{ json: context.config[0]?.mappedColumns || {} }];

            const outputBoxes = itemsToMap.map((item, index) => {
                return {
                    json: {
                        ...item.json,
                        googleSheetResponse: {
                            operation: "Clear Rows",
                            clearedRange: response.clearedRange
                        }
                    },
                    sourceRefs: {
                        ...(item.sourceRefs),
                        [context.nodeId]: { wireIndex: 0, rowIndex: index }
                    }

                }
            })
            return {
                success: true,
                output: [outputBoxes]
            }
        }
        catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : "Failed to clear rows"
            }
        }

    }
}

export default GoogleSheetsNodeExecutor;
// export  { NodeExecutionContext, NodeExecutionResult };