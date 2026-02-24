import type { LocalConfig } from "../../api/types";

type Category = "policies" | "listeners" | "routes" | "backends";

/**
 * Merges form data into the config based on the category.
 * Handles both simple objects and nested config structures.
 */
export function mergeFormDataIntoConfig(
  config: LocalConfig,
  category: Category,
  data: any,
): LocalConfig {
  const newConfig = { ...config };

  // If data has the full nested binds structure, extract the relevant parts
  if (data?.binds?.[0]) {
    const formBind = data.binds[0];
    const formListener = formBind.listeners?.[0];
    const formRoute = formListener?.routes?.[0];
    const formBackend = formRoute?.backends?.[0];

    // Ensure binds array exists
    if (!newConfig.binds || newConfig.binds.length === 0) {
      newConfig.binds = [
        {
          port: formBind.port || 8080,
          listeners: [],
        },
      ];
    }

    const targetBind = newConfig.binds[0];

    // Extract and merge based on category
    switch (category) {
      case "listeners": {
        if (!formListener) {
          throw new Error("No listener data found in form submission.");
        }

        // Validate required fields
        if (!formListener.name) {
          throw new Error("Listener must have a 'name' field.");
        }
        if (!formListener.hostname) {
          throw new Error("Listener must have a 'hostname' field.");
        }
        if (!formListener.protocol) {
          throw new Error("Listener must have a 'protocol' field.");
        }

        targetBind.listeners = targetBind.listeners || [];
        targetBind.listeners.push(formListener);
        break;
      }

      case "routes": {
        if (!formRoute) {
          throw new Error("No route data found in form submission.");
        }

        if (!targetBind.listeners?.[0]) {
          throw new Error("No listener found. Please create a listener first.");
        }

        targetBind.listeners[0].routes = targetBind.listeners[0].routes || [];
        targetBind.listeners[0].routes.push(formRoute);
        break;
      }

      case "backends": {
        if (!formBackend) {
          throw new Error("No backend data found in form submission.");
        }

        if (!targetBind.listeners?.[0]?.routes?.[0]) {
          throw new Error("No route found. Please create a route first.");
        }

        targetBind.listeners[0].routes[0].backends =
          targetBind.listeners[0].routes[0].backends || [];
        targetBind.listeners[0].routes[0].backends.push(formBackend);
        break;
      }

      case "policies": {
        const formPolicies = formRoute?.policies;
        if (!formPolicies) {
          throw new Error("No policy data found in form submission.");
        }

        if (!targetBind.listeners?.[0]?.routes?.[0]) {
          throw new Error("No route found. Please create a route first.");
        }

        targetBind.listeners[0].routes[0].policies = {
          ...targetBind.listeners[0].routes[0].policies,
          ...formPolicies,
        };
        break;
      }
    }

    return newConfig;
  }

  // Handle simple (non-nested) data structures
  switch (category) {
    case "listeners": {
      // Add listener to the first bind, or create a bind if none exists
      if (!newConfig.binds || newConfig.binds.length === 0) {
        newConfig.binds = [{ port: 8080, listeners: [data] }];
      } else {
        newConfig.binds[0].listeners = newConfig.binds[0].listeners || [];
        newConfig.binds[0].listeners.push(data);
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
      newConfig.binds[0].listeners[0].routes.push(data);
      break;
    }
    case "backends": {
      // Add backend to the first route of the first listener
      if (!newConfig.binds?.[0]?.listeners?.[0]?.routes?.[0]) {
        throw new Error("No route found. Please create a route first.");
      }
      newConfig.binds[0].listeners[0].routes[0].backends =
        newConfig.binds[0].listeners[0].routes[0].backends || [];
      newConfig.binds[0].listeners[0].routes[0].backends.push(data);
      break;
    }
    case "policies": {
      // Merge policies into the first route of the first listener
      if (!newConfig.binds?.[0]?.listeners?.[0]?.routes?.[0]) {
        throw new Error("No route found. Please create a route first.");
      }
      newConfig.binds[0].listeners[0].routes[0].policies = {
        ...newConfig.binds[0].listeners[0].routes[0].policies,
        ...data,
      };
      break;
    }
  }

  return newConfig;
}
