import { google, sheets_v4, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { OAuthTokens } from '../common/google-oauth-service.js';

interface GoogleSheetsCredentials {
    access_token: string,
    refresh_token: string,
    token_type: string,
    expiry_date: number
}

interface ReadRowsParams_ClearRows {
    spreadsheetId: string,
    range: string
}

interface AppendRowsParams {
    spreadsheetId: string,
    range: string,
    values: any[][]
}

interface createSpreadsheetParams {
    title: string;
    headers?: string[]
    tabName?: string;
}

interface CreateSheetTabParams {
    spreadsheetId: string;
    tabName: string;
    headers?: string[]
}

interface WriteRowsParams {
    spreadsheetId: string,
    range: string,
    values: any[][]

}
class GoogleSheetsService {
    private sheets: sheets_v4.Sheets;
    private auth: OAuth2Client;
    private drive: drive_v3.Drive;
    constructor(credentials: GoogleSheetsCredentials) {
        this.auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        this.auth.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            token_type: credentials.token_type,
            expiry_date: credentials.expiry_date
        });

        this.sheets = google.sheets({
            version: 'v4',
            auth: this.auth
        });

        this.drive = google.drive({
            version: 'v3',
            auth: this.auth
        })

    }

    async getSheets(): Promise<any> {
        const files = await this.drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            spaces: 'drive',
            pageSize: 10,
            fields: 'files(id, name, createdTime)',
        })

        if (files) {
            return {
                success: true,
                data: files
            }
        }
        return {
            success: false,
            data: null
        }
    }

    async getSheetTabs(spreadsheetId: string): Promise<any> {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: spreadsheetId,
                fields: 'sheets.properties'
            });

            const tabs = response.data.sheets?.map(sheet => ({
                id: sheet.properties?.sheetId,
                name: sheet.properties?.title
            })) || [];

            return {
                success: true,
                data: tabs
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch sheet tabs'
            };
        }
    }



    async readRows(params: ReadRowsParams_ClearRows): Promise<any[][]> {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: params.spreadsheetId,
                range: params.range
            });
            return response.data.values || []
        }
        catch (error) {
            throw new Error(`Failed to fetch the rows: ${error}`)
        }
    }

    async appendRows(params: AppendRowsParams): Promise<any> {
        try {
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: params.spreadsheetId,
                range: params.range,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: params.values
                }
            })
            return response.data
        }
        catch (error) {
            throw new Error(`Failed to append the rows: ${error}`)
        }
    }

    async writeRows(params: WriteRowsParams): Promise<any> {
        try {
            const response = await this.sheets.spreadsheets.values.update({
                spreadsheetId: params.spreadsheetId,
                range: params.range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: params.values
                }
            })
            return response.data
        }
        catch (error) {
            throw new Error(`Failed to write the rows: ${error}`)
        }
    }

    async clearRows(params: ReadRowsParams_ClearRows): Promise<any> {
        try {
            const response = await this.sheets.spreadsheets.values.clear({
                spreadsheetId: params.spreadsheetId,
                range: params.range
            })
            return response.data
        }
        catch (error) {
            throw new Error(`Failed to clear the rows: ${error}`)
        }
    }

    async createSpreadsheet(params: createSpreadsheetParams): Promise<any> {
        try {
            const response = await this.sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: params.title
                    },
                    sheets: params.tabName ? [
                        {
                            properties: {
                                title: params.tabName
                            }
                        }
                    ] : undefined
                }
            })

            const sheetId = response.data.spreadsheetId;
            const activeTab = params.tabName || 'Sheet1';
            const range = `'${activeTab}'!A1`;

            if (params.headers && params.headers.length > 0) {
                await this.writeRows({
                    spreadsheetId: sheetId!,
                    range,
                    values: [params.headers]
                })
            }

            return {
                success: true,
                spreadsheetId: sheetId,
                spreadsheetUrl: response.data.spreadsheetUrl,
                tabName: activeTab
            }
        } catch (e: any) {
            throw new Error("Failed to create spreadsheet: " + e.message);
        }
    }

    async createSheetTab(params: CreateSheetTabParams): Promise<any> {
        try {
            const response = await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: params.spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: params.tabName
                                }
                            }
                        }
                    ]
                }
            });

            const addedSheet = response.data.replies?.[0]?.addSheet?.properties;
            const range = `'${params.tabName}'!A1`;

            if (params.headers && params.headers.length > 0) {
                await this.writeRows({
                    spreadsheetId: params.spreadsheetId,
                    range,
                    values: [params.headers]
                });
            }

            return {
                success: true,
                sheetId: addedSheet?.sheetId,
                tabName: params.tabName
            };
        } catch (error: any) {
            throw new Error(`Failed to create sheet tab: ${error.message}`);
        }
    }

}

export { GoogleSheetsService }
export type { GoogleSheetsCredentials, ReadRowsParams_ClearRows, AppendRowsParams, WriteRowsParams, createSpreadsheetParams, CreateSheetTabParams }