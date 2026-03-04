import { DeleteOutlined, DownOutlined, PlusOutlined } from "@ant-design/icons";
import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import type { MenuProps } from "antd";
import {
  App,
  Badge,
  Button,
  Card,
  Dropdown,
  Empty,
  Space,
  Tooltip,
  Tree,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  Bot,
  ChevronsDownUp,
  ChevronsUpDown,
  Headphones,
  MoreVertical,
  Network,
  Pencil,
  Route,
  Server,
  Settings,
  TriangleAlert,
} from "lucide-react";
import type { Key, ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useConfig } from "../../../api";
import { ProtocolTag } from "../../../components/ProtocolTag";
import type { LocalRouteBackend } from "../../../config";
import type {
  BackendNode,
  BindNode,
  ListenerNode,
  RouteNode,
  PolicyNode,
  Traffic3Hierarchy,
  ValidationError,
} from "../hooks/useTraffic3Hierarchy";
import * as api from "../../../api/crud";
import { TopLevelDrawer } from "./TopLevelDrawer";
import type { TopLevelEditTarget } from "./TopLevelEditForm";
import { forms } from "../forms";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeType = "bind" | "listener" | "route" | "backend";

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

const NodeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 2px;
  flex-wrap: nowrap;
  width: 100%;
  cursor: pointer;
