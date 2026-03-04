import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalRouteBackend } from "../../../config";

/**
 * JSON Schema for Backend
 * Typed to match LocalRouteBackend from config.d.ts
 * This ensures the form breaks if config.d.ts changes
 */
export const schema: RJSFSchema = {
  type: "object",
  oneOf: [
    {
      title: "Service Backend",
      type: "object",
      required: ["service"],
      properties: {
        service: {
          type: "object",
          title: "Service",
          required: ["name", "port"],
          properties: {
            name: {
              type: "string",
              title: "Service Name",
              description: "Kubernetes service name or hostname",
            },
            namespace: {
              type: "string",
              title: "Namespace",
              description: "Kubernetes namespace (optional)",
            },
            port: {
              type: "integer",
              title: "Port",
              minimum: 1,
              maximum: 65535,
            },
          },
        },
        weight: {
          type: "integer",
          title: "Weight",
          minimum: 0,
          default: 100,
          description: "Load balancing weight",
        },
      },
    },
    {
      title: "Host Backend",
      type: "object",
      required: ["host"],
      properties: {
        host: {
          type: "string",
          title: "Host",
          description: "Hostname or IP address with optional port (host:port)",
        },
        weight: {
          type: "integer",
          title: "Weight",
          minimum: 0,
          default: 100,
          description: "Load balancing weight",
        },
        tls: {
          type: "object",
          title: "TLS Settings",
          properties: {
            mode: {
              type: "string",
              title: "TLS Mode",
              enum: ["DISABLED", "SIMPLE", "MUTUAL"],
              default: "DISABLED",
            },
          },
          required: ["mode"],
          dependencies: {
            mode: {
              oneOf: [
                {
                  // DISABLED - no additional fields
                  properties: {
                    mode: { enum: ["DISABLED"] },
                  },
                },
                {
                  // SIMPLE - requires CA certificates
                  properties: {
                    mode: { enum: ["SIMPLE"] },
                    caCertificates: {
                      type: "string",
                      title: "CA Certificates Path",
                      description: "Path to CA certificates for server verification",
                    },
                    sni: {
                      type: "string",
                      title: "SNI Hostname",
                      description: "Server Name Indication hostname",
                    },
                  },
                },
                {
                  // MUTUAL - requires CA certificates and client cert/key
                  properties: {
                    mode: { enum: ["MUTUAL"] },
                    caCertificates: {
                      type: "string",
                      title: "CA Certificates Path",
                      description: "Path to CA certificates for server verification",
                    },
                    clientCertificate: {
                      type: "string",
                      title: "Client Certificate Path",
                      description: "Path to client certificate for mutual TLS",
                    },
                    privateKey: {
                      type: "string",
                      title: "Private Key Path",
                      description: "Path to private key for mutual TLS",
                    },
                    sni: {
                      type: "string",
                      title: "SNI Hostname",
                      description: "Server Name Indication hostname",
                    },
                  },
                  required: ["clientCertificate", "privateKey"],
                },
              ],
            },
          },
        },
      },
    },
  ],
};

/**
 * UI Schema for Backend
 */
export const uiSchema: UiSchema = {
  "ui:title": "",
  "ui:description": "",
  service: {
    name: {
      "ui:placeholder": "my-service or my-service.namespace.svc.cluster.local",
      "ui:help": "The name of the Kubernetes service or DNS hostname",
    },
    namespace: {
      "ui:placeholder": "default",
    },
    port: {
      "ui:placeholder": "8080",
    },
  },
  host: {
    "ui:placeholder": "backend.example.com:8080 or 192.168.1.100:8080",
    "ui:help": "Hostname or IP address with optional port",
  },
  weight: {
    "ui:widget": "updown",
    "ui:help": "Higher weights receive more traffic. Default is 100.",
  },
  tls: {
    mode: {
      "ui:widget": "select",
    },
    caCertificates: {
      "ui:placeholder": "/path/to/ca.pem",
    },
    clientCertificate: {
      "ui:placeholder": "/path/to/client-cert.pem",
    },
    privateKey: {
      "ui:placeholder": "/path/to/client-key.pem",
    },
    sni: {
      "ui:placeholder": "backend.example.com",
    },
  },
};

/**
 * Default values for a new backend
 * Must match one of the oneOf options (Service Backend in this case)
 */
export const defaultValues: Partial<LocalRouteBackend> = {
  service: {
    name: "",
    port: 8080,
  },
  weight: 100,
};

/**
 * Type guard to validate data matches LocalRouteBackend
 */
export function isLocalRouteBackend(data: unknown): data is LocalRouteBackend {
  return typeof data === "object" && data !== null;
}
