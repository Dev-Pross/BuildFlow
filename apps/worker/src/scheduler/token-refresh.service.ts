import { prismaClient } from "@repo/db/client";
import { GoogleOAuthService } from "@repo/nodes";

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date: number;
  scope?: string;
  email?: string;
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

  private isTokenExpiring(expiryDate: number, bufferMinutes: number = 10): boolean {
    const bufferMs = bufferMinutes * 60 * 1000;
    return expiryDate < (Date.now() + bufferMs);
  }

  private async refreshToken(credentialId: string, tokens: OAuthTokens): Promise<RefreshResult> {
    try {
      const newTokens = await this.oauthService.refreshAccessToken(tokens.refresh_token);

      const updatedTokens = {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        token_type: newTokens.token_type,
        expiry_date: newTokens.expiry_date,
        scope: newTokens.scope || tokens.scope,
        email: newTokens.email || tokens.email,
      };

      await this.oauthService.updateCredentials(credentialId, updatedTokens);

      console.log(`[Worker Scheduler] ✅ Token refreshed for credential: ${credentialId}`);
      return { credentialId, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("invalid_grant")) {
        console.log(`[Worker Scheduler] 🗑️ Deleting invalid credential ${credentialId} (refresh token revoked)`);

        try {
          const triggers = await prismaClient.trigger.findMany({
            where: {
              config: {
                path: ["credId"],
                equals: credentialId,
              },
            },
          });

          for (const trigger of triggers) {
            const config = trigger.config as any;
            delete config.credId;
            await prismaClient.trigger.update({
              where: { id: trigger.id },
              data: { config },
            });
          }

          const nodes = await prismaClient.node.findMany({
            where: {
              config: {
                path: ["credId"],
                equals: credentialId,
              },
            },
          });

          for (const node of nodes) {
            const config = node.config as any;
            delete config.credId;
            await prismaClient.node.update({
              where: { id: node.id },
              data: { config },
            });
          }

          await prismaClient.credential.delete({
            where: { id: credentialId },
          });

          console.log(`[Worker Scheduler] Credential ${credentialId} deleted.`);
        } catch (deleteError) {
          console.error(`[Worker Scheduler] Failed to delete credential: ${deleteError}`);
        }

        return {
          credentialId,
          success: false,
          error: "Credential deleted. Please reconnect your account.",
        };
      }

      console.error(`[Worker Scheduler] ❌ Failed to refresh token for ${credentialId}: ${errorMessage}`);
      return { credentialId, success: false, error: errorMessage };
    }
  }

  async refreshAllExpiringTokens(): Promise<{ total: number; refreshed: number; failed: number; deleted: number }> {
    console.log("[Worker Scheduler] 🔄 Checking expiring OAuth tokens...");

    try {
      const credentials = await prismaClient.credential.findMany({
        where: {
          type: { in: ["gmail_oauth", "gsheet_oauth", "google_oauth"] },
        },
      });

      let refreshed = 0;
      let failed = 0;
      let deleted = 0;

      for (const credential of credentials) {
        const tokens = credential.config as unknown as OAuthTokens;

        if (!tokens || !tokens.expiry_date) {
          continue;
        }

        if (this.isTokenExpiring(tokens.expiry_date)) {
          const expiresIn = Math.round((tokens.expiry_date - Date.now()) / 1000 / 60);
          console.log(`[Worker Scheduler] ⏰ Credential ${credential.id} expires in ${expiresIn} min - refreshing...`);

          const result = await this.refreshToken(credential.id, tokens);

          if (result.success) {
            refreshed++;
          } else if (result.error?.includes("deleted")) {
            deleted++;
          } else {
            failed++;
          }
        }
      }

      console.log(`[Worker Scheduler] Token check complete: ${refreshed} refreshed, ${failed} failed, ${deleted} deleted.`);
      return { total: credentials.length, refreshed, failed, deleted };
    } catch (error) {
      console.error("[Worker Scheduler] ❌ Token refresh job failed:", error instanceof Error ? error.message : error);
      throw error;
    }
  }
}

export const tokenRefreshService = new TokenRefreshService();
