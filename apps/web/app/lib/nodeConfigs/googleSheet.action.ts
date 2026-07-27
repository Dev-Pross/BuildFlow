import { NodeConfig } from "../types/node.types";

export const googleSheetActionConfig: NodeConfig = {
  id: "google_sheet",
  type: "action",
  label: "Google Sheet",
  icon: "📊",
  description: "Read or write data to Google Sheets",
  credentials: "gsheet_oauth",  // Requires Google OAuth

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
        { label: "Read Rows", id: "read_rows" },
        { label: "Append Rows", id: "append_rows" },
        { label: "Update Rows", id: "write_rows" },
        { label: "Clear Rows", id: "clear_rows" }
      ],
      required: true,
      defaultValue: "read_rows",
      description: "What operation to perform on the sheet"
    },
    {
      name: "fetchEntireTable",
      type: "checkbox",
      label: "Fetch Entire Table",
      defaultValue: true,
      description: '"Automatically reads all rows from A1 to the last row of data',
      required: true,
      dependsOn: "operation",
      showForOperation: ['read_rows']
    },
    {
      name: 'clearEntireTable',
      type: 'checkbox',
      label: 'Clear Entire Table',
      description: 'Automatically clears all rows from A1 to the last row of data',
      required: true,
      dependsOn: "operation",
      showForOperation: ['clear_rows'],
      defaultValue: true
    },
    {
      name: "range",
      label: "Target Range / Cell",
      type: "text",
      placeholder: "e.g. A2, A1:C10, B5",
      showForOperation: ["read_rows", "clear_rows", "write_rows"],
      required: false,
      dependsOn: "operation",
      description: "Enter a custom range (e.g. A5:C20) if not fetching or clearing the entire table"
    },
    {
      name: "mappingMode",
      label: "Data Mapping Mode",
      type: "dropdown",
      options: [
        { id: "visual", label: "Visual Column Mapper" },
        { id: "bulk", label: "Bulk JSON Array" }
      ],
      defaultValue: "visual",
      showForOperation: ["append_rows", "write_rows"],
    },
    {
      name: "mappedColumns",
      type: "column_mapper",
      label: "Map Columns",
      dependsOn: "mappingMode",
      showForOperation: ["append_rows", "write_rows"],
      description: "Map variables to specific Google Sheet columns"
    },
    {
      name: "bulkValues",
      type: "textarea",
      label: "Data to Write (JSON 2D Array)",
      placeholder: '[["Value 1", "Value 2"], ["Value 3", "Value 4"]]',
      dependsOn: "mappingMode",
      showForOperation: ["append_rows", "write_rows"],
      description: "Provide a JSON 2D array or an array variable from a previous node"
    },
    {
      name: "includeHeaderRow",
      label: 'Clear Header Row',
      type: 'checkbox',
      defaultValue: false,
      description: 'When unchecked, preserves Row 1 header titles and clears data starting from Row 2 (A2:Z)',
      dependsOn: 'clearEntireTable',
      showForOperation: ['clear_rows']
    }
  ],

  summary: "Interact with Google Sheets spreadsheets",
  helpUrl: "https://docs.example.com/google-sheets-action",

  outputSchema: [
    {
      name: "Rows",
      path: "rows",
      type: "array",
      description: "All rows from the sheet",
      children: [
        { name: "Row Index", path: "[*].index", type: "number" },
        // Dynamic columns added at runtime based on sheet headers
      ]
    },
    { name: "Row Count", path: "rowCount", type: "number" },
    { name: "Sheet Name", path: "sheetName", type: "string" },
  ],
};
