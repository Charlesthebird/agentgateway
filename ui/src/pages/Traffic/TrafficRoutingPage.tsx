import styled from "@emotion/styled";
import { Breadcrumb, Button, Spin } from "antd";
import { Edit2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useConfig } from "../../api";
import { StyledAlert } from "../../components/StyledAlert";
import type { EditTarget } from "./components/HierarchyTree";
import { HierarchyTree } from "./components/HierarchyTree";
import { NodeEditDrawer } from "./components/NodeEditDrawer";
import { RoutingHierarchyProvider } from "./components/RoutingHierarchyContext";
import { RoutingMetrics } from "./components/RoutingMetrics";
import { useRoutingHierarchy } from "./hooks/useRoutingHierarchy";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const FullContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

const SplitRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
`;

/** Full-width header above both sidebar and content */
const PageHeader = styled.div`
  padding: var(--spacing-md) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-container);
  flex-shrink: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--spacing-xs);
`;

const TitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

const PageTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-base);
`;

const TypeBadge = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-layout);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
`;

const SplitBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 380px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;


const DetailPanel = styled.div`
  flex: 1;
  overflow-y: auto;
`;

// ---------------------------------------------------------------------------
// URL parsing — extract hierarchy position from the current pathname
// ---------------------------------------------------------------------------

interface UrlParams {
  port: number;
  li?: number;
  isTcpRoute: boolean;
  ri?: number;
  bi?: number;
}

function parseRoutingPath(pathname: string): UrlParams | null {
  const m = pathname.match(
    /\/traffic\/routing\/bind\/(\d+)(?:\/listener\/(\d+)(?:\/(tcp)?route\/(\d+)(?:\/backend\/(\d+))?)?)?/,
  );
  if (!m) return null;
  return {
    port: parseInt(m[1], 10),
    li: m[2] !== undefined ? parseInt(m[2], 10) : undefined,
    isTcpRoute: m[3] === "tcp",
    ri: m[4] !== undefined ? parseInt(m[4], 10) : undefined,
    bi: m[5] !== undefined ? parseInt(m[5], 10) : undefined,
  };
}

function nodeTypeLabel(type: EditTarget["type"], isTcp: boolean): string {
  switch (type) {
    case "bind":
      return "Bind";
    case "listener":
      return "Listener";
    case "route":
      return isTcp ? "TCP Route" : "HTTP Route";
    case "backend":
      return "Backend";
  }
}

// ---------------------------------------------------------------------------
// Exported outlet context type (consumed by NodeDetailPage)
// ---------------------------------------------------------------------------

export interface RoutingOutletContext {
  target: EditTarget | null;
  isEditing: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrafficRoutingPage() {
  const hierarchy = useRoutingHierarchy();
  const { mutate } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();

  // Drawer state (Add operations only)
  const [addTarget, setAddTarget] = useState<EditTarget | null>(null);

  // Edit mode is URL-driven: append ?edit=true to enter, navigate to bare path to exit.
  // This makes it bookmarkable and avoids state-reset race conditions on navigation.
  const isEditing = new URLSearchParams(location.search).get("edit") === "true";

  // ---------------------------------------------------------------------------
  // Resolve the selected resource from URL + hierarchy
  // ---------------------------------------------------------------------------
  const urlParams = useMemo(
    () => parseRoutingPath(location.pathname),
    [location.pathname],
  );

  const target = useMemo((): EditTarget | null => {
    if (!urlParams || hierarchy.isLoading || !hierarchy.binds) return null;
    const { port, li, isTcpRoute, ri, bi } = urlParams;
    const bindNode = hierarchy.binds.find((b) => b.bind.port === port);
    if (!bindNode) return null;

    if (li === undefined) {
      return {
        type: "bind",
        bindPort: port,
        isNew: false,
        schemaCategory: "binds",
        initialData: bindNode.bind as unknown as Record<string, unknown>,
      };
    }
    const listenerNode = bindNode.listeners[li];
    if (!listenerNode) return null;

    if (ri === undefined) {
      return {
        type: "listener",
        bindPort: port,
        listenerIndex: li,
        isNew: false,
        schemaCategory: "listeners",
        initialData: listenerNode.listener as unknown as Record<
          string,
          unknown
        >,
      };
    }
    const routeNode = listenerNode.routes.find(
      (rn) => rn.isTcp === isTcpRoute && rn.categoryIndex === ri,
    );
    if (!routeNode) return null;

    if (bi === undefined) {
      return {
        type: "route",
        bindPort: port,
        listenerIndex: li,
        routeIndex: ri,
        isNew: false,
        schemaCategory: isTcpRoute ? "tcpRoutes" : "routes",
        initialData: routeNode.route as unknown as Record<string, unknown>,
      };
    }
    const backendNode = routeNode.backends[bi];
    if (!backendNode) return null;
    return {
      type: "backend",
      bindPort: port,
      listenerIndex: li,
      routeIndex: ri,
      backendIndex: bi,
      isNew: false,
      schemaCategory: isTcpRoute ? "tcpRouteBackends" : "routeBackends",
      initialData: backendNode.backend,
    };
  }, [urlParams, hierarchy]);

  // ---------------------------------------------------------------------------
  // Breadcrumbs
  // ---------------------------------------------------------------------------
  const breadcrumbs = useMemo((): { title: ReactNode }[] => {
    if (!urlParams || !hierarchy.binds) return [];
    const { port, li, isTcpRoute, ri, bi } = urlParams;
    const bindNode = hierarchy.binds.find((b) => b.bind.port === port);

    const items: { title: ReactNode }[] = [
      { title: <Link to="/traffic/routing">Routing</Link> },
      {
        title:
          li !== undefined ? (
            <Link to={`/traffic/routing/bind/${port}`}>Port {port}</Link>
          ) : (
            `Port ${port}`
          ),
      },
    ];

    if (li !== undefined && bindNode) {
      const ln = bindNode.listeners[li];
      const lnName = ln?.listener.name ?? `Listener ${li}`;
      items.push({
        title:
          ri !== undefined ? (
            <Link to={`/traffic/routing/bind/${port}/listener/${li}`}>
              {lnName}
            </Link>
          ) : (
            lnName
          ),
      });
    }

    if (ri !== undefined && bindNode && li !== undefined) {
      const routeNode = bindNode.listeners[li]?.routes.find(
        (rn) => rn.isTcp === isTcpRoute && rn.categoryIndex === ri,
      );
      const routeName =
        (routeNode?.route.name as string | undefined) ??
        `${isTcpRoute ? "TCP " : ""}Route ${ri}`;
      items.push({
        title:
          bi !== undefined ? (
            <Link
              to={`/traffic/routing/bind/${port}/listener/${li}/${isTcpRoute ? "tcproute" : "route"}/${ri}`}
            >
              {routeName}
            </Link>
          ) : (
            routeName
          ),
      });
    }

    if (bi !== undefined) {
      items.push({ title: `Backend ${bi + 1}` });
    }

    return items;
  }, [urlParams, hierarchy.binds]);

  // ---------------------------------------------------------------------------
  // Page title
  // ---------------------------------------------------------------------------
  const pageTitle = useMemo((): string => {
    if (!target) return "Routing";
    const data = target.initialData;
    switch (target.type) {
      case "bind":
        return `Port ${(data as { port?: number }).port ?? urlParams?.port}`;
      case "listener":
        return (data as { name?: string }).name ?? "Listener";
      case "route":
        return (
          (data as { name?: string }).name ??
          (urlParams?.isTcpRoute ? "TCP Route" : "HTTP Route")
        );
      case "backend": {
        if ("host" in data) return `Host: ${String(data.host ?? "")}`;
        if ("service" in data) {
          const svc = data.service as Record<string, unknown> | undefined;
          return `Service: ${String(svc?.name ?? "")}`;
        }
        return "Backend";
      }
    }
  }, [target, urlParams]);

  // Parent path for post-delete navigation
  const parentPath = useMemo(() => {
    const parts = location.pathname.replace(/\/$/, "").split("/");
    parts.splice(-2);
    return parts.join("/") || "/traffic/routing";
  }, [location.pathname]);

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  const handleAddNode = useCallback((t: EditTarget) => setAddTarget(t), []);
  const handleAddBind = useCallback(() => {
    setAddTarget({
      type: "bind",
      bindPort: 0,
      isNew: true,
      schemaCategory: "binds",
      initialData: { port: 8080, listeners: [], tunnelProtocol: "direct" },
    });
  }, []);

  const handleSaved = useCallback(() => {
    mutate();
    navigate(location.pathname); // removes ?edit=true
  }, [mutate, navigate, location.pathname]);

  const handleDeleted = useCallback(() => {
    mutate();
    navigate(parentPath);
  }, [mutate, navigate, parentPath]);

  // ---------------------------------------------------------------------------
  // Outlet context passed to NodeDetailPage
  // ---------------------------------------------------------------------------
  const outletContext: RoutingOutletContext = useMemo(
    () => ({
      target,
      isEditing,
      onSaved: handleSaved,
      onDeleted: handleDeleted,
    }),
    [target, isEditing, handleSaved, handleDeleted],
  );

  // ---------------------------------------------------------------------------
  // Error / loading states
  // ---------------------------------------------------------------------------
  if (hierarchy.error) {
    return (
      <FullContainer>
        <h1>Routing</h1>
        <StyledAlert
          message="Error Loading Configuration"
          description={hierarchy.error.message ?? "Failed to load config"}
          type="error"
          showIcon
        />
      </FullContainer>
    );
  }

  if (hierarchy.isLoading) {
    return (
      <FullContainer>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
            Loading routing configuration…
          </div>
        </div>
      </FullContainer>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <RoutingHierarchyProvider hierarchy={hierarchy}>
      {urlParams ? (
        /* Split layout with full-width header above the split */
        <SplitRoot>
          <PageHeader>
            <Breadcrumb items={breadcrumbs} />
            <TitleRow>
              <TitleLeft>
                <PageTitle>
                  {isEditing ? `Edit: ${pageTitle}` : pageTitle}
                </PageTitle>
                {target && (
                  <TypeBadge>
                    {nodeTypeLabel(target.type, urlParams.isTcpRoute)}
                  </TypeBadge>
                )}
              </TitleLeft>
              {target &&
                (isEditing ? (
                  <Button
                    icon={<X size={14} />}
                    onClick={() => navigate(location.pathname)}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<Edit2 size={14} />}
                    onClick={() => navigate(location.pathname + "?edit=true")}
                  >
                    Edit
                  </Button>
                ))}
            </TitleRow>
          </PageHeader>

          <SplitBody>
            <Sidebar>
              <HierarchyTree
                hierarchy={hierarchy}
                onEditNode={handleAddNode}
                onAddBind={handleAddBind}
              />
            </Sidebar>
            <DetailPanel>
              <Outlet context={outletContext} />
            </DetailPanel>
          </SplitBody>
        </SplitRoot>
      ) : (
        /* Full-width overview */
        <FullContainer>
          <h1>Routing</h1>
          <RoutingMetrics hierarchy={hierarchy} />
          <HierarchyTree
            hierarchy={hierarchy}
            onEditNode={handleAddNode}
            onAddBind={handleAddBind}
          />
        </FullContainer>
      )}

      {/* Drawer for Add operations only */}
      <NodeEditDrawer
        target={addTarget}
        onClose={() => setAddTarget(null)}
        onSaved={() => {
          mutate();
          setAddTarget(null);
        }}
      />
    </RoutingHierarchyProvider>
  );
}
