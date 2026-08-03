import { NodeConfig } from "../types/node.types";

export const filterActionConfig: NodeConfig = {
    id: "filter", // MUST match the 'type' in your backend registry
    type: "action",
    label: "Data Filter",
    icon: "/filtering.png",
    description: "Deduplicate and cross-reference datasets",

    fields: [
        {
            name: "operation",
            label: "Filter Operation",
            type: "dropdown",
            options: [
                { label: "Remove Duplicates from Provided Data(Single List)", id: "unique_rows" },
                { label: "Find New Data Only (Compare Two Lists)", id: "new_data_only" },
                { label: "Find Existing Data Only (Compare Two Lists)", id: "existing_data_only" }
            ],
            required: true,
            defaultValue: "unique_rows",
            description: "Select how you want to filter your data"
        },
        {
            name: "sourceData",
            label: "Source Data (JSON Array)",
            type: "textarea",
            placeholder: '{{ GoogleSheet.rows }}',
            required: true,
            description: "The primary array of data you want to filter"
        },
        {
            name: "referenceData",
            label: "Reference Data (JSON Array)",
            type: "textarea",
            placeholder: '{{ Database.rows }}',
            required: false,
            dependsOn: "operation",
            showForOperation: ["new_data_only", "existing_data_only"], // Hides this field if unique_rows is selected!
            description: "The master list to compare against"
        },
        {
            name: "sourceKey",
            label: "Source Column / Key",
            type: "dynamic_schema_dropdown",
            required: false,
            description: "The specific column to use for comparison. (Optional for deduplication, required for comparisons)"
        },
        {
            name: "referenceKey",
            label: "Reference Column / Key",
            type: "dynamic_schema_dropdown",
            required: false,
            dependsOn: "operation",
            showForOperation: ["new_data_only", "existing_data_only"],
            description: "The column in the Reference Data to match against."
        }
    ],

    summary: "Filter arrays and remove duplicates",
    helpUrl: "",

    outputSchema: [
        { name: "Filtered Data", path: "filteredData", type: "array", description: "The data that passed the filter" },
        { name: "Discarded Data", path: "discardedData", type: "array", description: "The data that was thrown away" },
        { name: "Operation Used", path: "metadata.operation_used", type: "string" },
        { name: "Items Kept", path: "metadata.items_kept", type: "number" },
        { name: "Items Discarded", path: "metadata.items_discarded", type: "number" },
    ]
};
