/**
 * Traffic3 Forms Index
 *
 * Central export point for all manually configured form definitions.
 * Unlike Traffic2, these schemas are NOT generated from JSON files,
 * but are handcrafted TypeScript schemas that use the types from config.d.ts.
 */

import * as bindForm from "./bindForm";
import * as listenerForm from "./listenerForm";
import * as routeForm from "./routeForm";
import * as backendForm from "./backendForm";
import * as policyForm from "./policyForm";
import * as topLevelBackendForm from "./topLevelBackendForm";
import * as llmForm from "./llmForm";
import * as mcpForm from "./mcpForm";
import * as frontendPoliciesForm from "./frontendPoliciesForm";

export const forms = {
  bind: bindForm,
  listener: listenerForm,
  route: routeForm,
  backend: backendForm,
  policy: policyForm,
  topLevelBackend: topLevelBackendForm,
  llm: llmForm,
  mcp: mcpForm,
  frontendPolicies: frontendPoliciesForm,
};

export type ResourceType = keyof typeof forms;

export const resourceTypes: ResourceType[] = [
  "bind",
  "listener",
  "route",
  "backend",
  "policy",
  "topLevelBackend",
  "llm",
  "mcp",
  "frontendPolicies",
];

export const resourceLabels: Record<ResourceType, { singular: string; plural: string }> = {
  bind: { singular: "Bind", plural: "Binds" },
  listener: { singular: "Listener", plural: "Listeners" },
  route: { singular: "Route", plural: "Routes" },
  backend: { singular: "Backend", plural: "Backends" },
  policy: { singular: "Policy", plural: "Policies" },
  topLevelBackend: { singular: "Backend", plural: "Backends" },
  llm: { singular: "LLM Config", plural: "LLM Configs" },
  mcp: { singular: "MCP Config", plural: "MCP Configs" },
  frontendPolicies: { singular: "Frontend Policies", plural: "Frontend Policies" },
};
