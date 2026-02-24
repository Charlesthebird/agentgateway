/**
 * API helper utilities
 */

import type { LocalBind, LocalConfig, LocalListener } from "./types";

/**
 * Cleans up the configuration by removing empty arrays and undefined values
 */
export function cleanupConfig(config: LocalConfig): LocalConfig {
  const cleaned = { ...config };

  // Clean up binds
  if (!cleaned.binds) return cleaned;

  cleaned.binds = cleaned.binds
    .map((bind) => {
      const cleanedBind = { ...bind };

      // Clean up listeners
      cleanedBind.listeners = cleanedBind.listeners
        .map((listener) => {
          const cleanedListener: any = {};

          // Only include fields that have values
          if (listener.protocol) cleanedListener.protocol = listener.protocol;
          if (listener.name) cleanedListener.name = listener.name;
          if (listener.hostname) cleanedListener.hostname = listener.hostname;
          if (listener.tls) cleanedListener.tls = listener.tls;

          // Include routes if they exist (even if empty)
          if (listener.routes !== undefined && listener.routes !== null) {
            cleanedListener.routes = listener.routes.map((route) => {
              const cleanedRoute: any = {
                hostnames: route.hostnames,
                matches: route.matches,
                backends: route.backends,
              };

              if (route.name) cleanedRoute.name = route.name;
              if (route.ruleName) cleanedRoute.ruleName = route.ruleName;
              if (route.policies) cleanedRoute.policies = route.policies;

              return cleanedRoute;
            });
          }

          // Include tcpRoutes if they exist (even if empty)
          if (listener.tcpRoutes !== undefined && listener.tcpRoutes !== null) {
            cleanedListener.tcpRoutes = listener.tcpRoutes;
          }

          return cleanedListener;
        })
        .filter((listener) => Object.keys(listener).length > 0);

      return cleanedBind;
    })
    .filter((bind) => bind.listeners.length > 0);

  // Clean up workloads and services - only include if they have content
  if (
    !cleaned.workloads ||
    (Array.isArray(cleaned.workloads) && cleaned.workloads.length === 0)
  ) {
    delete (cleaned as any).workloads;
  }

  if (
    !cleaned.services ||
    (Array.isArray(cleaned.services) && cleaned.services.length === 0)
  ) {
    delete (cleaned as any).services;
  }

  return cleaned;
}

/**
 * Extracts all listeners from all binds
 */
export function extractListeners(binds: LocalBind[]): LocalListener[] {
  const allListeners: LocalListener[] = [];
  binds.forEach((bind) => {
    if (bind.listeners) {
      allListeners.push(...bind.listeners);
    }
  });
  return allListeners;
}

/**
 * Finds a bind by port number
 */
export function findBindByPort(
  binds: LocalBind[],
  port: number,
): LocalBind | undefined {
  return binds.find((bind) => bind.port === port);
}

/**
 * Finds a listener by name in a bind
 */
export function findListenerByName(
  bind: LocalBind,
  name: string,
): LocalListener | undefined {
  return bind.listeners?.find(
    (listener: LocalListener) => listener.name === name,
  );
}

/**
 * Creates a default bind structure
 */
export function createDefaultBind(port: number): LocalBind {
  return {
    port,
    listeners: [],
  };
}

/**
 * Validates port number
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

/**
 * Formats error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    if ("message" in error) {
      return String(error.message);
    }
  }
  return String(error);
}
