import NodeRegistry from "../registry/node-registry.js"
import { IfElseNodeExecutor } from "./if-else-executor.js"

export class IfElseNode {
    static definition = {
        name: "If / Else (Branch)",
        type: "if_else",
        description: "Route your data to True or False branches based on rules you define",
        config: {},
        requireAuth: false,
        icon: "",
    }

    static async register() {
        await NodeRegistry.register(this.definition)
    }

    static executor() {
        return new IfElseNodeExecutor()
    }
}