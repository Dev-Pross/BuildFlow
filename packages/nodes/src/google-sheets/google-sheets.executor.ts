import { google } from "googleapis";
import { GoogleOAuthService } from "../common/google-oauth-service.js";
import { GoogleSheetsService, GoogleSheetsCredentials } from "./google-sheets.service.js";

interface NodeExecutionContext{
    credentialId: string,
    userId: string,
    config?: any,    //sheet id / range...
    inputData?: any // previous node data
}

interface NodeExecutionResult{
    success: boolean,
    output?: any,
    error?: string,
    authUrl?: string,
    requiresAuth?: boolean

}

class GoogleSheetsNodeExecutor{

    private oauthService: GoogleOAuthService;
    private sheetService: GoogleSheetsService | null = null;
    constructor(){
        this.oauthService = new GoogleOAuthService();
        
    }
    async getSheets(context: NodeExecutionContext){
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
            
            const credentials =  await this.oauthService.getAllCredentials(userId, type);
            console.log("log from executor - ",credentials)
            if(credentials.length > 0) return credentials
            else return (this.oauthService.getAuthUrl(userId))
            
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
            const credentials = await this.oauthService.getCredentials(context.userId, context.credentialId);
            console.log("credentails from sheet.executor: ",credentials)
            if (!credentials) {
                return {
                    success: false,
                    error: 'Google Sheets authorization required',
                    authUrl: this.oauthService.getAuthUrl(context.userId),
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
                    authUrl: this.oauthService.getAuthUrl(context.userId),
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
        try{

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

            if(sheetService.isTokenExpired()){
                const newTokens = await sheetService.refreshAccessToken();
                await this.oauthService.updateCredentials(credentialId, newTokens)
            }

            const operation = context.config.operation;
            console.log("operation from sheet executor: ",operation)
            switch(operation){
                case 'read_rows':
                    return await this.executeReadRows(sheetService,context);

                default:
                    return {
                        success: false,
                        error: `unknown operation: ${operation}`
                    }
            }
        }

        catch (e){

            if (e instanceof Error && e.message.includes('No Google credentials found')) {
            return {
                success: false,
                error: 'Google account not connected.',
                authUrl: this.oauthService.getAuthUrl(context.userId),
                requiresAuth: true
            };
            }
            return {
                success: false,
                error: e instanceof Error ? e.message : 'unknown error' 
            }
        }
    }
    // async getUserSheets(credentialId: string){
    //     const credential = await prismaClient.credential.findFirst({
    //         where: {
    //             id: credentialId,
    //             type: 'google_oauth'
    //         },
    //     });

    //     if (!credential) {
    //         throw new Error('No Google credentials found for user');
    //     }

    //     const { tokens } = credential
    //     const oauth2 = new google.auth.OAuth2(
    //         process.env.GOOGLE_CLIENT_ID,
    //         process.env.GOOGLE_CLIENT_SECRET,
    //         process.env.GOOGLE_REDIRECT_URI
    //     );

    //     oauth2.setCredentials(tokens);

    //     const drive = google.drive({version: 'v3', auth: oauth2})

    //     const response = await drive.files.list({
    //         q: "mimeType='application/vnd.google-apps.spreadsheet'",
    //         spaces: 'drive',
    //         pageSize: 10,
    //         fields: 'files(id, name, createdTime)',
    //     });

    //     return response.data.files;
    // }
    async executeReadRows(sheetsService: GoogleSheetsService, context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try{
            const rows = await sheetsService.readRows({
                spreadsheetId: context.config.spreadsheetId,
                range: `${context.config.sheetName}!${context.config.range}`
            });

            return {
                success: true,
                output: {
                    rows: rows,
                    rowCount: rows.length,
                    sheetId: context.config.spreadsheetId
                }
            }
        }catch(e){
            return{
                success: false,
                error: e instanceof Error ? e.message : "Failed to read rows"
            }
        }
        
    }
}

export default  GoogleSheetsNodeExecutor ;
// export  { NodeExecutionContext, NodeExecutionResult };