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

/** Strip undefined values from a flat object so they don't leak into Prisma JSON fields */
function cleanJson(obj: Record<string, any> | undefined): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    cleaned[k] = v === undefined ? null : v;
  }
  return cleaned;
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

      const successOutputs: ExecuteItem[] = [];
      const failedOutputs: ExecuteItem[] = [];

      const itemsToProcess: ExecuteItem[] = context.items && context.items.length > 0 ? context.items : []
      if (itemsToProcess.length === 0) {
        return { success: true, output: [] }
      }

      for (let index = 0; index < itemsToProcess.length; index++) {
        const configForThisRow = context.config?.[index] || {};
        const { subject, body } = configForThisRow;
        const item = itemsToProcess[index];
        if (!item) continue;

        const rawTo = configForThisRow.to ?? item.json?.to ?? item.json?.email ?? "";
        // Extract a clean string recipient (filtering out undefined, null, or empty elements if an array was passed)
        const cleanRecipient = Array.isArray(rawTo)
          ? rawTo.filter((e): e is string => typeof e === 'string' && Boolean(e.trim())).join(', ')
          : (typeof rawTo === 'string' ? rawTo.trim() : (rawTo !== null && rawTo !== undefined ? String(rawTo) : ''));

        const result = await this.gmailService.sendEmail(cleanRecipient, subject, body);

        if (!result.success) {
          failedOutputs.push({
            json: {
              ...cleanJson(item.json),
              email: cleanRecipient,
              to: cleanRecipient,
              sent: false,
              status: "failed",
              success: false,
              error: result.error
            },
            sourceRefs: {
              ...(item.sourceRefs),
              [context.nodeId]: { wireIndex: 1, rowIndex: failedOutputs.length }
            }
          });

          continue;
        }
        successOutputs.push({
          json: {
            ...cleanJson(item.json),
            email: cleanRecipient,
            to: cleanRecipient,
            sent: true,
            status: "sent",
            success: true,
            messageId: result.data?.id || null,
            messsageId: result.data?.id || null,
            threadId: result.data?.threadId || null
          },
          sourceRefs: {
            ...(item.sourceRefs),
            [context.nodeId]: { wireIndex: 0, rowIndex: successOutputs.length }
          }
        });
      }

      return {
        success: true,
        output: [successOutputs, failedOutputs],
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
