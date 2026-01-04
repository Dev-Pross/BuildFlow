import { google } from 'googleapis';
import { prismaClient } from "@repo/db";

interface OAuthTokens{
    access_token: string,
    refresh_token: string,
    token_type: string,
    expiry_date: number,
    scope: string
}

class GoogleOAuthService{
    private oauth2Client;
    private prisma;

    constructor(){
        this.prisma = prismaClient;
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    getAuthUrl(userId: string):string {
        const scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly'
        ]

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId,
            prompt: 'consent'
        })
    }

    async getTokens(code: string): Promise<OAuthTokens> {

        try
        {
            const {tokens} = await this.oauth2Client.getToken(code);

            return{
                access_token : tokens.access_token || '',
                refresh_token : tokens.refresh_token || '',
                expiry_date : tokens.expiry_date|| 0,
                token_type : tokens.token_type || '',
                scope : tokens.scope || ''
            }
        }
        catch(error){
            throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : "Unknow error"}`)
        }
    }

    async saveCredentials(userId: string, tokens: OAuthTokens, nodeId?: string): Promise<void> {
        try{
            // const credentialId = `cred_google_${userId}_${Date.now()}`
            
            await this.prisma.credential.create({
                data:{
                    // id:credentialId,
                    userId: userId,
                    type: 'google_oauth',
                    config: JSON.parse(JSON.stringify(tokens)),
                    nodeId: nodeId || null
                }
            })
        }
        catch(error){
            throw new Error(`failed to store data in Credentials: ${error instanceof Error ?  error.message : "Unknown Error"}`)
        }
    }

    async getCredentials(userId: string, credId: string): Promise<{id: string, tokens: OAuthTokens} | null>{

        try{
            console.log("user id: ",userId," & ",credId," from oauth service")
            const credentials = await this.prisma.credential.findFirst({
                where:{
                    id:credId,
                    // userId: userId,
                    type:'google_oauth',
                },
                orderBy:{
                    id: 'desc'
                }
            });
            console.log("credentails from oauth service: ",credentials)
            if(!credentials) return null;
            return {
                id: credentials.id,  
                tokens: credentials.config as unknown as OAuthTokens
            }
        }
        catch(err){
            throw new Error(`Failed to get credentials: ${err instanceof Error ? err.message : "unknown error"}`)
        }
    }

    async getAllCredentials(userId: string, type: string): Promise<Array<any>>{
        try{
            const credentials = await this.prisma.credential.findMany({
                where:{
                    userId: userId,
                    type: type
                },
            });
            console.log("logs from service - ",credentials)
            return credentials;
        }
        catch(err){
            throw new Error(`Failed to get all credentials: ${err instanceof Error ? err.message : "unknown error"}`)
        }
    }

    async updateCredentials(credentialId: string, tokens: Partial<OAuthTokens>): Promise<void> {
        try{
            const existing = await this.prisma.credential.findUnique({
                where:{
                    id: credentialId
                }
            });

            if(!existing) throw new Error(`No Credential found`);

            // Filter out empty/falsy values to prevent overwriting valid tokens
            const filteredTokens: Partial<OAuthTokens> = {};
            if (tokens.access_token) filteredTokens.access_token = tokens.access_token;
            if (tokens.refresh_token) filteredTokens.refresh_token = tokens.refresh_token;
            if (tokens.token_type) filteredTokens.token_type = tokens.token_type;
            if (tokens.expiry_date) filteredTokens.expiry_date = tokens.expiry_date;
            if (tokens.scope) filteredTokens.scope = tokens.scope;

            const updatedConfig = {
                ...(existing.config as object),
                ...filteredTokens
            }

            await this.prisma.credential.update({
                where:{
                    id:credentialId
                },
                data:{
                    config: updatedConfig as any
                }
            });

            console.log(`✅ Credentials updated for ${credentialId}`);
        }
        catch(e){ 
            throw new Error(`Failed to update Credentials: ${e instanceof Error ? e.message : "unknown error"}`)
        }
    }

}

export { GoogleOAuthService }
export type { OAuthTokens }

