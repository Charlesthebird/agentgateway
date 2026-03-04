import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalListener } from "../../../config";

/**
 * Manually configured JSON Schema for Listener
 * This schema is NOT auto-generated - it's handcrafted based on TypeScript types
 * from config.d.ts for full control and customization
 */
export const schema: RJSFSchema = {
  type: "object",
  required: [],
  additionalProperties: true, // Allow fields not explicitly defined (like routes, tcpRoutes)
  properties: {
    name: {
      type: "string",
      title: "Name",
      description: "Unique name for this listener",
    },
    namespace: {
      type: "string",
      title: "Namespace",
      description: "Kubernetes namespace (optional)",
    },
    hostname: {
      type: "string",
      title: "Hostname",
      description: "Hostname to match (use * for wildcard)",
      default: "*",
    },
    protocol: {
      type: "string",
      title: "Protocol",
      enum: ["HTTP", "HTTPS", "TLS", "TCP", "HBONE"],
      default: "HTTP",
      description: "Protocol for this listener",
    },
  },
  dependencies: {
    protocol: {
      oneOf: [
        {
          // HTTP, TCP, HBONE - no TLS required
          properties: {
            protocol: { enum: ["HTTP", "TCP", "HBONE"] },
          },
        },
        {
          // HTTPS, TLS - TLS required
          properties: {
            protocol: { enum: ["HTTPS", "TLS"] },
            tls: {
              type: "object",
              title: "TLS Configuration",
              description: "Required for HTTPS/TLS protocols",
              properties: {
                cert: {
                  type: "string",
                  title: "Certificate Path",
                  description: "Path to TLS certificate file",
                },
                key: {
                  type: "string",
                  title: "Key Path",
                  description: "Path to TLS private key file",
                },
                root: {
                  type: "string",
                  title: "Root CA Path",
                  description: "Path to root CA certificate (for mutual TLS)",
                },
                cipherSuites: {
                  type: "array",
                  title: "Cipher Suites",
                  description: "Allowed cipher suites (order preserved)",
                  items: {
                    type: "string",
                  },
                },
                minTLSVersion: {
                  type: "string",
                  title: "Min TLS Version",
                  enum: ["TLS_V1_0", "TLS_V1_1", "TLS_V1_2", "TLS_V1_3"],
                  default: "TLS_V1_2",
                  description: "Minimum TLS version",
                },
                maxTLSVersion: {
                  type: "string",
                  title: "Max TLS Version",
                  enum: ["TLS_V1_0", "TLS_V1_1", "TLS_V1_2", "TLS_V1_3"],
                  default: "TLS_V1_3",
                  description: "Maximum TLS version",
                },
              },
              required: ["cert", "key"],
            },
          },
          required: ["tls"],
        },
      ],
    },
  },
};

/**
 * UI Schema for Listener
 * Customizes the form rendering
 */
export const uiSchema: UiSchema = {
  "ui:title": "Listener Configuration",
  "ui:description": "Configure listener settings for your gateway",
  "ui:order": ["name", "namespace", "hostname", "protocol", "tls", "*"],
  name: {
    "ui:placeholder": "e.g., main-listener",
    "ui:help": "Optional unique identifier for this listener",
  },
  namespace: {
    "ui:placeholder": "default",
  },
  hostname: {
    "ui:placeholder": "*",
    "ui:help": "Use * for all hosts, or specify a specific hostname",
  },
  protocol: {
    "ui:widget": "select",
  },
  tls: {
    cert: {
      "ui:placeholder": "/path/to/cert.pem",
    },
    key: {
      "ui:placeholder": "/path/to/key.pem",
    },
    root: {
      "ui:placeholder": "/path/to/ca.pem",
    },
    cipherSuites: {
      "ui:options": {
        orderable: true,
        addable: true,
        removable: true,
      },
    },
    minTLSVersion: {
      "ui:widget": "select",
    },
    maxTLSVersion: {
      "ui:widget": "select",
    },
  },
};

/**
 * Default values for a new listener
 */
export const defaultValues: Partial<LocalListener> = {
  hostname: "*",
  protocol: "HTTP",
};

/**
 * Type guard to validate data matches LocalListener
 */
export function isLocalListener(data: unknown): data is LocalListener {
  return typeof data === "object" && data !== null;
}
