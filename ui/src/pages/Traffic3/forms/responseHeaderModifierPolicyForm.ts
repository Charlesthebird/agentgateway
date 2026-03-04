import type { RJSFSchema, UiSchema } from "@rjsf/utils";

/**
 * Response Header Modifier Policy Form
 * For route.policies.responseHeaderModifier field
 */
export const schema: RJSFSchema = {
  type: "object",
  title: "Response Header Modifier",
  description: "Modify HTTP response headers before returning to the client",
  properties: {
    add: {
      type: "object",
      title: "Add Headers",
      description: "Headers to add to the response (if not already present)",
      additionalProperties: { type: "string" },
    },
    set: {
      type: "object",
      title: "Set Headers",
      description: "Headers to set on the response (overwriting if present)",
      additionalProperties: { type: "string" },
    },
    remove: {
      type: "array",
      title: "Remove Headers",
      description: "Header names to remove from the response",
      items: { type: "string" },
    },
  },
};

/**
 * UI Schema
 */
export const uiSchema: UiSchema = {
  "ui:title": "Response Header Modifier",
  "ui:description": "Modify response headers before returning to the client",
  add: {
    "ui:help": "Add headers only if they don't already exist",
  },
  set: {
    "ui:help": "Set headers, overwriting any existing values",
  },
  remove: {
    "ui:help": "Remove these headers from the response",
  },
};

/**
 * Default values
 */
export const defaultValues = {};

/**
 * Transform function
 */
export function transformBeforeSubmit(data: unknown): unknown {
  return data;
}
