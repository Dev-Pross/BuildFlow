import { GoogleOAuthService } from "../common/google-oauth-service.js";
import { GmailService, GmailCredentials } from "./gmail.service.js";

interface NodeExecutionContext {
  credId: string;
  userId: string;
  config?: any;
  inputData?: any;
}

interface NodeExecutionResult {
  success: boolean;
  output?: any;
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
        context.credId
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
      const { to, subject, body } = context.config;
      const result = await this.gmailService.sendEmail(to, subject, body);

      return {
        success: result.success,
        output: result.data,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default GmailExecutor;
// export { default as GmailExecutor } from "./gmail.executor.js";
// export { GmailService } from "./gmail.service.js";
