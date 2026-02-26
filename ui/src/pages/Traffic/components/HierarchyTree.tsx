import { PlusOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Empty,
  Space,
  Tag,
  Tooltip,
  Tree,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Headphones,
  Network,
  PlusCircle,
  Route,
  Server,
  TriangleAlert,
} from "lucide-react";
import type { Key, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProtocolTag } from "../../../components/ProtocolTag";
import type {
  BackendNode,
  BindNode,
  ListenerNode,
  RouteNode,
  RoutingHierarchy,
  ValidationError,
} from "../hooks/useRoutingHierarchy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeType = "bind" | "listener" | "route" | "backend";

export interface EditTarget {
  type: NodeType;
  /** Identifies the bind */
  bindPort: number;
  /** Index of the listener within the bind (for listener/route/backend targets) */
  listenerIndex?: number;
  /** Index of the route within the listener (for route/backend targets) */
  routeIndex?: number;
  /** Index of the backend within the route (for backend targets) */
  backendIndex?: number;
  /** Whether this is a new resource being created */
  isNew: boolean;
  /** The schema category passed to SchemaForm */
  schemaCategory:
    | "binds"
    | "listeners"
    | "routes"
    | "tcpRoutes"
    | "routeBackends"
    | "tcpRouteBackends";
  /** Pre-populated form data */
  initialData: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Derives the tree node key for the currently-selected URL path. */
function urlToSelectedKey(pathname: string): string | null {
  // /traffic/routing/bind/:port/listener/:li/(tcp)route/:ri/backend/:bi
  const m = pathname.match(
    /\/traffic\/routing\/bind\/(\d+)(?:\/listener\/(\d+)(?:\/(tcp)?route\/(\d+)(?:\/backend\/(\d+))?)?)?/,
  );
  if (!m) return null;
  const [, port, li, tcp, ri, bi] = m;
  if (bi !== undefined) return `backend-${port}-${li}-${ri}-${bi}`;
  if (ri !== undefined)
    return `route-${port}-${li}-${tcp ? "tcp" : "http"}-${ri}`;
  if (li !== undefined) return `listener-${port}-${li}`;
  if (port !== undefined) return `bind-${port}`;
  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const TreeCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }

  /* Override AntD's selected-node colour so it works in both light and dark mode */
  .ant-tree
    .ant-tree-node-content-wrapper.ant-tree-node-selected {
    background: var(--color-bg-selected) !important;
  }
`;

const NodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 2px 0;
  flex-wrap: wrap;
`;

const NodeLabel = styled.span`
  font-weight: 500;
  color: var(--color-text-base);
`;

const NodeMeta = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
`;

const AddButton = styled(Button)`
  padding: 0 4px;
  height: 20px;
  font-size: 11px;
  line-height: 18px;
`;

// ---------------------------------------------------------------------------
// Node title builders
// ---------------------------------------------------------------------------

function ValidationBadges({ errors }: { errors: ValidationError[] }) {
  if (errors.length === 0) return null;
  const errCount = errors.filter((e) => e.level === "error").length;
  const warnCount = errors.filter((e) => e.level === "warning").length;
  return (
    <Tooltip
      title={errors.map((e) => e.message).join("\n")}
      overlayStyle={{ whiteSpace: "pre-wrap" }}
    >
      {errCount > 0 && (
        <Badge
          count={errCount}
          color="var(--color-error)"
          size="small"
          style={{ marginRight: 2 }}
        />
      )}
      {warnCount > 0 && (
        <Badge count={warnCount} color="var(--color-warning)" size="small" />
      )}
    </Tooltip>
  );
}

function buildBindTitle(
  bind: BindNode,
  onAdd: (target: EditTarget) => void,
  navigate: (path: string) => void,
): ReactNode {
  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/traffic/routing/bind/${bind.bind.port}`);
      }}
      style={{ cursor: "pointer" }}
    >
      <Network
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>Port {bind.bind.port}</NodeLabel>
      {bind.bind.tunnelProtocol && (
        <ProtocolTag protocol={bind.bind.tunnelProtocol} />
      )}
      <NodeMeta>
        {bind.listeners.length} listener{bind.listeners.length !== 1 ? "s" : ""}
      </NodeMeta>
      <ValidationBadges errors={bind.validationErrors} />
      <AddButton
        type="text"
        size="small"
        icon={<PlusCircle size={12} />}
        onClick={(e) => {
          e.stopPropagation();
          onAdd({
            type: "listener",
            bindPort: bind.bind.port,
            isNew: true,
            schemaCategory: "listeners",
            initialData: {
              routes: null,
              tcpRoutes: null,
            },
          });
        }}
      >
        Add Listener
      </AddButton>
    </NodeRow>
  );
}

