import { google } from 'googleapis';
import { GoogleOAuthService } from '@repo/nodes';
import type { OAuthTokens } from '@repo/nodes';
import { userMiddleware } from './userRoutes/userMiddleware.js';
import { Router, Request, Response } from 'express';

export const googleAuth: Router = Router()

googleAuth.get('/callback', async(req: Request, res: Response)=>{
    const code = req.query.code;
    const state = req.query.state; // userId
    const Oauth = new GoogleOAuthService;
    if (!code || typeof code !== 'string') {
        return res.json({ error: 'Missing or invalid authorization code' });
    }

    const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    try {
        const { tokens }  = await oauth2.getToken(code);

        // Save tokens to database if userId (state) is provided
        if (state && typeof state === 'string') {

            await Oauth.saveCredentials(state, tokens as OAuthTokens)
        }

        // Redirect to success page
        return res.redirect('http://localhost:3000/workflow');
    } 
    catch (err: any) {
        console.error('Google token exchange error:', err);
        return res.redirect(
        `http://localhost:3000/workflow?google=error&msg=${encodeURIComponent(err?.message ?? 'Token exchange failed')}`);
    }
}) 
  

