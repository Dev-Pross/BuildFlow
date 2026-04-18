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

  /**
   * Converts plain text with markdown-like notation to styled HTML for email.
   * Supports: code fences, inline code, bold, italic, links, bullet lists, \n, \t
   */
  private formatBodyToHtml(body: string): string {
    if (!body) return '';

    let html = body;

    // 1. Escape HTML entities first (protect raw text)
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Code fences: ```...``` → <pre><code>
    html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
      return `<pre style="background:#1e1e2e;color:#cdd6f4;padding:12px 16px;border-radius:8px;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.5;overflow-x:auto;margin:8px 0;border:1px solid #313244;">${code.trim()}</pre>`;
    });

    // 3. Inline code: `...` → <code>
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      return `<code style="background:#f0f0f5;color:#e64553;padding:2px 6px;border-radius:4px;font-family:'Courier New',Courier,monospace;font-size:0.9em;">${code}</code>`;
    });

    // 4. Bold: **text** → <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 5. Italic: *text* → <em> (but not inside bold)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // 6. Links: [text](url) → <a>
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:#1e66f5;text-decoration:underline;" target="_blank">$1</a>'
    );

    // 7. Bullet lists: lines starting with "- " or "* "
    // Process line by line to group consecutive list items
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      const isBullet = /^[-*]\s+/.test(trimmed);

      if (isBullet) {
        if (!inList) {
          processedLines.push('<ul style="margin:8px 0;padding-left:24px;">');
          inList = true;
        }
        const content = trimmed.replace(/^[-*]\s+/, '');
        processedLines.push(`<li style="margin:4px 0;">${content}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }
    if (inList) {
      processedLines.push('</ul>');
    }
    html = processedLines.join('\n');

    // 8. Tabs → indentation
    html = html.replace(/\t/g, '&emsp;');

    // 9. Newlines → <br> (but skip inside <pre> blocks)
    // Split by <pre>...</pre>, only apply <br> outside
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/g);
    html = parts.map(part => {
      if (part.startsWith('<pre')) return part;
      return part.replace(/\n/g, '<br>');
    }).join('');

    // Wrap in professional HTML email template
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;">
<div style="max-width:680px;margin:24px auto;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.7;color:#1a1a2e;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
${html}
</div>
</body>
</html>`;
  }

  async sendEmail(to: string, subject: string, body: string) {
    try {
      // Convert body to rich HTML
      const htmlBody = this.formatBodyToHtml(body);

      // Build the raw email string
      const emailLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "",
        htmlBody,
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

