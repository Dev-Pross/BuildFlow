import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prismaClient } from '@repo/db/client';
import { GoogleOAuthService } from '@repo/nodes';
import type { OAuthTokens } from '@repo/nodes';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // userId
  const Oauth = new GoogleOAuthService;
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2.getToken(code);

    // Save tokens to database if userId (state) is provided
    if (state) {
    //   await prismaClient.credential.create({
    //     data: {
    //       userId: state,
    //       type: 'google_oauth',
    //       config: tokens as any,
    //     },
    //   });
        await Oauth.saveCredentials(state, tokens as OAuthTokens)
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/form?google=connected', req.url));
  } catch (err: any) {
    console.error('Google token exchange error:', err);
    return NextResponse.redirect(
      new URL(`/form?google=error&msg=${encodeURIComponent(err?.message ?? 'Token exchange failed')}`, req.url)
    );
  }
}
