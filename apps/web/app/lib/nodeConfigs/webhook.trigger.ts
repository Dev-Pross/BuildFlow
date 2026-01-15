// import { NodeConfig } from '../types/node.types';
// // 
// export const webhookTriggerConfig: NodeConfig = {
//   id: "webhook",
//   type: "trigger",
//   label: "Webhook",
//   icon: "📡",
//   description: "Trigger workflow on HTTP request",
//   fields: [
//     {
//       name: "path",
//       label: "Webhook Path",
//       type: "text",
//       required: true,
//       placeholder: "/api/webhook/12345",
//       description: "The HTTP path where this webhook will listen. Must be unique per workflow."
//     },
//     {
//       name: "method",
//       label: "HTTP Method",
//       type: "dropdown",
//       required: true,
//       options: [
//         { label: "POST", value: "POST" },
//         { label: "GET", value: "GET" }
//       ],
//       defaultValue: "POST",
//       description: "The HTTP method to accept (typically POST)."
//     }
//   ],
//   summary: "Listen for HTTP requests on a unique webhook URL.",
//   helpUrl: "https://docs.example.com/webhook-trigger"
// };

import { NodeConfig } from "../types/node.types";

export const webhookTriggerConfig: NodeConfig = {
  id: "webhook",
  type: "trigger",
  label: "Webhook",
  icon: "📡",
  description: "Trigger workflow on HTTP request",

  // NO FIELDS! URL is auto-generated
  fields: [],

  summary: "Receives HTTP requests to trigger workflow execution",
  helpUrl: "https://docs.example.com/webhook-trigger",
};
