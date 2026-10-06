import { NodeConfig } from "../types/node.types";

export const ifElseActionConfig: NodeConfig = {
    id: "if_else",
    type: "action",
    label: "If / Else (Branch)",
    icon: "/filtering.png",
    description: "Route your data to True or False branches based on rules you define",
    outputs: [
        { id: "out-0", label: "True" },
        { id: "out-1", label: "False" }
    ],
    fields: [
        {
            name: "conditionGroups",
            label: "Branching Rules",
            type: "condition_builder",
            description: "Build condition groups to determine whether items take the True or False path."
        }
    ]
};
