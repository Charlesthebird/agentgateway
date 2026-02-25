import styled from "@emotion/styled";
import { Spin } from "antd";
import { useCallback, useState } from "react";
import { useConfig } from "../../api";
import { StyledAlert } from "../../components/StyledAlert";
import type { EditTarget } from "./components/HierarchyTree";
import { HierarchyTree } from "./components/HierarchyTree";
import { NodeEditDrawer } from "./components/NodeEditDrawer";
import { RoutingHierarchyProvider } from "./components/RoutingHierarchyContext";
import { RoutingMetrics } from "./components/RoutingMetrics";
import { useRoutingHierarchy } from "./hooks/useRoutingHierarchy";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export function TrafficRoutingPage() {
  const hierarchy = useRoutingHierarchy();
  const { mutate } = useConfig();

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const handleEditNode = useCallback((target: EditTarget) => {
    setEditTarget(target);
  }, []);

  const handleAddBind = useCallback(() => {
    setEditTarget({
      type: "bind",
      bindPort: 0, // Placeholder, will be set by the form
      isNew: true,
      schemaCategory: "backends",
      initialData: {
        port: 8080, // Default port
        listeners: [], // Empty listeners array
        tunnelProtocol: "direct", // Default
      },
    });
  }, []);

  const handleDrawerClose = useCallback(() => {
    setEditTarget(null);
  }, []);

  const handleSaved = useCallback(() => {
    // Revalidate config so the tree and metrics refresh
    mutate();
  }, [mutate]);

  if (hierarchy.error) {
    return (
      <Container>
        <h1>Routing</h1>
        <StyledAlert
          message="Error Loading Configuration"
          description={hierarchy.error.message ?? "Failed to load config"}
          type="error"
          showIcon
        />
      </Container>
    );
  }

  if (hierarchy.isLoading) {
    return (
      <Container>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
            Loading routing configuration…
          </div>
        </div>
      </Container>
    );
  }

  return (
    <RoutingHierarchyProvider hierarchy={hierarchy}>
      <Container>
        <h1>Routing</h1>

        <RoutingMetrics hierarchy={hierarchy} />

        <HierarchyTree
          hierarchy={hierarchy}
          onEditNode={handleEditNode}
          onAddBind={handleAddBind}
        />

        <NodeEditDrawer
          target={editTarget}
          onClose={handleDrawerClose}
          onSaved={handleSaved}
        />
      </Container>
    </RoutingHierarchyProvider>
  );
}
