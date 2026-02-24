import type { LocalConfig } from "../../api/types";

type Category = "policies" | "listeners" | "routes" | "backends";

/**
 * Extracts the relevant data from form submission.
 * Some schemas generate nested structures that need to be unwrapped.
 */
function extractDataForCategory(data: any, category: Category): any {
  // If data has the full nested binds structure, extract the relevant part
  if (data?.binds?.[0]) {
    const bind = data.binds[0];
    const listener = bind.listeners?.[0];
    const route = listener?.routes?.[0];

    switch (category) {
      case "listeners":
        // Extract just the listener, but ensure it has required fields
        if (listener && listener.name) {
          return listener;
        }
        break;
      case "routes":
        if (route) {
          return route;
        }
        break;
      case "backends":
        // Extract just the backend object
        if (route?.backends?.[0]) {
          return route.backends[0];
        }
        break;
      case "policies":
        if (route?.policies) {
          return route.policies;
        }
        break;
    }
  }

  // Return data as-is if it's not nested
  return data;
}

/**
 * Merges form data into the config based on the category.
 * Adds items to the first available location in the config hierarchy.
 */
export function mergeFormDataIntoConfig(
  config: LocalConfig,
  category: Category,
  data: unknown,
): LocalConfig {
  const newConfig = { ...config };
  const extractedData = extractDataForCategory(data, category);

  switch (category) {
    case "listeners": {
      // Add listener to the first bind, or create a bind if none exists
      if (!newConfig.binds || newConfig.binds.length === 0) {
        newConfig.binds = [{ port: 8080, listeners: [extractedData as any] }];
      } else {
        newConfig.binds[0].listeners = newConfig.binds[0].listeners || [];
        newConfig.binds[0].listeners.push(extractedData as any);
      }
      break;
    }
    case "routes": {
      // Add route to the first listener of the first bind
      if (!newConfig.binds?.[0]?.listeners?.[0]) {
        throw new Error("No listener found. Please create a listener first.");
      }
      newConfig.binds[0].listeners[0].routes =
        newConfig.binds[0].listeners[0].routes || [];
      newConfig.binds[0].listeners[0].routes.push(extractedData as any);
      break;
    }
    case "backends": {
      // Add backend to the first route of the first listener
      if (!newConfig.binds?.[0]?.listeners?.[0]?.routes?.[0]) {
        throw new Error("No route found. Please create a route first.");
      }
      newConfig.binds[0].listeners[0].routes[0].backends =
        newConfig.binds[0].listeners[0].routes[0].backends || [];
      newConfig.binds[0].listeners[0].routes[0].backends.push(
        extractedData as any,
      );
      break;
    }
    case "policies": {
      // Merge policies into the first route of the first listener
      if (!newConfig.binds?.[0]?.listeners?.[0]?.routes?.[0]) {
        throw new Error("No route found. Please create a route first.");
      }
      newConfig.binds[0].listeners[0].routes[0].policies = {
        ...newConfig.binds[0].listeners[0].routes[0].policies,
        ...(extractedData as any),
      };
      break;
    }
  }

  return newConfig;
}
