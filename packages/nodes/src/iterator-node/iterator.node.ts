import NodeRegistry from "../registry/node-registry.js"
import { IteratorExecutor } from "./iterator.executor.js"

export class IteratorNode {
    static definition = {
        name: "Iterator (Extract Items)",
        type: "iterator",
        description: "Takes an array from a single item and splits it into multiple items",
        config: {
            arrayPath: {
                type: "string",
                label: "Array Path",
                description: "The path to the array to split (e.g. {{HTTP Request.[0].json.body.products}})",
                placeholder: "{{NodeName.[0].json.body.array}}",
                required: true,
            }
        },
        requireAuth: false,
        icon: "",
    }

    static async register() {
        await NodeRegistry.register(this.definition)
    }

    static executor() {
        return new IteratorExecutor()
    }
}
