import NodeRegistry from "../registry/node-registry.js";
import GoogleSheetsNodeExecutor from "./google-sheets.executor.js";

export class GoogleSheetNode {
    static definition = {
        name: "Google Sheet",
        type: "google_sheet",
        description: 'Read and write data to Google Sheets',
        config: {
            fields:[
                {
                    name: "operation",
                    type: "select",
                    required: true,
                    options: ["read_rows"]
                },
                {
                    name: "spreadSheetId",
                    type: 'text',
                    required: true
                },
                {
                    name: 'range',
                    type: 'text',
                    required: true
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
        return new GoogleSheetsNodeExecutor();
    }
}