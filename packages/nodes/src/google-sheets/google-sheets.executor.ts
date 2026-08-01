import { google } from "googleapis";
import { GoogleOAuthService } from "../common/google-oauth-service.js";
import { GoogleSheetsService, GoogleSheetsCredentials } from "./google-sheets.service.js";

interface NodeExecutionContext {
    credentialId: string,
    userId: string,
    config?: any,    //sheet id / range...
    authType: string,
    inputData?: any // previous node data
}

interface NodeExecutionResult {
    success: boolean,
    output?: any,
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
    async getSheets(context: NodeExecutionContext) {
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

    async ensureCredentials(context: NodeExecutionContext) {
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

    async getSheetTabs(context: NodeExecutionContext, spreadsheetId: string) {
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

    private async ensureSheetService(context: NodeExecutionContext): Promise<{ credentialId: string } | NodeExecutionResult> {
        try {
            const type = context.authType ? context.authType : 'gsheet_oauth'
            const credentials = await this.oauthService.getCredentials(context.userId, context.credentialId, type);
            console.log("credentails from sheet.executor: ", credentials)
            if (!credentials) {
                return {
                    success: false,
                    error: 'Google Sheets authorization required',
                    authUrl: this.oauthService.getAuthUrl(context.userId, context.authType),
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
                    authUrl: this.oauthService.getAuthUrl(context.userId, context.authType),
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


            const operation = context.config.operation;
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
                    authUrl: this.oauthService.getAuthUrl(context.userId, context.authType),
                    requiresAuth: true
                };
            }
            return {
                success: false,
                error: e instanceof Error ? e.message : 'unknown error'
            }
        }
    }

    async getHeaderRow(context: NodeExecutionContext, sheetId: string, sheetName: string): Promise<NodeExecutionResult> {
        const init = await this.ensureCredentials(context);
        if ('success' in init) return init;

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
        const mode = context.config.mappingMode || 'visual';

        if (mode === 'bulk') {
            const rawValues = context.config.bulkValues || context.inputData;
            return this.normalizeValues(rawValues)
        }

        const mappedColumns = context.config.mappedColumns || {};

        const headerResult = await this.getHeaderRow(
            context,
            context.config.spreadsheetId,
            context.config.sheetName
        );
        if (!headerResult.success) {
            throw new Error(`Could not fetch headers for mapping: ${headerResult.error}`);
        }

        const headers = headerResult.output as string[];
        // If the sheet has no headers, fallback to just dumping the object values
        if (!headers || headers.length === 0) {
            return [Object.values(mappedColumns)];
        }

        const finalRow = headers.map(headerName => {
            return mappedColumns[headerName] !== undefined ? mappedColumns[headerName] : ""
        })

        return [finalRow]
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
            const spreadsheetId = context.config.spreadsheetId;
            const sheetName = context.config.sheetName;
            const userRange = (!context.config.fetchEntireTable && context.config.range) ? context.config.range : 'A1:Z'

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

            // Build columns mapping from first row (headers)
            const columns = combinedRows.length > 0 && combinedRows[0]
                ? this.buildColumnsMap(combinedRows[0] as any[])
                : {};

            return {
                success: true,
                output: {
                    rows: combinedRows,
                    columns: columns,
                    dataStartIndex: 1,
                    rowCount: dataRowCount,
                    sheetId: spreadsheetId,
                    hasHeaders: Object.keys(columns).length > 0
                }
            }
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
            const spreadsheetId = context.config.spreadsheetId;
            const range = context.config.range;
            const values = await this.prepareValuesForSheet(context);

            if (!range) {
                return {
                    success: false,
                    error: "Target Range / Cell is required for Update Rows operation (e.g. A2 or A1)"
                };
            }
            const response = await sheetService.writeRows({
                spreadsheetId: spreadsheetId,
                range: `${context.config.sheetName}!${range}`,
                values: values
            })
            return {
                success: true,
                output: {
                    operation: "Update Rows",
                    spreadsheetId: spreadsheetId,
                    sheetName: context.config.sheetName,
                    writtenRange: response.updatedRange || range,
                    rowsUpdated: response.updatedRows || 1,
                    columnsUpdated: response.updatedColumns || 0,
                    cellsUpdated: response.updatedCells || 0
                }
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
            const spreadsheetId = context.config.spreadsheetId;
            const range = context.config.sheetName;

            const values = await this.prepareValuesForSheet(context);

            const response = await sheetService.appendRows({
                spreadsheetId: spreadsheetId,
                range: range,
                values: values
            })
            console.log(`append rows: ${response}`)
            return {
                success: true,
                output: {
                    operation: "Append Rows",
                    spreadsheetId: spreadsheetId,
                    sheetName: context.config.sheetName,
                    appendedRange: response.updates?.updatedRange || response.tableRange,
                    rowsAdded: response.updates?.updatedRows || 1,
                    columnsUpdated: response.updates?.updatedColumns || 0,
                    cellsUpdated: response.updates?.updatedCells || 0
                }
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
            const spreadsheetId = context.config.spreadsheetId;
            const range = (!context.config.clearEntireTable && context.config.range) ? `${context.config.sheetName}!${context.config.range}` : (context.config.includeHeaderRow ? `${context.config.sheetName}!A1:Z` : `${context.config.sheetName}!A2:Z`);

            const response = await sheetService.clearRows({
                spreadsheetId: spreadsheetId,
                range: range
            })
            return {
                success: true,
                output: {
                    ...response
                }
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