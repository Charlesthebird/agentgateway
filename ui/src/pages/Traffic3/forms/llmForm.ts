import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalLLMConfig } from "../../../config";

/**
 * Manually configured JSON Schema for LLM Configuration
 * Handcrafted to match LocalLLMConfig type from config.d.ts
 */
export const schema: RJSFSchema = {
  type: "object",
  required: ["models"],
  additionalProperties: true,
  properties: {
    port: {
      type: "number",
      title: "Port",
      description: "Port for LLM gateway (optional, defaults to main gateway)",
    },
    models: {
      type: "array",
      title: "Models",
      description: "Set of models that can be served by this gateway",
      items: {
        type: "object",
        required: ["name", "provider"],
        properties: {
          name: {
            type: "string",
            title: "Model Name",
            description: "Name of the model to match from user requests",
          },
          provider: {
            type: "string",
            title: "Provider",
            enum: ["openAI", "gemini", "vertex", "anthropic", "bedrock", "azureOpenAI"],
            description: "LLM provider to connect to",
          },
          params: {
            type: "object",
            title: "Parameters",
            description: "Model-specific parameters",
            additionalProperties: true,
            properties: {
              model: {
                type: "string",
                title: "Provider Model",
                description: "Model name to use with the provider (optional)",
              },
            },
          },
          defaults: {
            type: "object",
            title: "Defaults",
            description: "Default values for requests (applied when not present)",
            additionalProperties: true,
          },
          overrides: {
            type: "object",
            title: "Overrides",
            description: "Override values for requests (applied even when present)",
            additionalProperties: true,
          },
        },
      },
    },
    policies: {
      type: "object",
      title: "Policies",
      description: "Policies for handling incoming requests before model selection",
      additionalProperties: true,
    },
  },
};

/**
 * UI Schema for LLM Configuration
 */
export const uiSchema: UiSchema = {
  "ui:title": "LLM Configuration",
  "ui:description": "Configure LLM gateway models and routing",
  port: {
    "ui:placeholder": "8080",
    "ui:help": "Leave empty to use the main gateway port",
  },
  models: {
    "ui:options": {
      orderable: true,
      addable: true,
      removable: true,
    },
    items: {
      name: {
        "ui:placeholder": "gpt-4",
        "ui:help": "Model name that users will request",
      },
      provider: {
        "ui:widget": "select",
      },
      params: {
        model: {
          "ui:placeholder": "gpt-4-turbo",
          "ui:help": "Override the model name sent to the provider",
        },
      },
    },
  },
};

/**
 * Default values for a new LLM config
 */
export const defaultValues: Partial<LocalLLMConfig> = {
  models: [
    {
      name: "gpt-4",
      provider: "openAI",
    },
  ],
};

/**
 * Type guard to validate data matches LocalLLMConfig
 */
export function isLocalLLMConfig(data: unknown): data is LocalLLMConfig {
  return (
    typeof data === "object" &&
    data !== null &&
    "models" in data &&
    Array.isArray((data as any).models)
  );
}