`;

const NodeLabel = styled.span`
  font-weight: 500;
  color: var(--color-text-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

const MoreButton = styled(Button)`
  opacity: 0;
  transition: opacity 0.15s;
  margin-left: auto;
  flex-shrink: 0;

  .ant-tree-treenode:hover & {
    opacity: 1;
  }
`;

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function urlToSelectedKey(pathname: string): string | null {
  const m = pathname.match(
    /\/traffic3\/bind\/(\d+)(?:\/listener\/(\d+)(?:\/(tcp)?route\/(\d+)(?:\/backend\/(\d+)|\/policy\/([^/?]+))?)?)?/,
  );
  if (!m) return null;
  const [, port, li, tcp, ri, bi, policyType] = m;
  if (policyType !== undefined) return `policy-${port}-${li}-${ri}-${policyType}`;
  if (bi !== undefined) return `backend-${port}-${li}-${ri}-${bi}`;
  if (ri !== undefined)
    return `route-${port}-${li}-${tcp ? "tcp" : "http"}-${ri}`;
  if (li !== undefined) return `listener-${port}-${li}`;
  if (port !== undefined) return `bind-${port}`;
  return null;
}

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
      styles={{ root: { whiteSpace: "pre-wrap" } }}
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

type ConfirmDeleteFn = (
  title: string,
  description: string,
  onConfirm: () => void,
) => void;

function buildBindTitle(
  bind: BindNode,
  navigate: (path: string) => void,
  onDelete: (port: number, parentPath: string) => void,
  confirmDelete: ConfirmDeleteFn,
  onAddListener: (port: number) => void,
): ReactNode {
  const bindPath = `/traffic3/bind/${bind.bind.port}`;

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
      key: "addListener",
      label: "Add Listener",
      icon: <PlusOutlined />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAddListener(bind.bind.port);
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
          () => onDelete(bind.bind.port, "/traffic3"),
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
  navigate: (path: string) => void,
  onDelete: (port: number, li: number, parentPath: string) => void,
  bindPort: number,
  listenerIndex: number,
  confirmDelete: ConfirmDeleteFn,
  onAddRoute: (port: number, li: number, isTcp: boolean) => void,
): ReactNode {
  const protocol = ln.listener.protocol ?? "HTTP";
  const listenerPath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}`;
  const bindPath = `/traffic3/bind/${bindPort}`;
  const isTcp = protocol === "TCP" || protocol === "TLS";

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
      key: "addRoute",
      label: isTcp ? "Add TCP Route" : "Add Route",
      icon: <PlusOutlined />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAddRoute(bindPort, listenerIndex, isTcp);
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
          `Delete listener "${ln.listener.name ?? "unnamed"}"?`,
          "This will remove the listener and all its routes.",
          () => onDelete(bindPort, listenerIndex, bindPath),
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

function buildPolicyTitle(
  pn: PolicyNode,
  navigate: (path: string) => void,
  onDelete: (
    port: number,
    li: number,
    ri: number,
    isTcp: boolean,
    policyType: string,
    parentPath: string,
  ) => void,
  bindPort: number,
  listenerIndex: number,
  routeIndex: number,
  confirmDelete: ConfirmDeleteFn,
): ReactNode {
  const routeSeg = pn.isTcpRoute ? "tcproute" : "route";
  const policyPath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}/policy/${pn.policyType}`;
  const routePath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}`;

  // Format policy type for display (camelCase to Title Case)
  const displayName = pn.policyType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        navigate(policyPath + "?edit=true");
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
          `Delete ${displayName} policy?`,
          "This cannot be undone.",
          () =>
            onDelete(
              bindPort,
              listenerIndex,
              routeIndex,
              pn.isTcpRoute,
              pn.policyType,
              routePath,
            ),
        );
      },
    },
  ];

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        navigate(policyPath);
      }}
    >
      <Settings
        size={13}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{displayName}</NodeLabel>
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

function describeBackend(backend: LocalRouteBackend | unknown): {
  label: string;
  detail: string;
} {
  if (typeof backend === "string") {
    return { label: "Ref", detail: backend };
  }

  const b = backend as Record<string, unknown>;
  if ("service" in b) {
    const svc = b.service as Record<string, unknown> | undefined;
    return { label: "Service", detail: String(svc?.name ?? "") };
  }
  if ("host" in b) {
    return { label: "Host", detail: String(b.host ?? "") };
  }
  if ("mcp" in b) {
    return { label: "MCP", detail: "" };
  }
  if ("ai" in b) {
    return { label: "AI", detail: "" };
  }

  return { label: "Backend", detail: "" };
}

function buildBackendTitle(
  bn: BackendNode,
  navigate: (path: string) => void,
  onDelete: (
    port: number,
    li: number,
    ri: number,
    bi: number,
    isTcp: boolean,
    parentPath: string,
  ) => void,
  bindPort: number,
  listenerIndex: number,
  routeIndex: number,
  confirmDelete: ConfirmDeleteFn,
): ReactNode {
  const { label } = describeBackend(bn.backend);
  const routeSeg = bn.isTcpRoute ? "tcproute" : "route";
  const backendPath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}/backend/${bn.backendIndex}`;
  const routePath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${routeIndex}`;

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
        confirmDelete(
          `Delete backend ${bn.backendIndex + 1}?`,
          "This cannot be undone.",
          () =>
            onDelete(
              bindPort,
              listenerIndex,
              routeIndex,
              bn.backendIndex,
              bn.isTcpRoute,
              routePath,
            ),
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
  navigate: (path: string) => void,
  onDelete: (
    port: number,
    li: number,
    ri: number,
    isTcp: boolean,
    parentPath: string,
  ) => void,
  bindPort: number,
  listenerIndex: number,
  confirmDelete: ConfirmDeleteFn,
  onAddRouteBackend: (port: number, li: number, ri: number, isTcp: boolean) => void,
  onAddRoutePolicy: (port: number, li: number, ri: number, isTcp: boolean, policyType: string) => void,
): ReactNode {
  const routeSeg = rn.isTcp ? "tcproute" : "route";
  const routePath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}/${routeSeg}/${rn.categoryIndex}`;
  const listenerPath = `/traffic3/bind/${bindPort}/listener/${listenerIndex}`;

  // Check which policy types already exist
  const existingPolicyTypes = new Set(rn.policies.map(p => p.policyType));
  const hasCors = existingPolicyTypes.has('cors');
  const hasRequestHeaderModifier = existingPolicyTypes.has('requestHeaderModifier');
  const hasResponseHeaderModifier = existingPolicyTypes.has('responseHeaderModifier');

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
      key: "addBackend",
      label: "Add Backend",
      icon: <PlusOutlined />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onAddRouteBackend(bindPort, listenerIndex, rn.categoryIndex, rn.isTcp);
      },
    },
    {
      key: "addCors",
      label: hasCors ? "CORS policy already exists" : "Add CORS Policy",
      icon: <PlusOutlined />,
      disabled: hasCors,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        if (!hasCors) {
          onAddRoutePolicy(bindPort, listenerIndex, rn.categoryIndex, rn.isTcp, 'cors');
        }
      },
    },
    {
      key: "addRequestHeaderModifier",
      label: hasRequestHeaderModifier ? "Request Header Modifier already exists" : "Add Request Header Modifier",
      icon: <PlusOutlined />,
      disabled: hasRequestHeaderModifier,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        if (!hasRequestHeaderModifier) {
          onAddRoutePolicy(bindPort, listenerIndex, rn.categoryIndex, rn.isTcp, 'requestHeaderModifier');
        }
      },
    },
    {
      key: "addResponseHeaderModifier",
      label: hasResponseHeaderModifier ? "Response Header Modifier already exists" : "Add Response Header Modifier",
      icon: <PlusOutlined />,
      disabled: hasResponseHeaderModifier,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        if (!hasResponseHeaderModifier) {
          onAddRoutePolicy(bindPort, listenerIndex, rn.categoryIndex, rn.isTcp, 'responseHeaderModifier');
        }
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
          `Delete route "${rn.route.name ?? "unnamed"}"?`,
          "This will remove the route and all its backends.",
          () =>
            onDelete(
              bindPort,
              listenerIndex,
              rn.categoryIndex,
              rn.isTcp,
              listenerPath,
            ),
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
          styles={{ root: { whiteSpace: "pre-wrap" } }}
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
// Top-level item builders
// ---------------------------------------------------------------------------

function buildTopLevelItemTitle(
  label: string,
  icon: ReactNode,
  exists: boolean,
  onEdit: () => void,
  onDelete: () => void,
  confirmDelete: ConfirmDeleteFn,
): ReactNode {
  const menuItems: MenuProps["items"] = [
    {
      key: "edit",
      label: "Edit",
      icon: <Pencil size={13} />,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        onEdit();
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
        confirmDelete(`Delete ${label}?`, "This cannot be undone.", onDelete);
      },
    },
  ];

  return (
    <NodeRow onClick={(e) => e.stopPropagation()}>
      {icon}
      <NodeLabel>{label}</NodeLabel>
      {exists && (
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
      )}
    </NodeRow>
  );
}

