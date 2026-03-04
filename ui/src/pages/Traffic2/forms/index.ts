/**
 * Forms Index
 *
 * Central export point for all form definitions.
 * Each form exports a schema and uiSchema for use with React JSON Schema Form.
 */

import * as listenerForm from "./listenerForm";
import * as routeForm from "./routeForm";
import * as backendForm from "./backendForm";
import * as policyForm from "./policyForm";

export const forms = {
  listener: listenerForm,
  route: routeForm,
  backend: backendForm,
  policy: policyForm,
};

export type ResourceType = keyof typeof forms;

export const resourceTypes: ResourceType[] = ["listener", "route", "backend", "policy"];

export const resourceLabels: Record<ResourceType, { singular: string; plural: string }> = {
  listener: { singular: "Listener", plural: "Listeners" },
  route: { singular: "Route", plural: "Routes" },
  backend: { singular: "Backend", plural: "Backends" },
  policy: { singular: "Policy", plural: "Policies" },
};
