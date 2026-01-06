import { google, sheets_v4, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { OAuthTokens } from '../common/google-oauth-service.js';

interface GoogleSheetsCredentials{
    access_token: string,
    refresh_token: string,
    token_type: string,
    expiry_date: number
}

interface ReadRowsParams{
    spreadsheetId: string,
    range: string
}

class GoogleSheetsService{
    private sheets : sheets_v4.Sheets;
    private auth: OAuth2Client;
    private drive: drive_v3.Drive;
    constructor(credentials: GoogleSheetsCredentials){
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

    async getSheets(): Promise<any>{
        const files = await this.drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            spaces: 'drive',
            pageSize: 10,
            fields: 'files(id, name, createdTime)',
        })

        if(files){
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

    async getSheetTabs(spreadsheetId: string): Promise<any>{
        try{
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
        catch(error){
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch sheet tabs'
            };
        }
    }

    async readRows(params: ReadRowsParams): Promise<any[][]>{
        try{
            const response = await this.sheets.spreadsheets.values.get({
                                    spreadsheetId: params.spreadsheetId,
                                    range: params.range
                                });
            return response.data.values || []
        }
        catch(error){
            throw new Error(`Failed to fetch the rows: ${error}`)
        }
    }

    isTokenExpired():boolean {
        const credentials = this.auth.credentials;
        if( !credentials.expiry_date) return false;
        
        return Date.now() >= credentials.expiry_date - (5 *60 * 1000);
    }

    async refreshAccessToken(): Promise <GoogleSheetsCredentials>{
        try{
            const {credentials} = await this.auth.refreshAccessToken();

            // IMPORTANT: Only include refresh_token if Google returns a new one
            // Google doesn't always return a new refresh_token on every refresh
            const result: GoogleSheetsCredentials = {
                access_token: credentials.access_token || '',
                refresh_token: '', // Will be set below if present
                token_type: credentials.token_type || '',
                expiry_date: credentials.expiry_date || 0
            };

            // Only include refresh_token if Google actually returned one
            if (credentials.refresh_token) {
                result.refresh_token = credentials.refresh_token;
            }

            return result;
        }
        catch (error){
            throw new Error(`Failed to refresh token: ${error}`)
        }
    }
}

export { GoogleSheetsService }
export type { GoogleSheetsCredentials, ReadRowsParams }