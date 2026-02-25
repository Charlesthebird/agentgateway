import { PlusOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Badge, Button, Card, Dropdown, Empty, Space, Tag, Tooltip, Tree } from "antd";
import type { DataNode } from "antd/es/tree";
import {
  Edit,
  Headphones,
  Network,
  PlusCircle,
  Route,
  TriangleAlert,
} from "lucide-react";
import type { Key, ReactNode } from "react";
import { useMemo, useState } from "react";
import { ProtocolTag } from "../../../components/ProtocolTag";
import type {
  BindNode,
  ListenerNode,
  RouteNode,
  RoutingHierarchy,
  ValidationError,
} from "../hooks/useRoutingHierarchy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NodeType = "bind" | "listener" | "route";

export interface EditTarget {
  type: NodeType;
  /** Identifies the bind */
  bindPort: number;
  /** Index of the listener within the bind (for listener/route targets) */
  listenerIndex?: number;
  /** Index of the route within the listener (for route targets) */
  routeIndex?: number;
  /** Whether this is a new resource being created */
  isNew: boolean;
  /** The schema category passed to SchemaForm */
  schemaCategory: "listeners" | "routes" | "tcpRoutes" | "backends";
  /** Pre-populated form data */
  initialData: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const TreeCard = styled(Card)`
  .ant-card-body {
    padding: 0;
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
  opacity: 0;
  transition: opacity 0.15s;

  .ant-tree-treenode:hover & {
    opacity: 1;
  }
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
  onEdit: (target: EditTarget) => void,
): ReactNode {
  return (
    <NodeRow>
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
      <Space size="small">
        <AddButton
          type="text"
          size="small"
          icon={<Edit size={12} />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit({
              type: "bind",
              bindPort: bind.bind.port,
              isNew: false,
              schemaCategory: "backends",
              initialData: bind.bind,
            });
          }}
        >
          Edit
        </AddButton>
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
                routes: null, // Explicitly set to null to avoid validation
                tcpRoutes: null,
              },
            });
          }}
        >
          Add Listener
        </AddButton>
      </Space>
    </NodeRow>
  );
}

function buildListenerTitle(
  ln: ListenerNode,
  onAdd: (target: EditTarget) => void,
  onEdit: (target: EditTarget) => void,
  bindPort: number,
  listenerIndex: number,
): ReactNode {
  const protocol = ln.listener.protocol ?? "HTTP";
  const hostname = ln.listener.hostname ?? "*";
  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        onEdit({
          type: "listener",
          bindPort,
          listenerIndex,
          isNew: false,
          schemaCategory: "listeners",
          initialData: ln.listener,
        });
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
        {ln.routes.length} route{ln.routes.length !== 1 ? "s" : ""}
      </NodeMeta>
      <ValidationBadges errors={ln.validationErrors} />
      <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "http",
              label: "HTTP Route",
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation();
                onAdd({
                  type: "route",
                  bindPort,
                  listenerIndex,
                  isNew: true,
                  schemaCategory: "routes",
                  initialData: {
                    hostnames:
                      ln.listener.hostname && ln.listener.hostname !== "*"
                        ? [ln.listener.hostname]
                        : [],
                    matches: [{ path: { pathPrefix: "/" } }],
                  },
                });
              },
            },
            {
              key: "tcp",
              label: "TCP Route",
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation();
                onAdd({
                  type: "route",
                  bindPort,
                  listenerIndex,
                  isNew: true,
                  schemaCategory: "tcpRoutes",
                  initialData: {
                    hostnames:
                      ln.listener.hostname && ln.listener.hostname !== "*"
                        ? [ln.listener.hostname]
                        : [],
                  },
                });
              },
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
    </NodeRow>
  );
}

function buildRouteTitle(
  rn: RouteNode,
  onEdit: (target: EditTarget) => void,
  bindPort: number,
  listenerIndex: number,
  routeIndex: number,
): ReactNode {
  type MatchPathUnion = { exact?: string; pathPrefix?: string; regex?: string };
  const paths = (rn.route.matches ?? [])
    .map((m) => {
      const p = m.path as MatchPathUnion;
      if (p.exact != null) return p.exact;
      if (p.pathPrefix != null) return p.pathPrefix + "*";
      if (p.regex != null) return `~${p.regex}`;
      return null;
    })
    .filter(Boolean) as string[];

  const backendCount = rn.route.backends?.length ?? 0;

  return (
    <NodeRow
      onClick={(e) => {
        e.stopPropagation();
        onEdit({
          type: "route",
          bindPort,
          listenerIndex,
          routeIndex,
          isNew: false,
          schemaCategory: "routes",
          initialData: rn.route,
        });
      }}
      style={{ cursor: "pointer" }}
    >
      <Route
        size={14}
        style={{ color: "var(--color-primary)", flexShrink: 0 }}
      />
      <NodeLabel>{rn.route.name ?? "(unnamed route)"}</NodeLabel>
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
      <NodeMeta>
        {backendCount} backend{backendCount !== 1 ? "s" : ""}
      </NodeMeta>
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
    </NodeRow>
  );
}

// ---------------------------------------------------------------------------
// Tree data builder
// ---------------------------------------------------------------------------

function buildTreeData(
  hierarchy: RoutingHierarchy,
  onAdd: (target: EditTarget) => void,
  onEdit: (target: EditTarget) => void,
): DataNode[] {
  return (hierarchy.binds ?? []).map((bindNode) => ({
    key: `bind-${bindNode.bind.port}`,
    icon: null,
    selectable: false,
    title: buildBindTitle(bindNode, onAdd, onEdit),
    children: (bindNode.listeners ?? []).map((ln, li) => ({
      key: `listener-${bindNode.bind.port}-${li}`,
      icon: null,
      selectable: false,
      title: buildListenerTitle(ln, onAdd, onEdit, bindNode.bind.port, li),
      children: (ln.routes ?? []).map((rn, ri) => ({
        key: `route-${bindNode.bind.port}-${li}-${ri}`,
        icon: null,
        selectable: false,
        title: buildRouteTitle(rn, onEdit, bindNode.bind.port, li, ri),
        isLeaf: true,
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
  const treeData = useMemo(
    () => buildTreeData(hierarchy, onEditNode, onEditNode),
    [hierarchy, onEditNode],
  );

  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const allKeys = useMemo(
    () =>
      (hierarchy.binds ?? []).flatMap((b) => [
        `bind-${b.bind.port}`,
        ...(b.listeners ?? []).map((_, li) => `listener-${b.bind.port}-${li}`),
      ]),
    [hierarchy.binds],
  );

  // Auto-expand all on first load
  useMemo(() => {
    setExpandedKeys(allKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if ((hierarchy.binds ?? []).length === 0) {
    return (
      <TreeCard title="Routing Hierarchy">
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
      title="Routing Hierarchy"
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
          <Button
            size="small"
            type="text"
            onClick={() =>
              setExpandedKeys((k) => (k.length > 0 ? [] : allKeys))
            }
          >
            {expandedKeys.length > 0 ? "Collapse all" : "Expand all"}
          </Button>
        </Space>
      }
    >
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        showIcon={false}
        blockNode
        style={{ padding: "8px 12px" }}
      />
    </TreeCard>
  );
}
