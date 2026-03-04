import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalRoute } from "../../../config";

/**
 * JSON Schema for Route
 * Typed to match LocalRoute from config.d.ts
 * This ensures the form breaks if config.d.ts changes
 */
export const schema: RJSFSchema = {
  type: "object",
  required: [],
  properties: {
    name: {
      type: "string",
      title: "Name",
      description: "Unique name for this route",
    },
    namespace: {
      type: "string",
      title: "Namespace",
      description: "Kubernetes namespace (optional)",
    },
    ruleName: {
      type: "string",
      title: "Rule Name",
      description: "Optional rule name",
    },
    hostnames: {
      type: "array",
      title: "Hostnames",
      description: "List of hostnames to match (can include wildcards)",
      items: {
        type: "string",
      },
    },
    matches: {
      type: "array",
      title: "Route Matches",
      description: "Conditions for matching incoming requests",
      items: {
        type: "object",
        properties: {
          path: {
            type: "object",
            title: "Path Match",
            default: {
              pathPrefix: "/",
            },
            oneOf: [
              {
                title: "Exact Path",
                type: "object",
                properties: {
                  exact: {
                    type: "string",
                    title: "Exact Path",
                  },
                },
                required: ["exact"],
                additionalProperties: false,
              },
              {
                title: "Path Prefix",
                type: "object",
                properties: {
                  pathPrefix: {
                    type: "string",
                    title: "Path Prefix",
                  },
                },
                required: ["pathPrefix"],
                additionalProperties: false,
              },
            ],
          },
          method: {
            type: "string",
            title: "HTTP Method",
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "CONNECT", "TRACE"],
          },
        },
        required: ["path"],
      },
    },
  },
};

/**
 * UI Schema for Route
 */
export const uiSchema: UiSchema = {
  "ui:title": "",
  "ui:description": "",
  name: {
    "ui:placeholder": "e.g., api-route",
    "ui:help": "Optional unique identifier for this route",
  },
  namespace: {
    "ui:placeholder": "default",
  },
  ruleName: {
    "ui:placeholder": "e.g., rule-1",
  },
  hostnames: {
    "ui:options": {
      orderable: false,
      addable: true,
      removable: true,
    },
    "ui:help": "e.g., api.example.com, *.example.com",
  },
  matches: {
    "ui:options": {
      orderable: true,
      addable: true,
      removable: true,
    },
    items: {
      path: {
        "ui:help": "Select how to match the request path",
      },
      method: {
        "ui:widget": "select",
        "ui:placeholder": "Any method",
        "ui:help": "Leave empty to match all HTTP methods",
      },
    },
  },
};

/**
 * Default values for a new route
 */
export const defaultValues: Partial<LocalRoute> = {
  matches: [
    {
      path: {
        pathPrefix: "/",
      },
    },
  ],
};

/**
 * Type guard to validate data matches LocalRoute
 */
export function isLocalRoute(data: unknown): data is LocalRoute {
  return typeof data === "object" && data !== null;
}
