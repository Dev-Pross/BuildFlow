import { config } from "dotenv";
import NodeRegistry from "../registry/node-registry.js";
import { FilterExecutor } from "./filter.executor.js";


export class FilterNode {
    static definition = {
        name: "Data Filter",
        type: "filter",
        description: "Filtering and data processing node",
        config: {

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