// ---------------------------------------------------------------------------
// Tree data builder
// ---------------------------------------------------------------------------

function buildTreeData(
  hierarchy: Traffic3Hierarchy,
  navigate: (path: string) => void,
  onDeleteBind: (port: number, parentPath: string) => void,
  onDeleteListener: (port: number, li: number, parentPath: string) => void,
  onDeleteRoute: (
    port: number,
    li: number,
    ri: number,
    isTcp: boolean,
    parentPath: string,
  ) => void,
  onDeleteBackend: (
    port: number,
    li: number,
    ri: number,
    bi: number,
    isTcp: boolean,
    parentPath: string,
  ) => void,
  onDeleteRoutePolicy: (
    port: number,
    li: number,
    ri: number,
    isTcp: boolean,
    policyType: string,
    parentPath: string,
  ) => void,
  confirmDelete: ConfirmDeleteFn,
  onAddListener: (port: number) => void,
  onAddRoute: (port: number, li: number, isTcp: boolean) => void,
  onAddRouteBackend: (port: number, li: number, ri: number, isTcp: boolean) => void,
  onAddRoutePolicy: (port: number, li: number, ri: number, isTcp: boolean, policyType: string) => void,
  onEditLLM: () => void,
  onDeleteLLM: () => void,
  onEditMCP: () => void,
  onDeleteMCP: () => void,
  onEditFrontendPolicies: () => void,
  onDeleteFrontendPolicies: () => void,
): DataNode[] {
  const nodes: DataNode[] = [];

  // Add top-level config items
  if (hierarchy.llm) {
    nodes.push({
      key: "llm",
      title: buildTopLevelItemTitle(
        "LLM Configuration",
        <Bot size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />,
        true,
        onEditLLM,
        onDeleteLLM,
        confirmDelete,
      ),
      selectable: false,
    });
  }

  if (hierarchy.mcp) {
    nodes.push({
      key: "mcp",
      title: buildTopLevelItemTitle(
        "MCP Configuration",
        <Headphones size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />,
        true,
        onEditMCP,
        onDeleteMCP,
        confirmDelete,
      ),
      selectable: false,
    });
  }

  if (hierarchy.frontendPolicies) {
    nodes.push({
      key: "frontendPolicies",
      title: buildTopLevelItemTitle(
        "Frontend Policies",
        <Settings size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />,
        true,
        onEditFrontendPolicies,
        onDeleteFrontendPolicies,
        confirmDelete,
      ),
      selectable: false,
    });
  }

  // Add binds
  const bindNodes = hierarchy.binds.map((bind) => ({
    key: `bind-${bind.bind.port}`,
    title: buildBindTitle(bind, navigate, onDeleteBind, confirmDelete, onAddListener),
    selectable: true,
    children: bind.listeners.map((listener, li) => ({
      key: `listener-${bind.bind.port}-${li}`,
      title: buildListenerTitle(
        listener,
        navigate,
        onDeleteListener,
        bind.bind.port,
        li,
        confirmDelete,
        onAddRoute,
      ),
      selectable: true,
      children: listener.routes.map((route) => {
        const children: DataNode[] = [];

        // Add backends
        route.backends.forEach((backend) => {
          children.push({
            key: `backend-${bind.bind.port}-${li}-${route.categoryIndex}-${backend.backendIndex}`,
            title: buildBackendTitle(
              backend,
              navigate,
              onDeleteBackend,
              bind.bind.port,
              li,
              route.categoryIndex,
              confirmDelete,
            ),
            selectable: true,
          });
        });

        // Add policies if they exist
        route.policies.forEach((policy) => {
          children.push({
            key: `policy-${bind.bind.port}-${li}-${route.categoryIndex}-${policy.policyType}`,
            title: buildPolicyTitle(
              policy,
              navigate,
              onDeleteRoutePolicy,
              bind.bind.port,
              li,
              route.categoryIndex,
              confirmDelete,
            ),
            selectable: true,
          });
        });

        return {
          key: `route-${bind.bind.port}-${li}-${route.isTcp ? "tcp" : "http"}-${route.categoryIndex}`,
          title: buildRouteTitle(
            route,
            navigate,
            onDeleteRoute,
            bind.bind.port,
            li,
            confirmDelete,
            onAddRouteBackend,
            onAddRoutePolicy,
          ),
          selectable: true,
          children,
        };
      }),
    })),
  }));

  return [...nodes, ...bindNodes];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HierarchyTreeProps {
  hierarchy: Traffic3Hierarchy;
}

export function HierarchyTree({ hierarchy }: HierarchyTreeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { modal } = App.useApp();
  const { mutate } = useConfig();
  const [drawerTarget, setDrawerTarget] = useState<TopLevelEditTarget | null>(null);

  // Define confirmDelete first
  const confirmDelete = useCallback<ConfirmDeleteFn>(
    (title, description, onConfirm) => {
      modal.confirm({
        title,
        content: description,
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: onConfirm,
      });
    },
    [modal],
  );

  const handleDeleteBind = useCallback(
    async (port: number, parentPath: string) => {
      try {
        await api.removeBind(port);
        toast.success(`Port ${port} deleted`);
        mutate();
        navigate(parentPath);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to delete bind");
      }
    },
    [mutate, navigate],
  );

  const handleDeleteListener = useCallback(
    async (port: number, li: number, parentPath: string) => {
      try {
        await api.removeListenerByIndex(port, li);
        toast.success("Listener deleted");
        mutate();
        navigate(parentPath);
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to delete listener",
        );
      }
    },
    [mutate, navigate],
  );

  const handleDeleteRoute = useCallback(
    async (
      port: number,
      li: number,
      ri: number,
      isTcp: boolean,
      parentPath: string,
    ) => {
      try {
        if (isTcp) {
          await api.removeTCPRouteByIndex(port, li, ri);
        } else {
          await api.removeRouteByIndex(port, li, ri);
        }
        toast.success("Route deleted");
        mutate();
        navigate(parentPath);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to delete route");
      }
    },
    [mutate, navigate],
  );

  const handleDeleteBackend = useCallback(
    async (
      port: number,
      li: number,
      ri: number,
      bi: number,
      isTcp: boolean,
      parentPath: string,
    ) => {
      try {
        if (isTcp) {
          await api.removeTCPRouteBackendByIndex(port, li, ri, bi);
        } else {
          await api.removeRouteBackendByIndex(port, li, ri, bi);
        }
        toast.success("Backend deleted");
        mutate();
        navigate(parentPath);
      } catch (e: unknown) {
        toast.error(
          e instanceof Error ? e.message : "Failed to delete backend",
        );
      }
    },
    [mutate, navigate],
  );

  // Handler for adding a new listener to a bind
  const handleAddListener = useCallback(async (port: number) => {
    try {
      const newListener = {
        name: "listener",
        protocol: "HTTP" as const,
        hostname: "*",
        routes: [],
      };
      await api.createListener(port, newListener);
      toast.success("Listener created successfully");

      // Wait for config to refresh and get the updated data
      const freshConfig = await mutate();

      // Find the index of the newly created listener from fresh data
      const bind = freshConfig?.binds?.find((b: any) => b.port === port);
      const listenerIndex = bind ? bind.listeners.length - 1 : 0;
      navigate(`/traffic3/bind/${port}/listener/${listenerIndex}?edit=true`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create listener");
    }
  }, [mutate, navigate]);

  // Handler for adding a new route to a listener
  const handleAddRoute = useCallback(async (port: number, li: number, isTcp: boolean) => {
    try {
      // Get the current listener to determine the route count
      const bind = hierarchy.binds.find((b) => b.bind.port === port);
      if (!bind) {
        throw new Error(`Bind with port ${port} not found`);
      }

      const listener = bind.bind.listeners[li];
      if (!listener) {
        throw new Error(`Listener at index ${li} not found`);
      }

      const newRoute = {
        name: "route",
        hostnames: [],
        matches: [{ path: { pathPrefix: "/" } }],
        backends: [],
      };

      // Manually add the route to the correct array
      const updatedListener = { ...listener };
      if (isTcp) {
        if (!updatedListener.tcpRoutes) {
          updatedListener.tcpRoutes = [];
        }
        updatedListener.tcpRoutes.push(newRoute as any);
      } else {
        if (!updatedListener.routes) {
          updatedListener.routes = [];
        }
        updatedListener.routes.push(newRoute as any);
      }

      // Update the listener
      await api.updateListenerByIndex(port, li, updatedListener);

      toast.success(isTcp ? "TCP route created successfully" : "Route created successfully");

      // Wait for config to refresh and get the updated data
      const freshConfig = await mutate();

      // Find the index from fresh data
      const freshBind = freshConfig?.binds?.find((b: any) => b.port === port);
      const freshListener = freshBind?.listeners?.[li];
      const routeIndex = isTcp
        ? (freshListener?.tcpRoutes?.length ?? 1) - 1
        : (freshListener?.routes?.length ?? 1) - 1;
      const routeSeg = isTcp ? "tcproute" : "route";
      navigate(`/traffic3/bind/${port}/listener/${li}/${routeSeg}/${routeIndex}?edit=true`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create route");
    }
  }, [hierarchy.binds, mutate, navigate]);

  // Handler for adding a new backend to a route
  const handleAddRouteBackend = useCallback(async (port: number, li: number, ri: number, isTcp: boolean) => {
    try {
      // Get the current route
      const bind = hierarchy.binds.find((b) => b.bind.port === port);
      if (!bind) {
        throw new Error(`Bind with port ${port} not found`);
      }

      const listener = bind.bind.listeners[li];
      if (!listener) {
        throw new Error(`Listener at index ${li} not found`);
      }

      const route = isTcp
        ? listener.tcpRoutes?.[ri]
        : listener.routes?.[ri];

      if (!route) {
        throw new Error(`Route at index ${ri} not found`);
      }

      // Create new backend WITHOUT backendType - that's a UI-only field
      // The backend needs the actual backend type field (service, host, etc.)
      const newBackend = {
        service: {
          name: {
            namespace: "default",
            hostname: "service",
          },
          port: 8080,
        },
        weight: 1,
      };

      // Add backend to route
      const updatedRoute = { ...route };
      if (!updatedRoute.backends) {
        updatedRoute.backends = [];
      }

      // Clean all existing backends by applying backend transform
      // This removes UI-only fields like backendType and invalid fields like tls on service backends
      const cleanedBackends = (updatedRoute.backends || []).map((backend: any) => {
        // Import the transform function from backendForm
        const { transformBeforeSubmit } = forms.backend;
        return transformBeforeSubmit ? transformBeforeSubmit(backend) : backend;
      });

      // Add the new backend to the cleaned list
      cleanedBackends.push(newBackend);
      updatedRoute.backends = cleanedBackends as any;

      // Update the route
      if (isTcp) {
        await api.updateTCPRouteByIndex(port, li, ri, updatedRoute as any);
      } else {
        await api.updateRouteByIndex(port, li, ri, updatedRoute as any);
      }

      toast.success("Backend created successfully");

      // Wait for config to refresh and get the updated data
      const freshConfig = await mutate();

      // Find the index from fresh data
      const freshBind = freshConfig?.binds?.find((b: any) => b.port === port);
      const freshListener = freshBind?.listeners?.[li];
      const freshRoute = isTcp
        ? freshListener?.tcpRoutes?.[ri]
        : freshListener?.routes?.[ri];
      const backendIndex = (freshRoute?.backends?.length ?? 1) - 1;
      const routeSeg = isTcp ? "tcproute" : "route";
      navigate(`/traffic3/bind/${port}/listener/${li}/${routeSeg}/${ri}/backend/${backendIndex}?edit=true`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create backend");
    }
  }, [hierarchy.binds, mutate, navigate]);

  // Handler for adding a specific policy type to a route
  const handleAddRoutePolicy = useCallback(async (port: number, li: number, ri: number, isTcp: boolean, policyType: string) => {
    try {
      // Get the current route
      const bind = hierarchy.binds.find((b) => b.bind.port === port);
      if (!bind) {
        throw new Error(`Bind with port ${port} not found`);
      }

      const listener = bind.bind.listeners[li];
      if (!listener) {
        throw new Error(`Listener at index ${li} not found`);
      }

      const route = isTcp
        ? listener.tcpRoutes?.[ri]
        : listener.routes?.[ri];

      if (!route) {
        throw new Error(`Route at index ${ri} not found`);
      }

      // Get existing policies object or create new one
      const currentPolicies = (route.policies && typeof route.policies === 'object') ? route.policies : {};

      // Create a minimal policy config for the specific type
      const newPolicyConfig = {};

      // Update the route with the new policy type
      const updatedRoute = {
        ...route,
        policies: {
          ...currentPolicies,
          [policyType]: newPolicyConfig,
        }
      };

      // Update the route
      if (isTcp) {
        await api.updateTCPRouteByIndex(port, li, ri, updatedRoute as any);
      } else {
        await api.updateRouteByIndex(port, li, ri, updatedRoute as any);
      }

      // Format policy type for display
      const displayName = policyType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      toast.success(`${displayName} policy created successfully`);

      // Wait for config to refresh
      await mutate();

      // Navigate to the policy edit page
      const routeSeg = isTcp ? "tcproute" : "route";
      navigate(`/traffic3/bind/${port}/listener/${li}/${routeSeg}/${ri}/policy/${policyType}?edit=true`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create policy");
    }
  }, [hierarchy.binds, mutate, navigate]);

  // Handler for deleting a specific policy type from a route
  const handleDeleteRoutePolicy = useCallback(async (port: number, li: number, ri: number, isTcp: boolean, policyType: string, parentPath: string) => {
    try {
      // Get the current route
      const bind = hierarchy.binds.find((b) => b.bind.port === port);
      if (!bind) {
        throw new Error(`Bind with port ${port} not found`);
      }

      const listener = bind.bind.listeners[li];
      if (!listener) {
        throw new Error(`Listener at index ${li} not found`);
      }

      const route = isTcp
        ? listener.tcpRoutes?.[ri]
        : listener.routes?.[ri];

      if (!route) {
        throw new Error(`Route at index ${ri} not found`);
      }

      // Get existing policies
      const currentPolicies = (route.policies && typeof route.policies === 'object') ? route.policies : {};

      // Remove the specific policy type
      const { [policyType]: removed, ...remainingPolicies } = currentPolicies as Record<string, unknown>;

      // Update the route with remaining policies (or null if none left)
      const updatedRoute = {
        ...route,
        policies: Object.keys(remainingPolicies).length > 0 ? remainingPolicies : null,
      };

      // Update the route
      if (isTcp) {
        await api.updateTCPRouteByIndex(port, li, ri, updatedRoute as any);
      } else {
        await api.updateRouteByIndex(port, li, ri, updatedRoute as any);
      }

      // Format policy type for display
      const displayName = policyType
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      toast.success(`${displayName} policy deleted`);
      mutate();
      navigate(parentPath);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete policy");
    }
  }, [hierarchy.binds, mutate, navigate]);

  // Handlers for editing top-level items
  const handleEditLLM = useCallback(() => {
    setDrawerTarget({ type: "llm", initialData: hierarchy.llm as Record<string, unknown> });
  }, [hierarchy.llm]);

  const handleEditMCP = useCallback(() => {
    setDrawerTarget({ type: "mcp", initialData: hierarchy.mcp as Record<string, unknown> });
  }, [hierarchy.mcp]);

  const handleEditFrontendPolicies = useCallback(() => {
    setDrawerTarget({ type: "frontendPolicies", initialData: hierarchy.frontendPolicies as Record<string, unknown> });
  }, [hierarchy.frontendPolicies]);

  // Handlers for deleting top-level items
  const handleDeleteLLM = useCallback(async () => {
    try {
      await api.deleteLLM();
      toast.success("LLM configuration deleted");
      mutate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete LLM config");
    }
  }, [mutate]);

  const handleDeleteMCP = useCallback(async () => {
    try {
      await api.deleteMCP();
      toast.success("MCP configuration deleted");
      mutate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete MCP config");
    }
  }, [mutate]);

  const handleDeleteFrontendPolicies = useCallback(async () => {
    try {
      await api.deleteFrontendPolicies();
      toast.success("Frontend policies deleted");
      mutate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete frontend policies");
    }
  }, [mutate]);

  // Helper to collect all keys from tree data
  const getAllKeys = useCallback((nodes: DataNode[]): Key[] => {
    const keys: Key[] = [];
    const collectKeys = (nodes: DataNode[]) => {
      for (const node of nodes) {
        keys.push(node.key);
        if (node.children) collectKeys(node.children);
      }
    };
    collectKeys(nodes);
    return keys;
  }, []);

  // Build tree data after all handlers are defined
  const treeData = useMemo(
    () =>
      buildTreeData(
        hierarchy,
        navigate,
        handleDeleteBind,
        handleDeleteListener,
        handleDeleteRoute,
        handleDeleteBackend,
        handleDeleteRoutePolicy,
        confirmDelete,
        handleAddListener,
        handleAddRoute,
        handleAddRouteBackend,
        handleAddRoutePolicy,
        handleEditLLM,
        handleDeleteLLM,
        handleEditMCP,
        handleDeleteMCP,
        handleEditFrontendPolicies,
        handleDeleteFrontendPolicies,
      ),
    [
      hierarchy,
      navigate,
      handleDeleteBind,
      handleDeleteListener,
      handleDeleteRoute,
      handleDeleteBackend,
      handleDeleteRoutePolicy,
      confirmDelete,
      handleAddListener,
      handleAddRoute,
      handleAddRouteBackend,
      handleAddRoutePolicy,
      handleEditLLM,
      handleDeleteLLM,
      handleEditMCP,
      handleDeleteMCP,
      handleEditFrontendPolicies,
      handleDeleteFrontendPolicies,
    ],
  );

  // Initialize with all keys expanded
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(() => getAllKeys(treeData));

  const selectedKeys = useMemo(
    () => {
      const key = urlToSelectedKey(location.pathname);
      return key ? [key] : [];
    },
    [location.pathname],
  );

  const handleExpandAll = useCallback(() => {
    setExpandedKeys(getAllKeys(treeData));
  }, [treeData, getAllKeys]);

  const handleCollapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  // Handler for adding a new bind
  const handleAddBind = useCallback(async () => {
    try {
      const newPort = Math.max(...hierarchy.binds.map((b) => b.bind.port), 8079) + 1;
      const newBind = {
        port: newPort,
        tunnelProtocol: "direct" as const,
        listeners: [],
      };
      await api.createBind(newBind);
      toast.success("Bind created successfully");
      mutate();
      navigate(`/traffic3/bind/${newPort}?edit=true`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create bind");
    }
  }, [hierarchy.binds, mutate, navigate]);

  // Handlers for opening drawers to create top-level items
  const handleAddLLM = useCallback(() => {
    setDrawerTarget({ type: "llm" });
  }, []);

  const handleAddMCP = useCallback(() => {
    setDrawerTarget({ type: "mcp" });
  }, []);

  const handleAddFrontendPolicies = useCallback(() => {
    setDrawerTarget({ type: "frontendPolicies" });
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerTarget(null);
  }, []);

  const handleDrawerSaved = useCallback(() => {
    mutate();
  }, [mutate]);

  // Dropdown menu items for adding top-level resources
  const addMenuItems: MenuProps["items"] = [
    {
      key: "bind",
      label: "Bind",
      icon: <Network size={14} />,
      onClick: handleAddBind,
    },
    {
      type: "divider",
    },
    {
      key: "llm",
      label: "LLM Config",
      icon: <Bot size={14} />,
      onClick: handleAddLLM,
    },
    {
      key: "mcp",
      label: "MCP Config",
      icon: <Headphones size={14} />,
      onClick: handleAddMCP,
    },
    {
      key: "frontendPolicies",
      label: "Frontend Policies",
      icon: <Settings size={14} />,
      onClick: handleAddFrontendPolicies,
    },
  ];

  if (hierarchy.binds.length === 0) {
    return (
      <TreeCard>
        <Empty
          description="No binds configured"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBind}>
            Add First Bind
          </Button>
        </Empty>
      </TreeCard>
    );
  }

  return (
    <>
      <Global
        styles={css`
          .hierarchy-menu {
            .ant-dropdown-menu {
              min-width: 160px;
            }
          }
        `}
      />
      <TreeCard
        title="Traffic Hierarchy"
        extra={
          <Space size="small">
            <Dropdown menu={{ items: addMenuItems }} trigger={["click"]}>
              <Button type="primary" size="small" icon={<PlusOutlined />}>
                Add <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              type="text"
              size="small"
              icon={
                expandedKeys.length > 0 ? (
                  <ChevronsDownUp size={16} />
                ) : (
                  <ChevronsUpDown size={16} />
                )
              }
              onClick={
                expandedKeys.length > 0 ? handleCollapseAll : handleExpandAll
              }
            >
              {expandedKeys.length > 0 ? "Collapse All" : "Expand All"}
            </Button>
          </Space>
        }
      >
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          selectedKeys={selectedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          blockNode
          showLine={false}
          showIcon={false}
        />
      </TreeCard>
      <TopLevelDrawer
        target={drawerTarget}
        onClose={handleDrawerClose}
        onSaved={handleDrawerSaved}
      />
    </>
  );
}
