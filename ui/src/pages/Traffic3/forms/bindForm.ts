import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalBind } from "../../../config";

/**
 * Manually configured JSON Schema for Bind
 * Handcrafted to match LocalBind type from config.d.ts
 */
export const schema: RJSFSchema = {
  type: "object",
  required: ["port"],
  additionalProperties: true, // Allow fields not explicitly defined (like listeners)
  properties: {
    port: {
      type: "integer",
      title: "Port",
      description: "Port number to bind to (1-65535)",
      minimum: 1,
      maximum: 65535,
    },
    tunnelProtocol: {
      type: "string",
      title: "Tunnel Protocol",
      enum: ["direct", "hbone", "none"],
      default: "direct",
      description: "Protocol for tunneling",
    },
  },
};

/**
 * UI Schema for Bind
 */
export const uiSchema: UiSchema = {
  "ui:title": "Bind Configuration",
  "ui:description": "Configure port binding for the gateway",
  port: {
    "ui:widget": "updown",
    "ui:placeholder": "8080",
    "ui:help": "The port number this bind will listen on",
  },
  tunnelProtocol: {
    "ui:widget": "select",
    "ui:help": "Choose the tunneling protocol (direct is most common)",
  },
};

/**
 * Default values for a new bind
 */
export const defaultValues: Partial<LocalBind> = {
  port: 8080,
  tunnelProtocol: "direct",
  listeners: [],
};

/**
 * Type guard to validate data matches LocalBind
 */
export function isLocalBind(data: unknown): data is LocalBind {
  return typeof data === "object" && data !== null;
}
