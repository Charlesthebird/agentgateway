/**
 * Shared utilities for the routing node edit flow.
 * Kept in a separate (non-component) file to satisfy react-refresh rules.
 */
import { fetchConfig, updateConfig } from "../../../api/config";
import { cleanupConfig, stripFormDefaults } from "../../../api/helpers";
import type { LocalBind, LocalConfig } from "../../../api/types";
import type { ExclusiveGroup as ExclusiveGroupType } from "../../../components/FormTemplates";
import type { EditTarget, NodeType } from "./HierarchyTree";

// ---------------------------------------------------------------------------
// Error extraction
// ---------------------------------------------------------------------------

export function extractErrorMessage(e: unknown): string | null {
  if (!e) return null;
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  if (typeof e === "string") return e;
  return null;
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

export const NODE_LABELS: Record<NodeType, string> = {
  bind: "Bind",
  listener: "Listener",
  route: "Route",
  backend: "Backend",
};

// ---------------------------------------------------------------------------
// Schema maps
// ---------------------------------------------------------------------------

export type SchemaCategory =
  | "binds"
  | "listeners"
  | "routes"
  | "tcpRoutes"
  | "routeBackends"
  | "tcpRouteBackends";

export const SCHEMA_TYPE_MAP: Record<SchemaCategory, string> = {
  binds: "LocalBind",
  listeners: "LocalListener",
  routes: "LocalRoute",
  tcpRoutes: "LocalTCPRoute",
  routeBackends: "LocalRouteBackend",
  tcpRouteBackends: "LocalTCPRouteBackend",
};

export const SCHEMA_FOLDER_MAP: Record<SchemaCategory, string> = {
  binds: "listeners",
  listeners: "listeners",
  routes: "routes",
  tcpRoutes: "routes",
  routeBackends: "backends",
  tcpRouteBackends: "backends",
};

// ---------------------------------------------------------------------------
// Mutual exclusion groups
// ---------------------------------------------------------------------------

export interface ExclusiveOption {
  fieldKey: string;
  label: string;
}

export interface ExclusiveGroup extends ExclusiveGroupType {
  options: ExclusiveOption[];
}

// Note: listeners no longer has a mutual exclusion group for routes/tcpRoutes
// because those arrays are hidden from the form (managed via the hierarchy tree).
export const MUTUAL_EXCLUSIVE_GROUPS: Partial<
  Record<SchemaCategory, ExclusiveGroup[]>
> = {};

export function detectActiveKey(
  group: ExclusiveGroup,
  formData: Record<string, unknown> | null,
): string {
  if (!formData) return group.defaultKey;
  for (const opt of group.options) {
    const v = formData[opt.fieldKey];
    if (Array.isArray(v) && v.length > 0) return opt.fieldKey;
    if (v !== null && v !== undefined && !Array.isArray(v)) return opt.fieldKey;
  }
  return group.defaultKey;
}

// ---------------------------------------------------------------------------
// Child field management
// Child collections (e.g. routes on a listener) are managed via the hierarchy
// tree, not inline in the edit form. These maps drive:
//   1. Schema filtering in NodeEditForm (hide the fields from the form)
//   2. Field preservation in applyEdit (keep existing child data on save)
// ---------------------------------------------------------------------------

/** Fields to hide from the edit form and preserve unchanged on save. */
export const CHILD_FIELDS_TO_HIDE: Partial<Record<SchemaCategory, string[]>> = {
  binds: ["listeners"],
  listeners: ["routes", "tcpRoutes"],
  routes: ["backends"],
  tcpRoutes: ["backends"],
};

// ---------------------------------------------------------------------------
// Config patching helpers
// ---------------------------------------------------------------------------

export async function applyEdit(
  target: EditTarget,
  rawFormData: Record<string, unknown>,
  keepTopLevelKeys?: ReadonlySet<string>,
): Promise<void> {
  const formData = (stripFormDefaults(rawFormData, keepTopLevelKeys) ??
    {}) as Record<string, unknown>;
  const config = await fetchConfig();
  const newConfig = { ...config, binds: [...(config.binds ?? [])] };

  const bindIdx = newConfig.binds.findIndex((b) => b.port === target.bindPort);

  /**
   * For existing resources, re-inject any child fields that were hidden from
   * the form (managed via the hierarchy tree). This prevents the save from
   * wiping out routes, backends, etc. that the user didn't edit here.
   */
  const preserveChildFields = (
    fd: Record<string, unknown>,
    existing: Record<string, unknown>,
  ): Record<string, unknown> => {
    if (target.isNew) return fd;
    const childFields =
      CHILD_FIELDS_TO_HIDE[
        target.schemaCategory as keyof typeof CHILD_FIELDS_TO_HIDE
      ] ?? [];
    if (childFields.length === 0) return fd;
    const merged = { ...fd };
    for (const field of childFields) {
      if (field in existing) merged[field] = existing[field];
    }
    return merged;
  };

  if (target.type === "bind") {
    if (target.isNew) {
      // Ensure listeners always exists so useRoutingHierarchy can safely map over it.
      const newBind = { listeners: [], ...formData } as unknown as LocalBind;
      newConfig.binds.push(newBind);
    } else {
      if (bindIdx === -1) throw new Error("Bind not found");
      const existing = newConfig.binds[bindIdx] as unknown as Record<string, unknown>;
      newConfig.binds[bindIdx] = preserveChildFields(formData, existing) as unknown as LocalBind;
    }
  } else if (target.type === "listener") {
    if (target.isNew) {
      if (bindIdx === -1) {
        newConfig.binds.push({ port: target.bindPort, listeners: [formData] });
      } else {
        const bind = { ...newConfig.binds[bindIdx] };
        bind.listeners = [...bind.listeners, formData];
        newConfig.binds[bindIdx] = bind;
      }
    } else {
      if (bindIdx === -1) throw new Error("Bind not found");
      const bind = { ...newConfig.binds[bindIdx] };
      bind.listeners = [...bind.listeners];
      const existingListener = bind.listeners[target.listenerIndex!] as unknown as Record<string, unknown>;
      bind.listeners[target.listenerIndex!] = preserveChildFields(formData, existingListener);
      newConfig.binds[bindIdx] = bind;
    }
  } else if (target.type === "route") {
    if (bindIdx === -1) throw new Error("Bind not found");
    const bind = { ...newConfig.binds[bindIdx] };
    const listeners = [...bind.listeners];
    const listener = { ...listeners[target.listenerIndex!] };
    const isTcp = target.schemaCategory === "tcpRoutes";

    if (isTcp && (listener.routes?.length ?? 0) > 0) {
      throw new Error(
        "Cannot add a TCP route to a listener that already has HTTP routes. " +
          "Remove the existing HTTP routes first.",
      );
    }
    if (!isTcp && (listener.tcpRoutes?.length ?? 0) > 0) {
      throw new Error(
        "Cannot add an HTTP route to a listener that already has TCP routes. " +
          "Remove the existing TCP routes first.",
      );
    }

    if (isTcp) {
      const tcpRoutes = [...(listener.tcpRoutes ?? [])];
      if (target.isNew) {
        tcpRoutes.push(formData);
      } else {
        const existing = tcpRoutes[target.routeIndex!] as unknown as Record<string, unknown>;
        tcpRoutes[target.routeIndex!] = preserveChildFields(formData, existing ?? {});
      }
      listener.tcpRoutes = tcpRoutes;
    } else {
      const routes = [...(listener.routes ?? [])];
      if (target.isNew) {
        routes.push(formData);
      } else {
        const existing = routes[target.routeIndex!] as unknown as Record<string, unknown>;
        routes[target.routeIndex!] = preserveChildFields(formData, existing ?? {});
      }
      listener.routes = routes;
    }

    listeners[target.listenerIndex!] = listener;
    bind.listeners = listeners;
    newConfig.binds[bindIdx] = bind;
  } else if (target.type === "backend") {
    if (bindIdx === -1) throw new Error("Bind not found");
    const bind = { ...newConfig.binds[bindIdx] };
    const listeners = [...bind.listeners];
    const listener = { ...listeners[target.listenerIndex!] };
    const isTcpRoute = target.schemaCategory === "tcpRouteBackends";

    if (isTcpRoute) {
      const routes = [...(listener.tcpRoutes ?? [])];
      const route = {
        ...(routes[target.routeIndex!] as Record<string, unknown>),
      };
      const backends = [...((route.backends as unknown[]) ?? [])];
      if (target.isNew) {
        backends.push(formData);
      } else {
        backends[target.backendIndex!] = formData;
      }
      route.backends = backends;
      routes[target.routeIndex!] = route as never;
      listener.tcpRoutes = routes;
    } else {
      const routes = [...(listener.routes ?? [])];
      const route = {
        ...(routes[target.routeIndex!] as Record<string, unknown>),
      };
      const backends = [...((route.backends as unknown[]) ?? [])];
      if (target.isNew) {
        backends.push(formData);
      } else {
        backends[target.backendIndex!] = formData;
      }
      route.backends = backends;
      routes[target.routeIndex!] = route as never;
      listener.routes = routes;
    }

    listeners[target.listenerIndex!] = listener;
    bind.listeners = listeners;
    newConfig.binds[bindIdx] = bind;
  }

  await updateConfig(cleanupConfig(newConfig as LocalConfig));
}

export async function applyDelete(target: EditTarget): Promise<void> {
  const config = await fetchConfig();
  const newConfig = { ...config, binds: [...(config.binds ?? [])] };
  const bindIdx = newConfig.binds.findIndex((b) => b.port === target.bindPort);
  if (bindIdx === -1) throw new Error("Bind not found");

  if (target.type === "bind") {
    newConfig.binds.splice(bindIdx, 1);
  } else if (target.type === "listener") {
    const bind = { ...newConfig.binds[bindIdx] };
    bind.listeners = bind.listeners.filter(
      (_, i) => i !== target.listenerIndex,
    );
    newConfig.binds[bindIdx] = bind;
  } else if (target.type === "route") {
    const bind = { ...newConfig.binds[bindIdx] };
    const listeners = [...bind.listeners];
    const listener = { ...listeners[target.listenerIndex!] };
    if (target.schemaCategory === "tcpRoutes") {
      listener.tcpRoutes = (listener.tcpRoutes ?? []).filter(
        (_, i) => i !== target.routeIndex,
      );
    } else {
      listener.routes = (listener.routes ?? []).filter(
        (_, i) => i !== target.routeIndex,
      );
    }
    listeners[target.listenerIndex!] = listener;
    bind.listeners = listeners;
    newConfig.binds[bindIdx] = bind;
  } else if (target.type === "backend") {
    const bind = { ...newConfig.binds[bindIdx] };
    const listeners = [...bind.listeners];
    const listener = { ...listeners[target.listenerIndex!] };
    const isTcpRoute = target.schemaCategory === "tcpRouteBackends";

    if (isTcpRoute) {
      const routes = [...(listener.tcpRoutes ?? [])];
      const route = {
        ...(routes[target.routeIndex!] as Record<string, unknown>),
      };
      route.backends = ((route.backends as unknown[]) ?? []).filter(
        (_, i) => i !== target.backendIndex,
      );
      routes[target.routeIndex!] = route as never;
      listener.tcpRoutes = routes;
    } else {
      const routes = [...(listener.routes ?? [])];
      const route = {
        ...(routes[target.routeIndex!] as Record<string, unknown>),
      };
      route.backends = ((route.backends as unknown[]) ?? []).filter(
        (_, i) => i !== target.backendIndex,
      );
      routes[target.routeIndex!] = route as never;
      listener.routes = routes;
    }

    listeners[target.listenerIndex!] = listener;
    bind.listeners = listeners;
    newConfig.binds[bindIdx] = bind;
  }

  await updateConfig(cleanupConfig(newConfig as LocalConfig));
}
