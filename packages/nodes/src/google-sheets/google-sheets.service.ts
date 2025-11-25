import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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
}

export { GoogleSheetsService }
export type { GoogleSheetsCredentials, ReadRowsParams }