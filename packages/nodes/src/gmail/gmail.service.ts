import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface GmailCredentials {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date: number;
}

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private auth: OAuth2Client;
   constructor(credentials: GmailCredentials) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // FIX 1: Set credentials
    this.auth.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      token_type: credentials.token_type,
      expiry_date: credentials.expiry_date,
    });

    // FIX 2: Initialize gmail
    this.gmail = google.gmail({ version: "v1", auth: this.auth });
  }

  async sendEmail(to: string, subject: string, body: string) {
    try {
      // Build the raw email string
      const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/html; charset=utf-8",
        "",
        body,
      ];
      const email = emailLines.join("\r\n");

      // Encode the email to base64url
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Initialize gmail if needed
      if (!this.gmail) {
        this.gmail = google.gmail({ version: "v1", auth: this.auth });
      }

      // Send email
      const result = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  isTokenExpired(): boolean {
    // Check if the token is expired, similar to GoogleSheetsService
    // this.auth.credentials.expiry_date is in ms
    if (
      !this.auth ||
      !this.auth.credentials ||
      !this.auth.credentials.expiry_date
    ) {
      return true;
    }
    const now = Date.now();
    // Give a 1-minute buffer
    return now >= this.auth.credentials.expiry_date - 60000;
  }

  async refreshAccessToken() {
    // Refresh access token using OAuth2Client, similar to GoogleSheetsService
    if (!this.auth) {
      throw new Error("OAuth2 client not initialized");
    }
    try {
      const tokens = await this.auth.refreshAccessToken();
      this.auth.setCredentials(tokens.credentials);
      return {
        success: true,
        data: tokens.credentials,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

