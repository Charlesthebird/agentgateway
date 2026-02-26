import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import type { MenuProps } from "antd";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Empty,
  Modal,
  Space,
  Tooltip,
  Tree,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Headphones,
  MoreVertical,
  Network,
  Pencil,
  PlusCircle,
  Route,
  Server,
  TriangleAlert,
} from "lucide-react";
import type { Key, ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
import { NODE_LABELS, applyDelete, extractErrorMessage } from "./nodeEditUtils";

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
  .ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
    background: var(--color-bg-selected) !important;
  }
`;

/** ⋮ button — always in DOM so column is consistent; fades in on row hover. */
const MoreButton = styled(Button)`
  flex-shrink: 0;
  height: 20px;
  width: 20px;
  min-width: 20px;
  padding: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
`;

/** Single-row layout. MoreButton is revealed on hover OR while its dropdown is open. */
const NodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 2px;
  flex-wrap: nowrap;
  width: 100%;
  cursor: pointer;

  &:hover ${MoreButton},
  &:has(.ant-dropdown-open) ${MoreButton} {
    opacity: 1;
    pointer-events: auto;
  }
`;

/** Primary label: grows to fill space, truncates with ellipsis. */
const NodeLabel = styled.span`
  font-weight: 500;
  color: var(--color-text-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;


// ---------------------------------------------------------------------------
// Node title builders
// ---------------------------------------------------------------------------

/** Shows a Modal.confirm for destructive actions (avoids inline Popconfirm in menus). */
function confirmDelete(title: string, content: string, onOk: () => void) {
  Modal.confirm({
    title,
    content,
    okText: "Delete",
    okButtonProps: { danger: true },
    onOk,
    centered: true,
  });
}

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
  onDelete: (target: EditTarget, parentPath: string) => void,
): ReactNode {
  const bindPath = `/traffic/routing/bind/${bind.bind.port}`;
  const deleteTarget: EditTarget = {
    type: "bind",
    bindPort: bind.bind.port,
    isNew: false,
    schemaCategory: "binds",
    initialData: bind.bind as unknown as Record<string, unknown>,
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        navigate(bindPath + "?edit=true");
      },
    },
    {
      key: "add-listener",
      label: "Add Listener",
      icon: <PlusCircle size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAdd({
          type: "listener",
          bindPort: bind.bind.port,
          isNew: true,
          schemaCategory: "listeners",
          initialData: { routes: null, tcpRoutes: null },
        });
      },
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        confirmDelete(
          `Delete Port ${bind.bind.port}?`,
          "This will remove the bind and all its listeners.",
          () => onDelete(deleteTarget, "/traffic/routing"),
        );
      },
    },
  ];

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(bindPath);
      }}
    >
      <Network
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>Port {bind.bind.port}</NodeLabel>
      {bind.bind.tunnelProtocol && (
        <ProtocolTag protocol={bind.bind.tunnelProtocol} />
      )}
      <ValidationBadges errors={bind.validationErrors} />
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomRight"
        overlayClassName="hierarchy-menu"
      >
        <MoreButton
          type="text"
          size="small"
          icon={<MoreVertical size={14} />}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </NodeRow>
  );
}

function buildListenerTitle(
  ln: ListenerNode,
  onAdd: (target: EditTarget) => void,
  navigate: (path: string) => void,
  onDelete: (target: EditTarget, parentPath: string) => void,
  bindPort: number,
  listenerIndex: number,
): ReactNode {
  const protocol = ln.listener.protocol ?? "HTTP";
  const listenerPath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}`;
  const bindPath = `/traffic/routing/bind/${bindPort}`;

  // Enforce mutual exclusion: routes and tcpRoutes cannot coexist on a listener.
  const hasHttpRoutes = (ln.listener.routes?.length ?? 0) > 0;
  const hasTcpRoutes = (ln.listener.tcpRoutes?.length ?? 0) > 0;
  const canAddHttp = !hasTcpRoutes;
  const canAddTcp = !hasHttpRoutes;

  const hostnameDefaults =
    ln.listener.hostname && ln.listener.hostname !== "*"
      ? [ln.listener.hostname]
      : [];

  const deleteTarget: EditTarget = {
    type: "listener",
    bindPort,
    listenerIndex,
    isNew: false,
    schemaCategory: "listeners",
    initialData: ln.listener as unknown as Record<string, unknown>,
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        navigate(listenerPath + "?edit=true");
      },
    },
    {
      key: "add-http-route",
      label: "Add HTTP Route",
      icon: <PlusCircle size={13} />,
      disabled: !canAddHttp,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
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
      },
    },
    {
      key: "add-tcp-route",
      label: "Add TCP Route",
      icon: <PlusCircle size={13} />,
      disabled: !canAddTcp,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAdd({
          type: "route",
          bindPort,
          listenerIndex,
          isNew: true,
          schemaCategory: "tcpRoutes",
          initialData: { hostnames: hostnameDefaults },
        });
      },
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        confirmDelete(
          `Delete "${ln.listener.name ?? "this listener"}"?`,
          "This will remove the listener and all its routes.",
          () => onDelete(deleteTarget, bindPath),
        );
      },
    },
  ];

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(listenerPath);
      }}
    >
      <Headphones
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{ln.listener.name ?? "(unnamed listener)"}</NodeLabel>
      <ProtocolTag protocol={protocol} />
      <ValidationBadges errors={ln.validationErrors} />
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomRight"
        overlayClassName="hierarchy-menu"
      >
        <MoreButton
          type="text"
          size="small"
          icon={<MoreVertical size={14} />}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
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
  onDelete: (target: EditTarget, parentPath: string) => void,
  bindPort: number,
  listenerIndex: number,
  routeIndex: number,
): ReactNode {
  const { label } = describeBackend(bn.backend);
  const routeSeg = bn.isTcpRoute ? "tcproute" : "route";
  const backendPath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}/backend/${bn.backendIndex}`;
  const routePath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}`;

  const deleteTarget: EditTarget = {
    type: "backend",
    bindPort,
    listenerIndex,
    routeIndex,
    backendIndex: bn.backendIndex,
    isNew: false,
    schemaCategory: bn.isTcpRoute ? "tcpRouteBackends" : "routeBackends",
    initialData: bn.backend as Record<string, unknown>,
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        navigate(backendPath + "?edit=true");
      },
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        confirmDelete("Delete this backend?", "This cannot be undone.", () =>
          onDelete(deleteTarget, routePath),
        );
      },
    },
  ];

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(backendPath);
      }}
    >
      <Server
        size={13}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{label}</NodeLabel>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomRight"
        overlayClassName="hierarchy-menu"
      >
        <MoreButton
          type="text"
          size="small"
          icon={<MoreVertical size={14} />}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </NodeRow>
  );
}

