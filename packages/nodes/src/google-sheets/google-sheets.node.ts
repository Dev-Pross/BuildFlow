import NodeRegistry from "../registry/node-registry.js";
import GoogleSheetsNodeExecutor from "./google-sheets.executor.js";

export class GoogleSheetNode {
    static definition = {
        name: "Google Sheet",
        type: "google_sheet",
        description: "Google Sheets API. 'read_rows' fetches 2D array data. 'append_rows' inserts rows at the bottom. 'write_rows' overwrites specific cells. 'clear_rows' deletes data.",
        config: {
            fields: [
                {
                    name: "operation",
                    type: "select",
                    required: true,
                    options: ["read_rows", "append_rows", "write_rows", "clear_rows"]
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
        authType: 'gsheet_oauth',
        icon: "/google_sheet.svg"

    };

    static async register() {
        await NodeRegistry.register(this.definition)
        // console.log(`✅ Registered node: ${this.definition.name}`);
        // await NodeRegistry.registerTrigger(this.definition)
        // console.log(`✅ Registered Trigger: ${this.definition.name}`);
    }

    static getExecutor() {
        return new GoogleSheetsNodeExecutor();
    }
}