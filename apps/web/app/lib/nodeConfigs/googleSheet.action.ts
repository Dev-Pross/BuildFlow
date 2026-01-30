import { NodeConfig } from "../types/node.types";

export const googleSheetActionConfig: NodeConfig = {
  id: "google_sheet",
  type: "action",
  label: "Google Sheet",
  icon: "📊",
  description: "Read or write data to Google Sheets",
  credentials: "google_oauth",  // Requires Google OAuth
  
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
      name: "spreadsheetId", 
      type: "dropdown",
      label: "Spreadsheet",
      required: true,
      dependsOn: "credentialId",  // <-- This field depends on credentialId
      fetchOptions: "google.getDocuments", // <-- API method to call
    },
    {
      name: "sheetName",
      type: "dropdown", 
      label: "Sheet",
      required: true,
      dependsOn: "spreadsheetId",
      fetchOptions: "google.getSheets",
    },
    {
      name: "operation",
      label: "Action",
      type: "dropdown",
      options: [
        { label: "Read Rows", value: "read_rows" },
        { label: "Append Row", value: "append_row" },
        { label: "Update Row", value: "update_row" }
      ],
      required: true,
      defaultValue: "read_rows",
      description: "What operation to perform on the sheet"
    },
    {
      name: "range",
      type: "text", 
      label: "Range",
      value: "A1:Z100",
      required: true
    }
  ],
  
  summary: "Interact with Google Sheets spreadsheets",
  helpUrl: "https://docs.example.com/google-sheets-action"
};
