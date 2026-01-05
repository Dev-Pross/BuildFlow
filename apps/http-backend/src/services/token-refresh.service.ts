import { prismaClient } from "@repo/db/client";
import { GoogleSheetsService, GoogleOAuthService } from "@repo/nodes";

interface OAuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expiry_date: number;
    scope?: string;
}

interface RefreshResult {
    credentialId: string;
    success: boolean;
    error?: string;
}

class TokenRefreshService {
    private oauthService: GoogleOAuthService;

    constructor() {
        this.oauthService = new GoogleOAuthService();
    }

    /**
     * Check if token is expired or expiring soon (within buffer time)
     */
    private isTokenExpiring(expiryDate: number, bufferMinutes: number = 10): boolean {
        const bufferMs = bufferMinutes * 60 * 1000;
        return expiryDate < (Date.now() + bufferMs);
    }

    /**
     * Refresh a single credential's access token using existing GoogleSheetsService
     */
    private async refreshToken(credentialId: string, tokens: OAuthTokens): Promise<RefreshResult> {
        try {
            // Use your existing GoogleSheetsService to refresh the token
            const sheetService = new GoogleSheetsService({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_type: tokens.token_type,
                expiry_date: tokens.expiry_date
            });

            // Use your existing refreshAccessToken method
            const newTokens = await sheetService.refreshAccessToken();

            // Use your existing updateCredentials method from GoogleOAuthService
            await this.oauthService.updateCredentials(credentialId, {
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || tokens.refresh_token,
                token_type: newTokens.token_type,
                expiry_date: newTokens.expiry_date
            });

            console.log(`✅ Token refreshed for credential: ${credentialId}`);
            return { credentialId, success: true };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Handle invalid_grant - refresh token is no longer valid
            if (errorMessage.includes('invalid_grant')) {
                console.log(`🗑️  Deleting invalid credential ${credentialId} (refresh token expired/revoked)`);
                
                try {
                    // 1. Clear credId from any Triggers that use this credential
                    const triggers = await prismaClient.trigger.findMany({
                        where: {
                            config: {
                                path: ['credId'],
                                equals: credentialId
                            }
                        }
                    });
                    
                    for (const trigger of triggers) {
                        const config = trigger.config as any;
                        delete config.credId;
                        await prismaClient.trigger.update({
                            where: { id: trigger.id },
                            data: { config }
                        });
                        console.log(`   Cleared credId from Trigger ${trigger.id}`);
                    }

                    // 2. Clear credId from any Nodes that use this credential
                    const nodes = await prismaClient.node.findMany({
                        where: {
                            config: {
                                path: ['credId'],
                                equals: credentialId
                            }
                        }
                    });
                    
                    for (const node of nodes) {
                        const config = node.config as any;
                        delete config.credId;
                        await prismaClient.node.update({
                            where: { id: node.id },
                            data: { config }
                        });
                        console.log(`   Cleared credId from Node ${node.id}`);
                    }

                    // 3. Delete the credential
                    await prismaClient.credential.delete({
                        where: { id: credentialId }
                    });
                    
                    console.log(`✅ Credential ${credentialId} deleted. Cleared from ${triggers.length} triggers and ${nodes.length} nodes.`);
                    console.log(`   User needs to reconnect Google account.`);
                    
                } catch (deleteError) {
                    console.error(`Failed to delete credential: ${deleteError}`);
                }
                
                return { 
                    credentialId, 
                    success: false, 
                    error: 'Credential deleted. Please reconnect your Google account.' 
                };
            }
            
            console.error(`❌ Failed to refresh token for credential ${credentialId}: ${errorMessage}`);
            return { credentialId, success: false, error: errorMessage };
        }
    }

    /**
     * Check and refresh all Google OAuth credentials that are expiring
     */
    async refreshAllExpiringTokens(): Promise<{ total: number; refreshed: number; failed: number; deleted: number }> {
        console.log('\n🔄 Starting token refresh job...');
        
        try {
            // Fetch all google_oauth credentials
            const credentials = await prismaClient.credential.findMany({
                where: {
                    type: 'google_oauth'
                }
            });

            console.log(`📋 Found ${credentials.length} Google OAuth credentials`);

            let refreshed = 0;
            let failed = 0;
            let deleted = 0;

            for (const credential of credentials) {
                const tokens = credential.config as unknown as OAuthTokens;

                // Skip if no tokens or no expiry_date
                if (!tokens || !tokens.expiry_date) {
                    console.log(`⏭️  Skipping credential ${credential.id}: No expiry_date found`);
                    continue;
                }

                // Check if token is expiring soon
                if (this.isTokenExpiring(tokens.expiry_date)) {
                    const expiresIn = Math.round((tokens.expiry_date - Date.now()) / 1000 / 60);
                    console.log(`⏰ Credential ${credential.id} expires in ${expiresIn} minutes - refreshing...`);
                    
                    const result = await this.refreshToken(credential.id, tokens);
                    
                    if (result.success) {
                        refreshed++;
                    } else if (result.error?.includes('deleted')) {
                        deleted++;
                    } else {
                        failed++;
                    }
                } else {
                    const expiresIn = Math.round((tokens.expiry_date - Date.now()) / 1000 / 60);
                    console.log(`✓ Credential ${credential.id} still valid (expires in ${expiresIn} minutes)`);
                }
            }

            console.log(`\n📊 Token refresh job completed:`);
            console.log(`   Total credentials: ${credentials.length}`);
            console.log(`   Refreshed: ${refreshed}`);
            console.log(`   Deleted (invalid): ${deleted}`);
            console.log(`   Failed: ${failed}`);
            console.log(`   Skipped (still valid): ${credentials.length - refreshed - failed - deleted}\n`);

            return { total: credentials.length, refreshed, failed, deleted };

        } catch (error) {
            console.error('❌ Token refresh job failed:', error instanceof Error ? error.message : error);
            throw error;
        }
    }

    /**
     * Check and refresh a single credential by ID
     */
    async refreshSingleCredential(credentialId: string): Promise<RefreshResult> {
        try {
            const credential = await prismaClient.credential.findUnique({
                where: { id: credentialId }
            });

            if (!credential) {
                return { credentialId, success: false, error: 'Credential not found' };
            }

            const tokens = credential.config as unknown as OAuthTokens;

            if (!tokens || !tokens.refresh_token) {
                return { credentialId, success: false, error: 'No refresh token available' };
            }

            return await this.refreshToken(credentialId, tokens);

        } catch (error) {
            return { 
                credentialId, 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }
}

export const tokenRefreshService = new TokenRefreshService();
export { TokenRefreshService };
