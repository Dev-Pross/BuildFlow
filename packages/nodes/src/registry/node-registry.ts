import { prismaClient } from "@repo/db";
import { GoogleSheetNode } from "../google-sheets/google-sheets.node";

interface NodeDefinition{
    id: string,
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
                where:{ type: definition.type},
                update: {
                    ...definition
                },
                create: definition
            });

            this.registered.add(definition.type);
            console.log(`✅ Registered node: ${definition.name}`);
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
