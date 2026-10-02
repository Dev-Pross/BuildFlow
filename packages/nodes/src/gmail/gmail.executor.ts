import { ExecuteItem } from "@repo/common/zod";
import { GoogleOAuthService } from "../common/google-oauth-service.js";
import { GmailService, GmailCredentials } from "./gmail.service.js";

interface NodeExecutionContext {
  nodeId: string;
  credentialId: string;
  userId: string;
  config: any[];
  authType?: string;
  items: ExecuteItem[]
}

interface NodeExecutionResult {
  success: boolean;
  output?: ExecuteItem[][];
  error?: string;
}

class GmailExecutor {
  private oauthService: GoogleOAuthService;
  private gmailService: GmailService | null = null;

  constructor() {
    this.oauthService = new GoogleOAuthService();
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Get credentials
      const credentials = await this.oauthService.getCredentials(
        context.userId,
        context.credentialId,
        context.authType || 'gmail_oauth'
      );

      if (!credentials) {
        return {
          success: false,
          error: "Gmail authorization required",
        };
      }

      // Initialize service
      this.gmailService = new GmailService(
        credentials.tokens as GmailCredentials
      );

      // Check token expiry and refresh if needed
      if (this.gmailService.isTokenExpired()) {
        const refreshResult: any = await this.gmailService.refreshAccessToken();
        if (refreshResult.success) {
          await this.oauthService.updateCredentials(
            credentials.id,
            refreshResult.data
          );
        }
      }

      // Send email

      const outputBoxes: ExecuteItem[] = [];

      const itemsToProcess: ExecuteItem[] = context.items && context.items.length > 0 ? context.items : [{ json: {} }]
      for (let index = 0; index < itemsToProcess.length; index++) {
        const configForThisRow = context.config?.[index] || {};
        const { to, subject, body } = configForThisRow;
        const item = itemsToProcess[index]
        if (!item) continue
        const result = await this.gmailService.sendEmail(to, subject, body);

        if (!result.success) {
          throw new Error(result.error)
        }

        outputBoxes.push({
          json: {
            ...(item.json || {}),
            gmailResponse: {
              status: "sent",
              messageId: result.data?.id,
              threadId: result.data?.threadId
            }
          },
          sourceRefs: {
            ...(item.sourceRefs || {}),
            [context.nodeId]: { wireIndex: 0, rowIndex: index }
          }
        })
      }

      return {
        success: true,
        output: [outputBoxes],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export { GmailExecutor };
// export { default as GmailExecutor } from "./gmail.executor.js";
// export { GmailService } from "./gmail.service.js";
