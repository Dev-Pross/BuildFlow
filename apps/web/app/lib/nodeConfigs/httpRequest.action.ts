import { NodeConfig } from "../types/node.types";

export const httpRequestActionConfig: NodeConfig = {
    id: "http_request",
    type: "action",
    label: "HTTP Request",
    icon: "/globe.png",
    description: "Send HTTP requests to any REST API with Postman-style controls",
    outputs: [
        { id: "out-0", label: "Response" }
    ],
    fields: [
        {
            name: "method",
            label: "Method",
            type: "dropdown",
            options: [
                { id: "GET", label: "GET" },
                { id: "POST", label: "POST" },
                { id: "PUT", label: "PUT" },
                { id: "PATCH", label: "PATCH" },
                { id: "DELETE", label: "DELETE" }
            ],
            defaultValue: "GET",
            required: true,
            description: "HTTP method for the request"
        },
        {
            name: "url",
            label: "URL",
            type: "text",
            required: true,
            placeholder: "https://api.example.com/items or {{webhook.body.url}}",
            description: "The destination API endpoint. Accepts {{variables}}.",
            acceptsVariables: true
        },
        {
            name: "queryParams",
            label: "Query Parameters",
            type: "key_value_pairs",
            required: false,
            placeholder: "Add query parameter",
            description: "URL query parameters (e.g. ?page=1). Automatically URL-encoded.",
            acceptsVariables: true
        },
        {
            name: "headers",
            label: "Headers",
            type: "key_value_pairs",
            required: false,
            placeholder: "Add request header",
            commonKeys: [
                {
                    key: "Content-Type",
                    label: "Content-Type",
                    description: "Request body format (application/json)",
                    defaultValue: "application/json"
                },
                {
                    key: "X-API-Key",
                    label: "X-API-Key",
                    description: "Custom API key authentication header",
                    defaultValue: ""
                },
                {
                    key: "Authorization",
                    label: "Authorization",
                    description: "Bearer token or credentials (Bearer <token>)",
                    defaultValue: "Bearer "
                },
                {
                    key: "Accept",
                    label: "Accept",
                    description: "Expected response format (application/json)",
                    defaultValue: "application/json"
                }
            ],
            description: "HTTP headers to send with the request.",
            acceptsVariables: true
        },
        {
            name: "body",
            label: "Request Body (JSON)",
            type: "json",
            dependsOn: "method",
            showForOperation: ["POST", "PUT", "PATCH", "DELETE"],
            required: false,
            placeholder: '{\n  "key": "{{variable}}"\n}',
            description: "Raw JSON body payload for POST, PUT, or PATCH requests.",
            multiline: true,
            acceptsVariables: true
        },
        {
            name: "timeout",
            label: "Timeout (ms)",
            type: "number",
            defaultValue: 30000,
            required: false,
            description: "Maximum time in milliseconds to wait for a response."
        }
    ]
};
