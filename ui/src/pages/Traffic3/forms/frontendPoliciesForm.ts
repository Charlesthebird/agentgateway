import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalFrontendPolicies } from "../../../config";

/**
 * Manually configured JSON Schema for Frontend Policies
 * Handcrafted to match LocalFrontendPolicies type from config.d.ts
 */
export const schema: RJSFSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    http: {
      type: "object",
      title: "HTTP Settings",
      description: "Settings for handling incoming HTTP requests",
      additionalProperties: true,
      properties: {
        maxBufferSize: {
          type: "number",
          title: "Max Buffer Size",
          description: "Maximum buffer size for HTTP requests",
        },
      },
    },
    tls: {
      type: "object",
      title: "TLS Settings",
      description: "Settings for handling incoming TLS connections",
      additionalProperties: true,
      properties: {
        minVersion: {
          type: "string",
          title: "Minimum TLS Version",
          enum: ["TLS_V1_0", "TLS_V1_1", "TLS_V1_2", "TLS_V1_3"],
        },
        maxVersion: {
          type: "string",
          title: "Maximum TLS Version",
          enum: ["TLS_V1_0", "TLS_V1_1", "TLS_V1_2", "TLS_V1_3"],
        },
      },
    },
    tcp: {
      type: "object",
      title: "TCP Settings",
      description: "Settings for handling incoming TCP connections",
      additionalProperties: true,
    },
    accessLog: {
      type: "object",
      title: "Access Log Settings",
      description: "Settings for request access logs",
      additionalProperties: true,
      properties: {
        filter: {
          type: "string",
          title: "Filter Expression",
          description: "CEL expression to filter log entries",
        },
        add: {
          type: "object",
          title: "Add Fields",
          description: "Additional fields to add to log entries",
          additionalProperties: {
            type: "string",
          },
        },
        remove: {
          type: "array",
          title: "Remove Fields",
          description: "Fields to remove from log entries",
          items: {
            type: "string",
          },
        },
      },
    },
    tracing: {
      type: "object",
      title: "Tracing Configuration",
      description: "Distributed tracing settings",
      additionalProperties: true,
      properties: {
        enabled: {
          type: "boolean",
          title: "Enabled",
          default: false,
        },
        endpoint: {
          type: "string",
          title: "Endpoint",
          description: "Tracing endpoint URL",
        },
      },
    },
  },
};

/**
 * UI Schema for Frontend Policies
 */
export const uiSchema: UiSchema = {
  "ui:title": "Frontend Policies Configuration",
  "ui:description": "Configure frontend-level policies for HTTP, TLS, TCP, logging, and tracing",
  http: {
    maxBufferSize: {
      "ui:placeholder": "1048576",
      "ui:help": "Size in bytes (e.g., 1048576 = 1MB)",
    },
  },
  tls: {
    minVersion: {
      "ui:widget": "select",
      "ui:help": "Minimum TLS version to accept",
    },
    maxVersion: {
      "ui:widget": "select",
      "ui:help": "Maximum TLS version to accept",
    },
  },
  accessLog: {
    filter: {
      "ui:placeholder": "request.path.startsWith('/api')",
      "ui:help": "CEL expression to filter which requests are logged",
    },
  },
  tracing: {
    endpoint: {
      "ui:placeholder": "http://localhost:4318/v1/traces",
      "ui:help": "OpenTelemetry collector endpoint",
    },
  },
};

/**
 * Default values for frontend policies
 */
export const defaultValues: Partial<LocalFrontendPolicies> = {
  accessLog: {},
};

/**
 * Type guard to validate data matches LocalFrontendPolicies
 */
export function isLocalFrontendPolicies(
  data: unknown,
): data is LocalFrontendPolicies {
  return typeof data === "object" && data !== null;
}
