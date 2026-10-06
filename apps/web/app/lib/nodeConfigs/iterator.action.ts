import { NodeConfig } from "../types/node.types";

export const iteratorActionConfig: NodeConfig = {
  id: "iterator",
  label: "Iterator (Extract Items)",
  icon: "/globe.png",
  type: "action",
  description: "Takes an array from a single item and splits it into multiple items",
  fields: [
    {
      name: "arrayPath",
      label: "Array Path",
      type: "text",
      required: true,
      description: "The path to the array to split (e.g. {{HTTP Request.[0].json.body.products}})",
      placeholder: "{{NodeName.[0].json.body.array}}",
    }
  ],
};
