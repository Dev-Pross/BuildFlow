import { GoogleOAuthService } from "../common/google-oauth-service";
import { GoogleSheetsService, GoogleSheetsCredentials } from "./google-sheets.service";

interface NodeExecutionContext{
    nodeId: string,
    userId: string,
    config: any,    //sheet id / range...
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

    constructor(){
        this.oauthService = new GoogleOAuthService();

    }

    async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try{

            const credentials = await this.oauthService.getCredentials(
                context.userId,
                context.nodeId
            );
           if (!credentials) {
                return {
                    success: false,
                    error: 'Google Sheets authorization required',
                    authUrl: this.oauthService.getAuthUrl(context.userId),
                    requiresAuth: true
                };
            }

            const {id: credentialId, tokens} = credentials;

                const sheetsService = new GoogleSheetsService(tokens)

                if(sheetsService.isTokenExpired()){
                    const newTokens = await sheetsService.refreshAccessToken();
                    await this.oauthService.updateCredentials(credentialId, newTokens)
                }

                const operation = context.config.operation;

                switch(operation){
                    case 'read_rows':
                        return await this.executeReadRows(sheetsService,context);

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
    async executeReadRows(sheetsService: GoogleSheetsService, context: NodeExecutionContext): Promise<NodeExecutionResult> {
        try{
            const rows = await sheetsService.readRows({
                spreadsheetId: context.config.spreadsheetId,
                range: context.config.range
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

export { GoogleSheetsNodeExecutor };
export type { NodeExecutionContext, NodeExecutionResult };