function buildRouteTitle(
  rn: RouteNode,
  onAdd: (target: EditTarget) => void,
  navigate: (path: string) => void,
  onDelete: (target: EditTarget, parentPath: string) => void,
  bindPort: number,
  listenerIndex: number,
): ReactNode {
  const backendSchemaCategory = rn.isTcp ? "tcpRouteBackends" : "routeBackends";
  const routeSeg = rn.isTcp ? "tcproute" : "route";
  const routePath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${rn.categoryIndex}`;
  const listenerPath = `/traffic/routing/bind/${bindPort}/listener/${listenerIndex}`;

  const deleteTarget: EditTarget = {
    type: "route",
    bindPort,
    listenerIndex,
    routeIndex: rn.categoryIndex,
    isNew: false,
    schemaCategory: rn.isTcp ? "tcpRoutes" : "routes",
    initialData: rn.route as unknown as Record<string, unknown>,
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        navigate(routePath + "?edit=true");
      },
    },
    {
      key: "add-backend",
      label: "Add Backend",
      icon: <PlusCircle size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAdd({
          type: "backend",
          bindPort,
          listenerIndex,
          routeIndex: rn.categoryIndex,
          isNew: true,
          schemaCategory: backendSchemaCategory,
          initialData: {},
        });
      },
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        confirmDelete(
          `Delete "${rn.route.name ?? "this route"}"?`,
          "This will remove the route and all its backends.",
          () => onDelete(deleteTarget, listenerPath),
        );
      },
    },
  ];

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(routePath);
      }}
    >
      <Route
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{rn.route.name ?? "(unnamed route)"}</NodeLabel>
      {rn.isTcp && <ProtocolTag protocol="TCP" />}
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
      <Dropdown
        menu={{ items: menuItems }}
        trigger={["click"]}
        placement="bottomRight"
        overlayClassName="hierarchy-menu"
      >
        <MoreButton
          type="text"
          size="small"
          icon={<MoreVertical size={14} />}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
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
  onDelete: (target: EditTarget, parentPath: string) => void,
): DataNode[] {
  return (hierarchy.binds ?? []).map((bindNode) => ({
    key: `bind-${bindNode.bind.port}`,
    icon: null,
    selectable: false,
    title: buildBindTitle(bindNode, onAdd, navigate, onDelete),
    children: (bindNode.listeners ?? []).map((ln, li) => ({
      key: `listener-${bindNode.bind.port}-${li}`,
      icon: null,
      selectable: false,
      title: buildListenerTitle(
        ln,
        onAdd,
        navigate,
        onDelete,
        bindNode.bind.port,
        li,
      ),
      children: (ln.routes ?? []).map((rn) => ({
        key: `route-${bindNode.bind.port}-${li}-${rn.isTcp ? "tcp" : "http"}-${rn.categoryIndex}`,
        icon: null,
        selectable: false,
        title: buildRouteTitle(
          rn,
          onAdd,
          navigate,
          onDelete,
          bindNode.bind.port,
          li,
        ),
        isLeaf: rn.backends.length === 0,
        children: rn.backends.map((bn) => ({
          key: `backend-${bindNode.bind.port}-${li}-${rn.categoryIndex}-${bn.backendIndex}`,
          icon: null,
          selectable: false,
          isLeaf: true,
          title: buildBackendTitle(
            bn,
            navigate,
            onDelete,
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

  const handleDelete = useCallback(
    async (target: EditTarget, parentPath: string) => {
      try {
        await applyDelete(target);
        toast.success(`${NODE_LABELS[target.type]} deleted`);
        // Navigate to parent if the current URL is within the deleted item's path.
        if (
          location.pathname.startsWith(parentPath.replace(/\/$/, "") + "/") ||
          location.pathname === parentPath
        ) {
          navigate(parentPath);
        } else {
          // Still navigate to parent to avoid a stale URL
          navigate(parentPath);
        }
      } catch (e: unknown) {
        toast.error(extractErrorMessage(e) ?? "Failed to delete");
      }
    },
    [navigate, location.pathname],
  );

  const treeData = useMemo(
    () => buildTreeData(hierarchy, onEditNode, navigate, handleDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hierarchy, onEditNode, handleDelete],
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
    <>
    <Global styles={css`
      .hierarchy-menu .ant-dropdown-menu-item {
        transition: background-color 0.12s ease !important;
      }
      .hierarchy-menu .ant-dropdown-menu-item:hover {
        background-color: rgba(128, 128, 128, 0.3) !important;
      }
      .hierarchy-menu .ant-dropdown-menu-item:active {
        background-color: rgba(128, 128, 128, 0.4) !important;
      }
      .hierarchy-menu .ant-dropdown-menu-item-danger:hover {
        background-color: rgba(255, 77, 79, 0.2) !important;
      }
      .hierarchy-menu .ant-dropdown-menu-item-danger:active {
        background-color: rgba(255, 77, 79, 0.22) !important;
      }
    `} />
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
    </>
  );
}
