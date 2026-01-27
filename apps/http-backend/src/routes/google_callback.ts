import { google } from "googleapis";
import { GoogleOAuthService } from "@repo/nodes";
import type { OAuthTokens } from "@repo/nodes";
import { AuthRequest, userMiddleware } from "./userRoutes/userMiddleware.js";
import { Router, Request, Response } from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the http-backend directory
// When running from dist/, we need to go up to the src directory, then to the root
// Use override: true to ensure this .env file takes precedence over others
const envPath = join(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

// Log OAuth configuration at module load
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3002/oauth/google/callback";
console.log("🔐 OAuth Configuration loaded:");
console.log("   .env path:", envPath);
console.log("   GOOGLE_REDIRECT_URI from env:", process.env.GOOGLE_REDIRECT_URI || "NOT SET (using default)");
console.log("   Using Redirect URI:", REDIRECT_URI);
console.log("   GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : "NOT SET");
console.log("   GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET");

export const googleAuth: Router = Router();
googleAuth.get(
  "/initiate",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    // const userId = req.user?.id || "test_user"; // Get from auth middleware
    const userId = req.user?.id;
    const workflowId = req.query.workflowId as string | undefined;

    // Ensure redirect URI matches Google Cloud Console configuration
    const redirectUri = REDIRECT_URI;
    
    console.log("🔐 OAuth Initiate - Redirect URI:", redirectUri);
    console.log("🔐 OAuth Initiate - User ID:", userId);
    console.log("🔐 OAuth Initiate - Workflow ID:", workflowId || "NOT PROVIDED");

    // Encode userId and workflowId in state (format: userId|workflowId)
    const state = workflowId ? `${userId}|${workflowId}` : userId;

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      state: state,
      prompt: "consent",
    });

    console.log("🔐 OAuth Initiate - Generated Auth URL:", authUrl);
    return res.redirect(authUrl);
  }
);

googleAuth.get(
  "/callback",
  userMiddleware,
  async (req: Request, res: Response) => {
    console.log("Request recieved to the callback from fronted ")
    const code = req.query.code;
    const state = req.query.state;
    const Oauth = new GoogleOAuthService();
    if (!code || typeof code !== "string") {
      return res.json({ error: "Missing or invalid authorization code" });
    }

    // Ensure redirect URI matches Google Cloud Console configuration
    const redirectUri = REDIRECT_URI;
    
    // Parse state: format is "userId" or "userId|workflowId"
    let userId: string | undefined;
    let workflowId: string | undefined;
    
    if (state && typeof state === "string") {
      const parts = state.split("|");
      userId = parts[0];
      workflowId = parts[1]; // Will be undefined if not provided
    }
    
    console.log("🔐 OAuth Callback - Redirect URI:", redirectUri);
    console.log("🔐 OAuth Callback - Received code:", code ? "✅ Present" : "❌ Missing");
    console.log("🔐 OAuth Callback - State:", state);
    console.log("🔐 OAuth Callback - Parsed User ID:", userId);
    console.log("🔐 OAuth Callback - Parsed Workflow ID:", workflowId || "NOT PROVIDED");

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    try {
        const { tokens }  = await oauth2.getToken(code);

        // DEBUG: Log tokens received from Google
        console.log('\n🔐 Google OAuth Callback - Tokens received:');
        console.log('   access_token:', tokens.access_token ? '✅ Present' : '❌ Missing');
        console.log('   refresh_token:', tokens.refresh_token ? '✅ Present' : '❌ Missing');
        console.log('   expiry_date:', tokens.expiry_date);
        console.log('   token_type:', tokens.token_type);
        console.log('   scope:', tokens.scope);
        
        if (!tokens.refresh_token) {
            console.warn('⚠️  WARNING: No refresh_token received! User may have already authorized this app.');
            console.warn('   To force new refresh_token, user needs to revoke access at: https://myaccount.google.com/permissions');
        }

        // Save tokens to database if userId is provided
        if (userId) {
            console.log('   Saving tokens for userId:', userId);
            await Oauth.saveCredentials(userId, tokens as OAuthTokens)
            console.log('   ✅ Tokens saved to database');
        }

      // Redirect to workflow page if workflowId is provided, otherwise to general workflow page
      const redirectUrl = workflowId 
        ? `http://localhost:3000/workflows/${workflowId}`
        : "http://localhost:3000/workflow";
      console.log('   Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (err: any) {
      console.error("Google token exchange error:", err);
      // Parse state to get workflowId for error redirect
      let workflowId: string | undefined;
      if (state && typeof state === "string") {
        const parts = state.split("|");
        workflowId = parts[1];
      }
      const errorUrl = workflowId
        ? `http://localhost:3000/workflows/${workflowId}?google=error&msg=${encodeURIComponent(err?.message ?? "Token exchange failed")}`
        : `http://localhost:3000/workflow?google=error&msg=${encodeURIComponent(err?.message ?? "Token exchange failed")}`;
      return res.redirect(errorUrl);
    }
}) 

// Debug endpoint to check OAuth configuration
googleAuth.get('/debug/config', async(req: Request, res: Response)=>{
    try {
        const redirectUri = REDIRECT_URI;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
        
        // Create a test OAuth2 client to verify configuration
        const oauth2 = new google.auth.OAuth2(
            clientId,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUri
        );
        
        const testAuthUrl = oauth2.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/spreadsheets"],
            state: "test",
            prompt: "consent",
        });
        
        const urlObj = new URL(testAuthUrl);
        const redirectUriInUrl = urlObj.searchParams.get('redirect_uri');
        
        return res.json({
            environment: {
                GOOGLE_REDIRECT_URI: redirectUri,
                GOOGLE_CLIENT_ID: clientId ? `${clientId.substring(0, 20)}...` : "NOT SET",
                GOOGLE_CLIENT_SECRET: hasClientSecret ? "SET" : "NOT SET",
            },
            oauth2Client: {
                redirectUri: redirectUri,
                redirectUriInGeneratedUrl: redirectUriInUrl,
                matches: redirectUri === redirectUriInUrl,
            },
            testAuthUrl: testAuthUrl,
            message: redirectUri === redirectUriInUrl 
                ? "✅ Configuration looks correct!" 
                : "❌ Redirect URI mismatch detected!"
        });
    } catch (err) {
        return res.status(500).json({ 
            error: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined
        });
    }
});

// Debug endpoint to check stored credentials
googleAuth.get('/debug/credentials', async(req: Request, res: Response)=>{
    try {
        const { prismaClient } = await import('@repo/db/client');
        
        const credentials = await prismaClient.credential.findMany({
            where: { type: 'google_oauth' },
            select: {
                id: true,
                userId: true,
                type: true,
                config: true
            }
        });

        const debugInfo = credentials.map(cred => {
            const config = cred.config as any;
            return {
                id: cred.id,
                userId: cred.userId,
                hasAccessToken: !!config?.access_token,
                hasRefreshToken: !!config?.refresh_token,
                refreshTokenLength: config?.refresh_token?.length || 0,
                expiryDate: config?.expiry_date,
                expiresIn: config?.expiry_date ? Math.round((config.expiry_date - Date.now()) / 1000 / 60) + ' minutes' : 'N/A',
                isInvalid: config?.invalid || false,
                scope: config?.scope
            };
        });

        console.log('\n📋 Stored Credentials Debug:');
        console.table(debugInfo);

        return res.json({ credentials: debugInfo });
    } catch (err) {
        return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});