function buildListenerTitle(
  ln: ListenerNode,
  onAdd: (target: EditTarget) => void,
  navigate: (path: string) => void,
  bindPort: number,
  listenerIndex: number,
): ReactNode {
  const protocol = ln.listener.protocol ?? "HTTP";
  const hostname = ln.listener.hostname ?? "*";
  const listenerPath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}`;

  // Enforce mutual exclusion: routes and tcpRoutes cannot coexist on a listener.
  const hasHttpRoutes = (ln.listener.routes?.length ?? 0) > 0;
  const hasTcpRoutes = (ln.listener.tcpRoutes?.length ?? 0) > 0;
  // If neither type is set yet, allow both; otherwise lock to what's already there.
  const canAddHttp = !hasTcpRoutes;
  const canAddTcp = !hasHttpRoutes;

  const httpRouteCount = ln.listener.routes?.length ?? 0;
  const tcpRouteCount = ln.listener.tcpRoutes?.length ?? 0;
  const totalRoutes = httpRouteCount + tcpRouteCount;

  const hostnameDefaults =
    ln.listener.hostname && ln.listener.hostname !== "*"
      ? [ln.listener.hostname]
      : [];

  const addHttpRoute = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onAdd({
      type: "route",
      bindPort,
      listenerIndex,
      isNew: true,
      schemaCategory: "routes",
      initialData: {
        hostnames: hostnameDefaults,
        matches: [{ path: { pathPrefix: "/" } }],
      },
    });
  };

  const addTcpRoute = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onAdd({
      type: "route",
      bindPort,
      listenerIndex,
      isNew: true,
      schemaCategory: "tcpRoutes",
      initialData: { hostnames: hostnameDefaults },
    });
  };

  // Render add-route control: single button when only one type is allowed,
  // dropdown when both are allowed.
  let addRouteControl: ReactNode;
  if (canAddHttp && canAddTcp) {
    addRouteControl = (
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "http",
              label: "HTTP Route",
              onClick: ({ domEvent }) => addHttpRoute(domEvent),
            },
            {
              key: "tcp",
              label: "TCP Route",
              onClick: ({ domEvent }) => addTcpRoute(domEvent),
            },
          ],
        }}
      >
        <AddButton
          type="text"
          size="small"
          icon={<PlusCircle size={12} />}
          onClick={(e) => e.stopPropagation()}
        >
          Add Route
        </AddButton>
      </Dropdown>
    );
  } else if (canAddHttp) {
    addRouteControl = (
      <AddButton
        type="text"
        size="small"
        icon={<PlusCircle size={12} />}
        onClick={addHttpRoute}
      >
        Add HTTP Route
      </AddButton>
    );
  } else if (canAddTcp) {
    addRouteControl = (
      <AddButton
        type="text"
        size="small"
        icon={<PlusCircle size={12} />}
        onClick={addTcpRoute}
      >
        Add TCP Route
      </AddButton>
    );
  }

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(listenerPath);
      }}
      style={{ cursor: "pointer" }}
    >
      <Headphones
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{ln.listener.name ?? "(unnamed listener)"}</NodeLabel>
      <ProtocolTag protocol={protocol} />
      {hostname !== "*" && (
        <Tag bordered={false} style={{ fontSize: 11 }}>
          {hostname}
        </Tag>
      )}
      <NodeMeta>
        {totalRoutes} route{totalRoutes !== 1 ? "s" : ""}
        {hasTcpRoutes && !hasHttpRoutes && (
          <span style={{ marginLeft: 4, opacity: 0.7 }}>(TCP)</span>
        )}
      </NodeMeta>
      <ValidationBadges errors={ln.validationErrors} />
      {addRouteControl}
    </NodeRow>
  );
}

function describeBackend(backend: Record<string, unknown>): {
  label: string;
  detail: string;
} {
  if ("host" in backend)
    return { label: "Host", detail: String(backend.host ?? "") };
  if ("service" in backend) {
    const svc = backend.service as Record<string, unknown> | undefined;
    return { label: "Service", detail: String(svc?.name ?? "") };
  }
  if ("ai" in backend) {
    const ai = backend.ai as Record<string, unknown> | undefined;
    return { label: "AI", detail: String(ai?.name ?? "") };
  }
  if ("mcp" in backend) {
    const mcp = backend.mcp as Record<string, unknown> | undefined;
    return { label: "MCP", detail: String(mcp?.name ?? "") };
  }
  if ("dynamic" in backend) return { label: "Dynamic", detail: "" };
  if ("backend" in backend)
    return { label: "Ref", detail: String(backend.backend ?? "") };
  return { label: "Backend", detail: "" };
}

function buildBackendTitle(
  bn: BackendNode,
  navigate: (path: string) => void,
  bindPort: number,
  listenerIndex: number,
  routeIndex: number,
): ReactNode {
  const { label, detail } = describeBackend(bn.backend);
  const routeSeg = bn.isTcpRoute ? "tcproute" : "route";
  const backendPath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}/backend/${bn.backendIndex}`;

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(backendPath);
      }}
      style={{ cursor: "pointer" }}
    >
      <Server
        size={13}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{label}</NodeLabel>
      {detail && (
        <NodeMeta style={{ fontFamily: "monospace" }}>{detail}</NodeMeta>
      )}
      {typeof bn.backend.weight === "number" && bn.backend.weight !== 1 && (
        <Tag bordered={false} style={{ fontSize: 11 }}>
          weight {bn.backend.weight}
        </Tag>
      )}
    </NodeRow>
  );
}

