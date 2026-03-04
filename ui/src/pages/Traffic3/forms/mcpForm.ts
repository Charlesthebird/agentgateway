import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalSimpleMcpConfig } from "../../../config";

/**
 * Manually configured JSON Schema for MCP Configuration
 * Handcrafted to match LocalSimpleMcpConfig type from config.d.ts
 */
export const schema: RJSFSchema = {
  type: "object",
  required: ["targets"],
  additionalProperties: true,
  properties: {
    port: {
      type: "number",
      title: "Port",
      description: "Port for MCP gateway (optional)",
    },
    targets: {
      type: "array",
      title: "MCP Targets",
      description: "List of MCP server targets",
      items: {
        type: "object",
        required: ["name"],
        additionalProperties: true,
        properties: {
          name: {
            type: "string",
            title: "Target Name",
            description: "Unique name for this MCP target",
          },
          sse: {
            type: "object",
            title: "SSE Connection",
            required: ["host"],
            properties: {
              host: {
                type: "string",
                title: "Host",
              },
              port: {
                type: "number",
                title: "Port",
              },
              path: {
                type: "string",
                title: "Path",
                default: "/sse",
              },
            },
          },
          mcp: {
            type: "object",
            title: "MCP Connection",
            required: ["host"],
            properties: {
              host: {
                type: "string",
                title: "Host",
              },
              port: {
                type: "number",
                title: "Port",
              },
              path: {
                type: "string",
                title: "Path",
              },
            },
          },
          stdio: {
            type: "object",
            title: "STDIO Connection",
            required: ["cmd"],
            properties: {
              cmd: {
                type: "string",
                title: "Command",
                description: "Command to execute",
              },
              args: {
                type: "array",
                title: "Arguments",
                items: {
                  type: "string",
                },
              },
              env: {
                type: "object",
                title: "Environment Variables",
                additionalProperties: {
                  type: "string",
                },
              },
            },
          },
          openapi: {
            type: "object",
            title: "OpenAPI Connection",
            required: ["host", "schema"],
            properties: {
              host: {
                type: "string",
                title: "Host",
              },
              port: {
                type: "number",
                title: "Port",
              },
              path: {
                type: "string",
                title: "Path",
              },
              schema: {
                type: "string",
                title: "Schema",
                description: "OpenAPI schema (file path or URL)",
              },
            },
          },
          policies: {
            type: "object",
            title: "Policies",
            additionalProperties: true,
          },
        },
      },
    },
    statefulMode: {
      type: "string",
      title: "Stateful Mode",
      enum: ["stateless", "stateful"],
      default: "stateless",
      description: "Whether to maintain state across requests",
    },
    prefixMode: {
      type: "string",
      title: "Prefix Mode",
      enum: ["always", "conditional"],
      description: "When to use target name as prefix",
    },
    policies: {
      type: "object",
      title: "Policies",
      description: "Global MCP policies",
      additionalProperties: true,
    },
  },
};

/**
 * UI Schema for MCP Configuration
 */
export const uiSchema: UiSchema = {
  "ui:title": "MCP Configuration",
  "ui:description": "Configure Model Context Protocol servers and routing",
  port: {
    "ui:placeholder": "8081",
    "ui:help": "Leave empty to use the main gateway port",
  },
  targets: {
    "ui:options": {
      orderable: true,
      addable: true,
      removable: true,
    },
    items: {
      name: {
        "ui:placeholder": "my-mcp-server",
        "ui:help": "Unique identifier for this MCP target",
      },
    },
  },
  statefulMode: {
    "ui:widget": "select",
    "ui:help": "Stateful mode maintains state across requests",
  },
  prefixMode: {
    "ui:widget": "select",
    "ui:help": "Controls when to prefix tool names with target name",
  },
};

/**
 * Default values for a new MCP config
 */
export const defaultValues: Partial<LocalSimpleMcpConfig> = {
  targets: [
    {
      name: "example-mcp-server",
      sse: {
        host: "localhost",
        port: 3000,
        path: "/sse",
      },
    },
  ],
  statefulMode: "stateless",
};

/**
 * Type guard to validate data matches LocalSimpleMcpConfig
 */
export function isLocalSimpleMcpConfig(
  data: unknown,
): data is LocalSimpleMcpConfig {
  return (
    typeof data === "object" &&
    data !== null &&
    "targets" in data &&
    Array.isArray((data as any).targets)
  );
}
