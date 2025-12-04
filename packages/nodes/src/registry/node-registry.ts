import { prismaClient } from "@repo/db";
import { GoogleSheetNode } from "../google-sheets/google-sheets.node.js";

interface NodeDefinition{
    name:string,
    type: string,
    description: string,
    config: any,
    requireAuth: boolean
    authType?: string,

}

class NodeRegistry{
    private static registered = new Set<string>();

    static async register(definition: NodeDefinition){
        if(this.registered.has(definition.type)) return;

        try{
            await prismaClient.availableNode.upsert({
                create: {
                    name: definition.name,
                    type: definition.type,
                    description: definition.description,
                    config: definition.config,
                    requireAuth: definition.requireAuth,
                    authType: definition.authType
                },
                update: {
                    ...definition
                },
                
                where:{ type: definition.type}
            });

            this.registered.add(definition.type);
            console.log(`✅ Registered node: ${definition}`);
        }
        catch(e){
            console.error(`❌ Failed to register ${definition.name}:`, e);
        }
    }

    static async registerAll(){
        await GoogleSheetNode.register()
    }
}

export default NodeRegistry;
