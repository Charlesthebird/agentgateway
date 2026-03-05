import { useEffect, useState } from "react";
import { useConfig } from "../../../api";
import type { UrlParams } from "../Traffic3Page";
import type { useTraffic3Hierarchy } from "./useTraffic3Hierarchy";

/**
 * Hook to handle polling for a newly created node.
 * When a node is created via API and we navigate to it immediately,
 * the hierarchy might not have refreshed yet. This hook polls the
 * config until the node appears or a timeout is reached.
 */
export function useNodePolling(
  hierarchy: ReturnType<typeof useTraffic3Hierarchy>,
  urlParams: UrlParams,
  isCreating: boolean = false
) {
  const { mutate } = useConfig();
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Maximum number of polling attempts (10 attempts * 300ms = 3 seconds max)
  const MAX_ATTEMPTS = 10;
  const POLL_INTERVAL = 300; // milliseconds

  useEffect(() => {
    // Only start polling if we're in a "creating" state and hierarchy is loaded
    if (!isCreating || hierarchy.isLoading) {
      return;
    }

    // Check if the node exists
    const nodeExists = checkNodeExists(hierarchy, urlParams);

    if (nodeExists) {
      // Node found, stop polling
      setIsPolling(false);
      setAttempts(0);
      return;
    }

    // Node doesn't exist yet - start/continue polling
    if (attempts >= MAX_ATTEMPTS) {
      // Timeout reached
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const timeoutId = setTimeout(() => {
      mutate().then(() => {
        setAttempts((prev) => prev + 1);
      });
    }, POLL_INTERVAL);

    return () => clearTimeout(timeoutId);
  }, [isCreating, hierarchy, urlParams, attempts, mutate]);

  // Check if we've timed out
  const hasTimedOut = attempts >= MAX_ATTEMPTS && !checkNodeExists(hierarchy, urlParams);

  return {
    isPolling,
    hasTimedOut,
  };
}

/**
 * Check if a node exists in the hierarchy based on URL params
 */
function checkNodeExists(
  hierarchy: ReturnType<typeof useTraffic3Hierarchy>,
  urlParams: UrlParams
): boolean {
  const { port, li, ri, bi, isTcpRoute, policyType } = urlParams;

  // Check bind exists
  const bindNode = hierarchy.binds.find((b) => b.bind.port === port);
  if (!bindNode) return false;

  // If no listener index, we're looking at the bind itself
  if (li === undefined) return true;

  // Check listener exists
  const listenerNode = bindNode.listeners[li];
  if (!listenerNode) return false;

  // If no route index, we're looking at the listener itself
  if (ri === undefined) return true;

  // Check route exists
  const routeNode = listenerNode.routes.find(
    (rn) => rn.isTcp === isTcpRoute && rn.categoryIndex === ri
  );
  if (!routeNode) return false;

  // If no backend index and no policy type, we're looking at the route itself
  if (bi === undefined && !policyType) return true;

  // Check policy exists
  if (policyType) {
    const policyNode = routeNode.policies.find((p) => p.policyType === policyType);
    return !!policyNode;
  }

  // Check backend exists
  const backendNode = routeNode.backends[bi!];
  return !!backendNode;
}
