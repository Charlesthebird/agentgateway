import { useMemo } from "react";
import { useConfig } from "../../../api";
import type {
  FullLocalBackend,
  LocalBind,
  LocalListener,
  LocalListenerProtocol,
  LocalPolicy,
  LocalRoute,
  LocalRouteBackend,
  LocalTCPRoute,
} from "../../../api/types";

// ---------------------------------------------------------------------------
// Hierarchy node types
// ---------------------------------------------------------------------------

export interface ValidationError {
  level: "error" | "warning";
  message: string;
}

export interface BackendNode {
  /** Raw backend object (LocalRouteBackend or LocalTCPRouteBackend) */
  backend: Record<string, unknown>;
  /** Index within route.backends */
  backendIndex: number;
  /** Whether this backend belongs to a TCP route */
  isTcpRoute: boolean;
}

export interface RouteNode {
  /** Original route data */
  route: LocalRoute | LocalTCPRoute;
  /** True when this is a TCP route (listener.tcpRoutes), false for HTTP */
  isTcp: boolean;
  /** Index within listener.routes or listener.tcpRoutes (based on isTcp) */
  categoryIndex: number;
  /** Inherited from parent bind */
  port: number;
  /** Inherited from parent listener */
  listenerName: string | null;
  listenerProtocol: LocalListenerProtocol | undefined;
  validationErrors: ValidationError[];
  /** Inline backends attached to this route */
  backends: BackendNode[];
}

export interface ListenerNode {
  /** Original listener data */
  listener: LocalListener;
  /** Inherited from parent bind */
  port: number;
  routes: RouteNode[];
  validationErrors: ValidationError[];
}

export interface BindNode {
  bind: LocalBind;
  listeners: ListenerNode[];
  validationErrors: ValidationError[];
}

