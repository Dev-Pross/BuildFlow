import { prismaClient } from "@repo/db";
import { GoogleSheetNode } from "../google-sheets/google-sheets.node.js";
import { GmailService } from "../gmail/gmail.service.js";
import { GmailNode } from "../gmail/gmail.node.js";

interface NodeDefinition {
  name: string;
  type: string;
  description: string;
  config: any;
  requireAuth: boolean;
  authType?: string;
}

class NodeRegistry {
  private static registered = new Set<string>();
  private static triggers = new Set<string>()

  static async register(definition: NodeDefinition) {
    if (this.registered.has(definition.type)) return;

    try {
      await prismaClient.availableNode.upsert({
        create: {
          name: definition.name,
          type: definition.type,
          description: definition.description,
          config: definition.config,
          requireAuth: definition.requireAuth,
          authType: definition.authType,
        },
        update: {
          ...definition,
        },

        where: { type: definition.type },
      });

      this.registered.add(definition.type);
      console.log(`✅ Registered node: ${definition.name}`);
    } catch (e) {
      console.error(`❌ Failed to register ${definition.name}:`, e);
    }
  }

  static async registerTrigger(definition: NodeDefinition) {
    if (this.triggers.has(definition.type)) return;

    try {
      await prismaClient.availableTrigger.upsert({
        create: {
          name: definition.name,
          type: definition.type,
          config: definition.config,
        },
        update: {
          name: definition.name,
          type: definition.type,
          config: definition.config,
        },

        where: { type: definition.type },
      });

      this.triggers.add(definition.type);
      console.log(`✅ Registered Trigger: ${definition.name}`);
    } catch (e) {
      console.error(`❌ Failed to Trigger ${definition.name}:`, e);
    }
  }
  static async registerAll() {
    await GoogleSheetNode.register();
    await GmailNode.register();
    await NodeRegistry.registerTrigger({
      name: 'Webhook Trigger',
      type: 'webhook',
      description: 'Trigger that fires on incoming webhook events',
      config: {},
      requireAuth: false,
    });
  }
}

export default NodeRegistry;
