import { google } from "googleapis";
import { GoogleOAuthService } from "@repo/nodes";
import type { OAuthTokens } from "@repo/nodes";
import { AuthRequest, userMiddleware } from "./userRoutes/userMiddleware.js";
import { Router, Request, Response } from "express";

export const googleAuth: Router = Router();
googleAuth.get(
  "/initiate",
  userMiddleware,
  async (req: AuthRequest, res: Response) => {
    // const userId = req.user?.id || "test_user"; // Get from auth middleware
    const userId = req.user?.id;

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3002/auth/google/callback"
    );

    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      state: userId,
      prompt: "consent",
    });

    return res.redirect(authUrl);
  }
);

googleAuth.get(
  "/callback",
  userMiddleware,
  async (req: Request, res: Response) => {
    const code = req.query.code;
    const state = req.query.state;
    const Oauth = new GoogleOAuthService();
    if (!code || typeof code !== "string") {
      return res.json({ error: "Missing or invalid authorization code" });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3002/auth/google/callback"
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

        // Save tokens to database if userId (state) is provided
        if (state && typeof state === 'string') {
            console.log('   Saving tokens for userId:', state);
            await Oauth.saveCredentials(state, tokens as OAuthTokens)
            console.log('   ✅ Tokens saved to database');
        }

      // Redirect to success page
      return res.redirect("http://localhost:3000/workflow");
    } catch (err: any) {
      console.error("Google token exchange error:", err);
      return res.redirect(
        `http://localhost:3000/workflow?google=error&msg=${encodeURIComponent(err?.message ?? "Token exchange failed")}`
      );
    }
}) 

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
