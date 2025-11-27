import  NodeRegistry  from "../registry/node-registry";
import { GoogleSheetsNodeExecutor } from "./google-sheets.executor";

export class GoogleSheetNode{
    static definition = {
        id: "",
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
    }

    static getExecutor(){
        return new GoogleSheetsNodeExecutor();
    }
}