// What information does a node config need?

export interface NodeConfig {
  id: string; // Unique identifier for the node, e.g., "google_sheet"
  type: "trigger" | "action"; // Node category
  label: string; // Display name, e.g., "Google Sheets"
  icon: string; // Node icon, e.g., "📊"
  description?: string; // Node description, e.g., "Add or update rows"
  credentials?: string; // Reference to required credential set
  fields: ConfigField[]; // All user-configurable fields
  apiEndpoints?: {
    // Optional: Endpoints this node interacts with, if dynamic
    [action: string]: string;
  };
  summary?: string; // Short summary of the node's configuration (for compact UI)
  sampleData?: Record<string, any>; // Example data the node works with
  helpUrl?: string; // Documentation or help link
  version?: string; // Node config/API version
  tags?: string[]; // Searchable tags
  // Any extra raw config data
  data?: Record<string, any>; // Allow extra arbitrary config as needed
}

export interface ConfigField {
  name: string; // Field's internal key, e.g., "sheetId"
  label: string; // Human-readable label, e.g., "Sheet ID"
  type: "text" | "dropdown" | "textarea" | "number" | "checkbox" | "password";
  required?: boolean;
  defaultValue?: string | number | boolean; // Initial value if not set
  placeholder?: string;
  fetchOptions?: string, 
  value? : string,
  options?: Array<{ label: string; id: string | number }>; // For dropdowns
  dependsOn?: string; // Name of another field this depends on
  description?: string; // Help text for this field
  multiline?: boolean; // For textarea: allow specifying multiline
  min?: number; // For number fields: min value
  max?: number; // For number fields: max value
  // You could add validation, inputMask, or other metadata as needed here
}