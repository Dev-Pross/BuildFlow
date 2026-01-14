import { NodeConfig } from "../types/node.types";
import { gmailActionConfig } from "./gmail.action";
import { googleSheetActionConfig } from "./googleSheet.action";
import { webhookTriggerConfig } from "./webhook.trigger";

// 1. Create a dictionary of all your nodes
// We map them by their 'label' (what shows on the node) AND their 'id' (internal type)
// so we can find them easily either way.
export const NODE_CONFIG_REGISTRY: Record<string, NodeConfig> = {
  // Map by Label (matches the `data.label` from your node)
  [gmailActionConfig.label]: gmailActionConfig,
  [googleSheetActionConfig.label]: googleSheetActionConfig,
  [webhookTriggerConfig.label]: webhookTriggerConfig,

  // Map by ID (internal safety fallback)
  [gmailActionConfig.id]: gmailActionConfig, // "gmail"
  [googleSheetActionConfig.id]: googleSheetActionConfig, // "google_sheet"
  [webhookTriggerConfig.id]: webhookTriggerConfig, // "webhook"
};

/**
 * Helper to get the config object for a given node label or type.
 * @param identifier The label (e.g. "Gmail") or id (e.g. "gmail") of the node
 */
export const getNodeConfig = (identifier: string): NodeConfig | null => {
  return NODE_CONFIG_REGISTRY[identifier] || null;
};
