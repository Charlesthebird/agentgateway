import { type ReactNode, createContext, useContext } from "react";
import type { RoutingHierarchy } from "../hooks/useRoutingHierarchy";

// eslint-disable-next-line react-refresh/only-export-components
export const RoutingHierarchyContext = createContext<RoutingHierarchy | null>(
  null,
);

// eslint-disable-next-line react-refresh/only-export-components
export function useRoutingHierarchyContext(): RoutingHierarchy | null {
  return useContext(RoutingHierarchyContext);
}

export function RoutingHierarchyProvider({
  hierarchy,
  children,
}: {
  hierarchy: RoutingHierarchy;
  children: ReactNode;
}) {
  return (
    <RoutingHierarchyContext.Provider value={hierarchy}>
      {children}
    </RoutingHierarchyContext.Provider>
  );
}