function buildRouteTitle(
  rn: RouteNode,
  onAdd: (target: EditTarget) => void,
  navigate: (path: string) => void,
  bindPort: number,
  listenerIndex: number,
): ReactNode {
  type MatchPathUnion = { exact?: string; pathPrefix?: string; regex?: string };
  const httpRoute = rn.isTcp
    ? null
    : (rn.route as { matches?: Array<{ path?: unknown }> });
  const paths = (httpRoute?.matches ?? [])
    .map((m) => {
      const p = m.path as MatchPathUnion;
      if (p?.exact != null) return p.exact;
      if (p?.pathPrefix != null) return p.pathPrefix + "*";
      if (p?.regex != null) return `~${p.regex}`;
      return null;
    })
    .filter(Boolean) as string[];

  const backendSchemaCategory = rn.isTcp ? "tcpRouteBackends" : "routeBackends";
  const routeSeg = rn.isTcp ? "tcproute" : "route";
  const routePath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${rn.categoryIndex}`;

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(routePath);
      }}
      style={{ cursor: "pointer" }}
    >
      <Route
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{rn.route.name ?? "(unnamed route)"}</NodeLabel>
      {rn.isTcp && (
        <Tag bordered={false} color="blue" style={{ fontSize: 11 }}>
          TCP
        </Tag>
      )}
      {paths.slice(0, 2).map((p, i) => (
        <Tag
          key={i}
          bordered={false}
          style={{ fontSize: 11, fontFamily: "monospace" }}
        >
          {p}
        </Tag>
      ))}
      {paths.length > 2 && <NodeMeta>+{paths.length - 2} more</NodeMeta>}
      {rn.validationErrors.length > 0 && (
        <Tooltip
          title={rn.validationErrors.map((e) => e.message).join("\n")}
          overlayStyle={{ whiteSpace: "pre-wrap" }}
        >
          <TriangleAlert
            size={14}
            style={{
              color: rn.validationErrors.some((e) => e.level === "error")
                ? "var(--color-error)"
                : "var(--color-warning)",
              flexShrink: 0,
            }}
          />
        </Tooltip>
      )}
      <AddButton
        type="text"
        size="small"
        icon={<PlusCircle size={12} />}
        onClick={(e) => {
          e.stopPropagation();
          onAdd({
            type: "backend",
            bindPort,
            listenerIndex,
            routeIndex: rn.categoryIndex,
            isNew: true,
            schemaCategory: backendSchemaCategory,
            initialData: {},
          });
        }}
      >
        Add Backend
      </AddButton>
    </NodeRow>
  );
}

// ---------------------------------------------------------------------------
// Tree data builder
// ---------------------------------------------------------------------------

function buildTreeData(
  hierarchy: RoutingHierarchy,
  onAdd: (target: EditTarget) => void,
  navigate: (path: string) => void,
): DataNode[] {
  return (hierarchy.binds ?? []).map((bindNode) => ({
    key: `bind-${bindNode.bind.port}`,
    icon: null,
    selectable: false,
    title: buildBindTitle(bindNode, onAdd, navigate),
    children: (bindNode.listeners ?? []).map((ln, li) => ({
      key: `listener-${bindNode.bind.port}-${li}`,
      icon: null,
      selectable: false,
      title: buildListenerTitle(ln, onAdd, navigate, bindNode.bind.port, li),
      children: (ln.routes ?? []).map((rn) => ({
        key: `route-${bindNode.bind.port}-${li}-${rn.isTcp ? "tcp" : "http"}-${rn.categoryIndex}`,
        icon: null,
        selectable: false,
        title: buildRouteTitle(rn, onAdd, navigate, bindNode.bind.port, li),
        isLeaf: rn.backends.length === 0,
        children: rn.backends.map((bn) => ({
          key: `backend-${bindNode.bind.port}-${li}-${rn.categoryIndex}-${bn.backendIndex}`,
          icon: null,
          selectable: false,
          isLeaf: true,
          title: buildBackendTitle(
            bn,
            navigate,
            bindNode.bind.port,
            li,
            rn.categoryIndex,
          ),
        })),
      })),
    })),
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HierarchyTreeProps {
  hierarchy: RoutingHierarchy;
  onEditNode: (target: EditTarget) => void;
  onAddBind?: () => void;
}

export function HierarchyTree({
  hierarchy,
  onEditNode,
  onAddBind,
}: HierarchyTreeProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const treeData = useMemo(
    () => buildTreeData(hierarchy, onEditNode, navigate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hierarchy, onEditNode],
  );

  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const allKeys = useMemo(
    () =>
      (hierarchy.binds ?? []).flatMap((b) => [
        `bind-${b.bind.port}`,
        ...(b.listeners ?? []).flatMap((ln, li) => [
          `listener-${b.bind.port}-${li}`,
          ...(ln.routes ?? []).map(
            (rn) =>
              `route-${b.bind.port}-${li}-${rn.isTcp ? "tcp" : "http"}-${rn.categoryIndex}`,
          ),
        ]),
      ]),
    [hierarchy.binds],
  );

  // Auto-expand all on first load
  useMemo(() => {
    setExpandedKeys(allKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedKey = useMemo(
    () => urlToSelectedKey(location.pathname),
    [location.pathname],
  );

  if ((hierarchy.binds ?? []).length === 0) {
    return (
      <TreeCard title="Configuration">
        <Empty
          description="No routing configuration yet"
          style={{ padding: "40px 0" }}
        >
          <Button
            type="primary"
            icon={<PlusCircle size={14} />}
            onClick={() =>
              onEditNode({
                type: "listener",
                bindPort: 8080,
                isNew: true,
                schemaCategory: "listeners",
                initialData: {
                  routes: null,
                  tcpRoutes: null,
                },
              })
            }
          >
            Add First Listener
          </Button>
        </Empty>
      </TreeCard>
    );
  }

  return (
    <TreeCard
      title={
        <span
          onClick={() => navigate("/traffic/routing")}
          style={{ cursor: "pointer" }}
          title="Back to Routing overview"
        >
          Configuration
        </span>
      }
      extra={
        <Space size="small">
          {onAddBind && (
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={onAddBind}
            >
              Add Bind
            </Button>
          )}
          <Tooltip
            title={expandedKeys.length > 0 ? "Collapse all" : "Expand all"}
          >
            <Button
              size="small"
              type="text"
              icon={
                expandedKeys.length > 0 ? (
                  <ChevronsDownUp size={14} />
                ) : (
                  <ChevronsUpDown size={14} />
                )
              }
              onClick={() =>
                setExpandedKeys((k) => (k.length > 0 ? [] : allKeys))
              }
            />
          </Tooltip>
        </Space>
      }
    >
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onExpand={(keys) => setExpandedKeys(keys)}
        showIcon={false}
        blockNode
        style={{ padding: "8px 12px" }}
      />
    </TreeCard>
  );
}