export interface RoutingHierarchy {
  binds: BindNode[];
  /** Top-level named backends from config.backends */
  topLevelBackends: FullLocalBackend[];
  /** Top-level named policies from config.policies */
  topLevelPolicies: LocalPolicy[];
  stats: {
    totalBinds: number;
    totalListeners: number;
    totalRoutes: number;
    totalTopLevelBackends: number;
    brokenBackendRefs: number;
    totalValidationErrors: number;
  };
  isLoading: boolean;
  error: Error | undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const HTTP_PROTOCOLS: Array<LocalListenerProtocol | undefined> = [
  "HTTP",
  "HTTPS",
];
const TCP_PROTOCOLS: Array<LocalListenerProtocol | undefined> = ["TCP"];

function validateRoute(
  route: LocalRoute,
  listener: LocalListener,
  namedBackendNames: Set<string>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Protocol mismatch: TCP listener shouldn't have HTTP routes
  if (
    TCP_PROTOCOLS.includes(listener.protocol) &&
    (route.matches?.length ?? 0) > 0
  ) {
    errors.push({
      level: "warning",
      message: `Route "${route.name ?? "unnamed"}" has HTTP match conditions but is attached to a TCP listener.`,
    });
  }

  // Check if any route backend references a named backend that doesn't exist
  for (const backend of route.backends ?? []) {
    const backendRef = getNamedBackendRef(backend);
    if (backendRef && !namedBackendNames.has(backendRef)) {
      errors.push({
        level: "error",
        message: `Route "${route.name ?? "unnamed"}" references backend "${backendRef}" which is not defined in config.backends.`,
      });
    }
  }

  return errors;
}

function validateListener(
  listener: LocalListener,
  bindPort: number,
  allListeners: Array<{ hostname?: string | null; port: number }>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Duplicate hostname+port across listeners on the same bind
  if (listener.hostname && listener.hostname !== "*") {
    const duplicates = allListeners.filter(
      (l) => l.hostname === listener.hostname && l.port === bindPort,
    );
    if (duplicates.length > 1) {
      errors.push({
        level: "warning",
        message: `Hostname "${listener.hostname}" is used by multiple listeners on port ${bindPort}.`,
      });
    }
  }

  // HTTP-only protocols should not have tcpRoutes
  if (
    HTTP_PROTOCOLS.includes(listener.protocol) &&
    (listener.tcpRoutes?.length ?? 0) > 0
  ) {
    errors.push({
      level: "warning",
      message: `Listener "${listener.name ?? "unnamed"}" has TCP routes but uses protocol ${listener.protocol}.`,
    });
  }

  return errors;
}

/**
 * Extract a named backend reference from a LocalRouteBackend if it uses
 * the `backend` string reference form. Returns null if the backend is
 * defined inline rather than by name.
 */
function getNamedBackendRef(backend: LocalRouteBackend): string | null {
  if (typeof backend === "string") return null;
  const b = backend as Record<string, unknown>;
  if (typeof b["backend"] === "string") return b["backend"];
  return null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRoutingHierarchy(): RoutingHierarchy {
  const { data: config, error, isLoading } = useConfig();

  return useMemo<RoutingHierarchy>(() => {
    const topLevelBackends: FullLocalBackend[] = config?.backends ?? [];
    const topLevelPolicies: LocalPolicy[] = config?.policies ?? [];
    const namedBackendNames = new Set(topLevelBackends.map((b) => b.name));

    // Flat list of all listener hostname+port pairs for duplicate detection
    const allListenerHostnames: Array<{
      hostname?: string | null;
      port: number;
    }> = (config?.binds ?? []).flatMap((bind) =>
      bind.listeners.map((l) => ({ hostname: l.hostname, port: bind.port })),
    );

    let totalListeners = 0;
    let totalRoutes = 0;
    let brokenBackendRefs = 0;
    let totalValidationErrors = 0;

    const binds: BindNode[] = (config?.binds ?? []).map((bind) => {
      const listenerNodes: ListenerNode[] = bind.listeners.map((listener) => {
        totalListeners++;
        const listenerErrors = validateListener(
          listener,
          bind.port,
          allListenerHostnames,
        );

        // HTTP routes
        const httpRouteNodes: RouteNode[] = (listener.routes ?? []).map(
          (route, idx) => {
            totalRoutes++;
            const routeErrors = validateRoute(
              route,
              listener,
              namedBackendNames,
            );
            const brokenRefs = routeErrors.filter(
              (e) =>
                e.level === "error" && e.message.includes("references backend"),
            ).length;
            brokenBackendRefs += brokenRefs;

            const backends: BackendNode[] = (route.backends ?? []).map(
              (b, bi) => ({
                backend: b as unknown as Record<string, unknown>,
                backendIndex: bi,
                isTcpRoute: false,
              }),
            );

            return {
              route,
              isTcp: false,
              categoryIndex: idx,
              port: bind.port,
              listenerName: listener.name ?? null,
              listenerProtocol: listener.protocol,
              validationErrors: routeErrors,
              backends,
            };
          },
        );

        // TCP routes
        const tcpRouteNodes: RouteNode[] = (listener.tcpRoutes ?? []).map(
          (route, idx) => {
            totalRoutes++;
            const backends: BackendNode[] = (route.backends ?? []).map(
              (b, bi) => ({
                backend: b as unknown as Record<string, unknown>,
                backendIndex: bi,
                isTcpRoute: true,
              }),
            );

            return {
              route,
              isTcp: true,
              categoryIndex: idx,
              port: bind.port,
              listenerName: listener.name ?? null,
              listenerProtocol: listener.protocol,
              validationErrors: [],
              backends,
            };
          },
        );

        const allRouteNodes = [...httpRouteNodes, ...tcpRouteNodes];

        return {
          listener,
          port: bind.port,
          routes: allRouteNodes,
          validationErrors: listenerErrors,
        };
      });

      // Count errors
      for (const ln of listenerNodes) {
        totalValidationErrors += ln.validationErrors.length;
        for (const rn of ln.routes) {
          totalValidationErrors += rn.validationErrors.length;
        }
      }

      return {
        bind,
        listeners: listenerNodes,
        validationErrors: [],
      };
    });

    return {
      binds,
      topLevelBackends,
      topLevelPolicies,
      stats: {
        totalBinds: binds.length,
        totalListeners,
        totalRoutes,
        totalTopLevelBackends: topLevelBackends.length,
        brokenBackendRefs,
        totalValidationErrors,
      },
      isLoading: isLoading ?? false,
      error: error as Error | undefined,
    };
  }, [config, error, isLoading]);
}
