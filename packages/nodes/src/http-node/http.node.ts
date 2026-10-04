import NodeRegister from "../registry/node-registry.js";
import { HttpNodeExecutor } from "./http.executor.js";

export class HttpNode {
    static definition = {
        name: "HTTP Request",
        type: "http_request",
        description: "Make an HTTP request to any API endpoint",
        config: {

        },
        requireAuth: false,
        icon: "/globe.png"
    };

    static async register() {
        await NodeRegister.register(this.definition)
    }

    static executor() {
        return new HttpNodeExecutor();
    }
}