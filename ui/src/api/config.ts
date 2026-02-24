/**
 * Configuration API functions
 */

import { get, post } from "./client";
import { cleanupConfig } from "./helpers";
import type { LocalConfig } from "./types";

/**
 * Fetches the full configuration from the agentgateway server
 */
export async function fetchConfig(): Promise<LocalConfig> {
  return get<LocalConfig>("/config");
}

/**
 * Updates the configuration
 */
export async function updateConfig(config: LocalConfig): Promise<void> {
  const cleanedConfig = cleanupConfig(config);
  await post<void>("/config", cleanedConfig);
}

/**
 * Fetches config dump (for XDS mode inspection)
 */
export async function fetchConfigDump(): Promise<any> {
  return get<any>("/config_dump");
}

/**
 * Deletes a listener by name from all binds
 */
export async function deleteListener(listenerName: string): Promise<void> {
  const config = await fetchConfig();

  // Remove the listener from all binds
  if (config.binds) {
    config.binds.forEach((bind) => {
      bind.listeners = bind.listeners.filter(
        (listener) => listener.name !== listenerName,
      );
    });
  }

  await updateConfig(config);
}
