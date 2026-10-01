import { config } from "dotenv";
import NodeRegistry from "../registry/node-registry.js";
import { FilterExecutor } from "./filter.executor.js";


export class FilterNode {
    static definition = {
        name: "Data Filter",
        type: "filter",
        description: "Filtering and data processing node",
        config: {
            operations: [
                {
                    value: "unique_rows",
                    label: "Remove Duplicates",
                    outputs: [
                        { id: "out-0", label: "Unique" },
                        { id: "out-1", label: "Duplicates" }
                    ]
                },
                {
                    value: "new_data_only",
                    label: "New Data Only",
                    outputs: [
                        { id: "out-0", label: "New Data" },
                        { id: "out-1", label: "Existing Data" }
                    ]
                }, {
                    value: "existing_data_only",
                    label: "Existing Data Only",
                    outputs: [
                        { id: "out-0", label: "Existing Data" },
                        { id: "out-1", label: "New Data" }
                    ]
                },
                {
                    value: "group_by",
                    label: "Group Data By Key",
                    outputs: [
                        { id: "out-0", label: "Grouped Data" }
                    ]
                },
            ]
        },
        requireAuth: false,
        icon: "/filtering.png"
    };

    static async register() {
        await NodeRegistry.register(this.definition)
    };

    static executor() {
        return new FilterExecutor()
    }

}