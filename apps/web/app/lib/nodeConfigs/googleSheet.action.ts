import { NodeConfig } from "../types/node.types";

export const googleSheetActionConfig: NodeConfig = {
  id: "google_sheet",
  type: "action",
  label: "Google Sheets",
  icon: "📊",
  description: "Read or write data to Google Sheets",
  credentials: "google",  // Requires Google OAuth
  
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
      label: "Spreadsheet",
      type: "dropdown",
      required: true,
      description: "Select the Google Spreadsheet",
      dependsOn: "credentialId"  // Only show after credential is selected
    },
    {
      name: "sheetName",
      label: "Sheet Name",
      type: "dropdown",
      required: true,
      description: "Select the specific sheet within the spreadsheet",
      dependsOn: "spreadsheetId"  // Only show after spreadsheet is selected
    },
    {
      name: "action",
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
    }
  ],
  
  summary: "Interact with Google Sheets spreadsheets",
  helpUrl: "https://docs.example.com/google-sheets-action"
};
