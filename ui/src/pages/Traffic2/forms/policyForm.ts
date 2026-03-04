import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { FilterOrPolicy } from "../../../config";

/**
 * JSON Schema for Policy (FilterOrPolicy)
 * Typed to match FilterOrPolicy from config.d.ts
 * This ensures the form breaks if config.d.ts changes
 *
 * Note: FilterOrPolicy is a complex type with many optional fields.
 * This form provides UI for the most commonly used policy options.
 */
export const schema: RJSFSchema = {
  type: "object",
  properties: {
    cors: {
      type: "object",
      title: "CORS Configuration",
      description: "Handle CORS preflight requests and append configured CORS headers",
      properties: {
        allowOrigins: {
          type: "array",
          title: "Allowed Origins",
          items: {
            type: "string",
          },
        },
        allowMethods: {
          type: "array",
          title: "Allowed Methods",
          items: {
            type: "string",
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
          },
        },
        allowHeaders: {
          type: "array",
          title: "Allowed Headers",
          items: {
            type: "string",
          },
        },
        exposeHeaders: {
          type: "array",
          title: "Exposed Headers",
          items: {
            type: "string",
          },
        },
        allowCredentials: {
          type: "boolean",
          title: "Allow Credentials",
          default: false,
        },
        maxAge: {
          type: "string",
          title: "Max Age",
          description: "How long preflight results can be cached (e.g., 24h)",
        },
      },
    },
    localRateLimit: {
      type: "array",
      title: "Local Rate Limiting",
      description: "Rate limit incoming requests (state kept locally)",
      items: {
        type: "object",
        properties: {
          requestsPerUnit: {
            type: "integer",
            title: "Requests Per Unit",
            minimum: 1,
          },
          unit: {
            type: "string",
            title: "Time Unit",
            enum: ["SECOND", "MINUTE", "HOUR", "DAY"],
            default: "MINUTE",
          },
          dimensions: {
            type: "array",
            title: "Rate Limit Dimensions",
            description: "Keys to group rate limits by (e.g., IP, user)",
            items: {
              type: "string",
            },
          },
        },
      },
    },
    requestHeaderModifier: {
      type: "object",
      title: "Request Header Modifier",
      description: "Headers to be modified in the request",
      properties: {
        add: {
          type: "array",
          title: "Add Headers",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Header Name" },
              value: { type: "string", title: "Header Value" },
            },
          },
        },
        set: {
          type: "array",
          title: "Set Headers",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Header Name" },
              value: { type: "string", title: "Header Value" },
            },
          },
        },
        remove: {
          type: "array",
          title: "Remove Headers",
          items: {
            type: "string",
          },
        },
      },
    },
    responseHeaderModifier: {
      type: "object",
      title: "Response Header Modifier",
      description: "Headers to be modified in the response",
      properties: {
        add: {
          type: "array",
          title: "Add Headers",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Header Name" },
              value: { type: "string", title: "Header Value" },
            },
          },
        },
        set: {
          type: "array",
          title: "Set Headers",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Header Name" },
              value: { type: "string", title: "Header Value" },
            },
          },
        },
        remove: {
          type: "array",
          title: "Remove Headers",
          items: {
            type: "string",
          },
        },
      },
    },
    timeout: {
      type: "object",
      title: "Timeout",
      description: "Timeout requests that exceed the configured duration",
      properties: {
        duration: {
          type: "string",
          title: "Duration",
          description: "e.g., 30s, 1m, 5m",
        },
      },
    },
  },
};

/**
 * UI Schema for Policy
 */
export const uiSchema: UiSchema = {
  "ui:title": "",
  "ui:description": "",
  cors: {
    allowOrigins: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
      "ui:help": "e.g., https://example.com or * for all",
    },
    allowMethods: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    allowHeaders: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    exposeHeaders: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    maxAge: {
      "ui:placeholder": "24h",
    },
  },
  localRateLimit: {
    "ui:options": {
      orderable: true,
      addable: true,
      removable: true,
    },
    items: {
      requestsPerUnit: {
        "ui:widget": "updown",
      },
      unit: {
        "ui:widget": "select",
      },
      dimensions: {
        "ui:options": {
          orderable: false,
          addable: true,
          removable: true,
        },
        "ui:help": "Examples: request.ip, request.headers['user-id']",
      },
    },
  },
  requestHeaderModifier: {
    add: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    set: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    remove: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
      items: {
        "ui:placeholder": "X-Custom-Header",
      },
    },
  },
  responseHeaderModifier: {
    add: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    set: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
    },
    remove: {
      "ui:options": {
        orderable: false,
        addable: true,
        removable: true,
      },
      items: {
        "ui:placeholder": "X-Custom-Header",
      },
    },
  },
  timeout: {
    duration: {
      "ui:placeholder": "30s",
    },
  },
};

/**
 * Default values for a new policy
 */
export const defaultValues: Partial<FilterOrPolicy> = {};

/**
 * Type guard to validate data matches FilterOrPolicy
 */
export function isFilterOrPolicy(data: unknown): data is FilterOrPolicy {
  return typeof data === "object" && data !== null;
}
