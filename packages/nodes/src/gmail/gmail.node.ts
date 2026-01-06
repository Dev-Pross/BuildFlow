import NodeRegistry from "../registry/node-registry.js";
import { GmailExecutor } from "./gmail.executor.js";

export class GmailNode {
    static definition = {
        name: "Gmail",
        type: "gmail",
        description: 'Communicate with Gmail',
        config: {
            fields:[
                {
                    name: "From",
                    type: "email",
                    require: true
                },
                {
                    name: "To",
                    type: "email",
                    require: true
                },
                {
                    name:"Body",
                    type: "textArea",
                    require: true
                }
            ]
        },
        requireAuth: true,
        authType: 'google_oauth'

    };

    static async register(){
        await NodeRegistry.register(this.definition)
        // console.log(`✅ Registered node: ${this.definition.name}`);
        await NodeRegistry.registerTrigger(this.definition)
        // console.log(`✅ Registered Trigger: ${this.definition.name}`);
    }

    static getExecutor(){
        return new GmailExecutor();
    }
}