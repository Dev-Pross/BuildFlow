import { NodeConfig } from "../types/node.types";

export const gmailActionConfig: NodeConfig = {
  id: "gmail",
  type: "action",
  label: "Gmail",           // ✅ Clean name
  icon: "📧",               // ✅ Email icon
  description: "Send emails via Gmail",
  credentials: "google",
  
  fields: [
    {
      name: "credentialId",
      label: "Google Account",
      type: "dropdown",
      required: true,
      placeholder: "Select your Google account",
      description: "Choose which Google account to use"
    },
    {
      name: "to",           // ✅ Lowercase
      label: "To",
      type: "text",         // ✅ Text input (single email)
      required: true,
      placeholder: "recipient@example.com",
      description: "Email address of the receiver",
      dependsOn: "credentialId"
    },
    {
      name: "subject",
      label: "Subject",
      type: "text",         // ✅ Text input (short)
      required: true,
      placeholder: "Email subject",
      description: "Subject line of the email"
      // No dependsOn - subject is independent
    },
    {
      name: "body",         // ✅ Lowercase
      label: "Body",
      type: "textarea",     // ✅ Textarea for long content
      required: true,
      placeholder: "Email content...",
      description: "Body content of the email"
    }
  ],
  
  summary: "Send emails via Gmail",  // ✅ Correct description
  helpUrl: "https://docs.example.com/gmail-action"
};
