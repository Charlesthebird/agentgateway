import styled from "@emotion/styled";
import { Descriptions, Space, Tag } from "antd";
import type { ReactNode } from "react";
import { ProtocolTag } from "../../../components/ProtocolTag";
import type { EditTarget } from "./HierarchyTree";

// ---------------------------------------------------------------------------
// Generic field renderers
// ---------------------------------------------------------------------------

function camelToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

type MatchPathUnion = { exact?: string; pathPrefix?: string; regex?: string };

function formatPath(path: MatchPathUnion): string {
  if (path.exact != null) return path.exact;
  if (path.pathPrefix != null) return path.pathPrefix + "*";
  if (path.regex != null) return `~${path.regex}`;
  return "(any)";
}

function renderMatches(matches: unknown[]): ReactNode {
  if (matches.length === 0) {
    return <Muted>Any</Muted>;
  }
  const paths = matches
    .map((m) => {
      const match = m as { path?: MatchPathUnion };
      if (!match.path) return "(any path)";
      return formatPath(match.path);
    })
    .filter(Boolean);

  return (
    <Space wrap size={4}>
      {paths.map((p, i) => (
        <Tag key={i} bordered={false} style={{ fontFamily: "monospace", fontSize: 12 }}>
          {p}
        </Tag>
      ))}
    </Space>
  );
}

function renderBackends(backends: unknown[]): ReactNode {
  if (backends.length === 0) return <Muted>None</Muted>;
  return (
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      {backends.map((b, i) => {
        const backend = b as Record<string, unknown>;
        // Named reference
        if (typeof backend["backend"] === "string") {
          return <Tag key={i} bordered={false}>{backend["backend"]}</Tag>;
        }
        // Inline backend — try to get host/port
        const host = (backend["host"] as string) ?? (backend["address"] as string) ?? null;
        const port = backend["port"] ?? null;
        if (host) {
          return (
            <Tag key={i} bordered={false} style={{ fontFamily: "monospace", fontSize: 12 }}>
              {host}{port != null ? `:${port}` : ""}
            </Tag>
          );
        }
        return <Tag key={i} bordered={false}>{`Backend ${i + 1}`}</Tag>;
      })}
    </Space>
  );
}

function renderValue(key: string, value: unknown): ReactNode {
  if (value === null || value === undefined) {
    return <Muted>—</Muted>;
  }
  if (typeof value === "boolean") {
    return value ? (
      <Tag color="success" bordered={false}>Yes</Tag>
    ) : (
      <Tag bordered={false}>No</Tag>
    );
  }
  if (typeof value === "string") {
    if (key === "protocol") {
      return <ProtocolTag protocol={value} />;
    }
    return <span>{value}</span>;
  }
  if (typeof value === "number") {
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <Muted>None</Muted>;

    if (key === "matches") return renderMatches(value);
    if (key === "backends") return renderBackends(value);

    // Simple string/number arrays
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <Space wrap size={4}>
          {value.map((v, i) => (
            <Tag key={i} bordered={false}>{String(v)}</Tag>
          ))}
        </Space>
      );
    }

    // Array of objects — render each item's fields
    return (
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        {value.map((item, i) => {
          const obj = item as Record<string, unknown>;
          const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined);
          // Use "name" as a header if present, otherwise "Item N"
          const header = typeof obj["name"] === "string" ? obj["name"] : `Item ${i + 1}`;
          const bodyEntries = entries.filter(([k]) => k !== "name");
          return (
            <div
              key={i}
              style={{
                borderLeft: "2px solid var(--color-border)",
                paddingLeft: 8,
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{header}</div>
              <Space direction="vertical" size={1}>
                {bodyEntries.map(([k, v]) => (
                  <span key={k} style={{ fontSize: 12 }}>
                    <span style={{ color: "var(--color-text-secondary)", marginRight: 4 }}>
                      {camelToLabel(k)}:
                    </span>
                    {renderValue(k, v)}
                  </span>
                ))}
              </Space>
            </div>
          );
        })}
      </Space>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined,
    );
    if (entries.length === 0) return <Muted>—</Muted>;
    return (
      <Space direction="vertical" size={2}>
        {entries.map(([k, v]) => (
          <span key={k} style={{ fontSize: 12 }}>
            <span style={{ color: "var(--color-text-secondary)", marginRight: 4 }}>
              {camelToLabel(k)}:
            </span>
            {renderValue(k, v)}
          </span>
        ))}
      </Space>
    );
  }
  return <span>{String(value)}</span>;
}

// Keys to skip in the generic renderer (shown specially or not useful in detail view)
const SKIP_KEYS = new Set(["listeners", "routes", "tcpRoutes"]);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const Muted = styled.span`
  color: var(--color-text-tertiary);
`;

const Section = styled.div`
  & + & {
    margin-top: 20px;
  }
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
`;

// ---------------------------------------------------------------------------
// Type-specific detail views
// ---------------------------------------------------------------------------

function BindDetailView({ data }: { data: Record<string, unknown> }) {
  const listenerCount = Array.isArray(data["listeners"])
    ? (data["listeners"] as unknown[]).length
    : 0;

  const items = [
    { key: "port", label: "Port", children: renderValue("port", data["port"]) },
    {
      key: "listeners",
      label: "Listeners",
      children: (
        <span>
          {listenerCount} listener{listenerCount !== 1 ? "s" : ""}
        </span>
      ),
    },
    ...(data["tunnelProtocol"]
      ? [{ key: "tunnelProtocol", label: "Tunnel Protocol", children: renderValue("tunnelProtocol", data["tunnelProtocol"]) }]
      : []),
  ];

  return (
    <Descriptions bordered column={1} size="small" items={items} />
  );
}

function ListenerDetailView({ data }: { data: Record<string, unknown> }) {
  const httpRouteCount = Array.isArray(data["routes"])
    ? (data["routes"] as unknown[]).length
    : 0;
  const tcpRouteCount = Array.isArray(data["tcpRoutes"])
    ? (data["tcpRoutes"] as unknown[]).length
    : 0;
  const totalRoutes = httpRouteCount + tcpRouteCount;

  const items = [
    { key: "name", label: "Name", children: renderValue("name", data["name"]) },
    { key: "protocol", label: "Protocol", children: renderValue("protocol", data["protocol"] ?? "HTTP") },
    ...(data["hostname"]
      ? [{ key: "hostname", label: "Hostname", children: renderValue("hostname", data["hostname"]) }]
      : []),
    {
      key: "routes",
      label: "Routes",
      children: (
        <span>
          {totalRoutes} route{totalRoutes !== 1 ? "s" : ""}
          {tcpRouteCount > 0 && httpRouteCount === 0 && (
            <ProtocolTag protocol="TCP" style={{ marginLeft: 6 }} />
          )}
        </span>
      ),
    },
  ];

  // Add any extra fields not already shown
  const extraEntries = Object.entries(data).filter(
    ([k, v]) =>
      !["name", "protocol", "hostname", "routes", "tcpRoutes"].includes(k) &&
      v !== null &&
      v !== undefined,
  );
  const extraItems = extraEntries.map(([k, v]) => ({
    key: k,
    label: camelToLabel(k),
    children: renderValue(k, v),
  }));

  return <Descriptions bordered column={1} size="small" items={[...items, ...extraItems]} />;
}

function RouteDetailView({
  data,
  isTcp,
}: {
  data: Record<string, unknown>;
  isTcp: boolean;
}) {
  const coreItems = [
    { key: "name", label: "Name", children: renderValue("name", data["name"]) },
    { key: "type", label: "Type", children: <ProtocolTag protocol={isTcp ? "TCP" : "HTTP"} /> },
    ...(data["ruleName"]
      ? [{ key: "ruleName", label: "Rule Name", children: renderValue("ruleName", data["ruleName"]) }]
      : []),
    ...(data["namespace"]
      ? [{ key: "namespace", label: "Namespace", children: renderValue("namespace", data["namespace"]) }]
      : []),
  ];

  const matchesItems =
    !isTcp && Array.isArray(data["matches"])
      ? [{ key: "matches", label: "Path Matches", children: renderMatches(data["matches"] as unknown[]) }]
      : [];

  const backendsItems = Array.isArray(data["backends"])
    ? [{ key: "backends", label: "Backends", children: renderBackends(data["backends"] as unknown[]) }]
    : [];

  // Extra fields
  const knownKeys = new Set(["name", "ruleName", "namespace", "matches", "backends", "hostnames"]);
  const extraItems = Object.entries(data)
    .filter(([k, v]) => !knownKeys.has(k) && v !== null && v !== undefined)
    .map(([k, v]) => ({ key: k, label: camelToLabel(k), children: renderValue(k, v) }));

  const hostnameItems = Array.isArray(data["hostnames"]) && (data["hostnames"] as unknown[]).length > 0
    ? [{ key: "hostnames", label: "Hostnames", children: renderValue("hostnames", data["hostnames"]) }]
    : [];

  return (
    <Descriptions
      bordered
      column={1}
      size="small"
      items={[...coreItems, ...hostnameItems, ...matchesItems, ...backendsItems, ...extraItems]}
    />
  );
}

function BackendDetailView({ data }: { data: Record<string, unknown> }) {
  // Detect which oneOf variant is active
  const variant = (() => {
    if ("host" in data) return "host";
    if ("service" in data) return "service";
    if ("ai" in data) return "ai";
    if ("mcp" in data) return "mcp";
    if ("dynamic" in data) return "dynamic";
    if ("backend" in data) return "ref";
    return "unknown";
  })();

  const labelMap: Record<string, string> = {
    host: "Host",
    service: "Service",
    ai: "AI",
    mcp: "MCP",
    dynamic: "Dynamic",
    ref: "Named Reference",
    unknown: "Unknown",
  };

  const coreItems = [
    { key: "type", label: "Type", children: <Tag bordered={false}>{labelMap[variant]}</Tag> },
    ...(typeof data["weight"] === "number"
      ? [{ key: "weight", label: "Weight", children: <span>{data["weight"]}</span> }]
      : []),
  ];

  const variantItems = (() => {
    if (variant === "host") {
      return [{ key: "host", label: "Host:Port", children: <span style={{ fontFamily: "monospace" }}>{String(data["host"])}</span> }];
    }
    if (variant === "service") {
      const svc = data["service"] as Record<string, unknown> | undefined;
      return [
        { key: "svc-name", label: "Service Name", children: <span style={{ fontFamily: "monospace" }}>{String(svc?.["name"] ?? "")}</span> },
        { key: "svc-port", label: "Port", children: <span>{String(svc?.["port"] ?? "")}</span> },
      ];
    }
    if (variant === "ai") {
      const ai = data["ai"] as Record<string, unknown> | undefined;
      return Object.entries(ai ?? {})
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => ({ key: `ai-${k}`, label: camelToLabel(k), children: renderValue(k, v) }));
    }
    if (variant === "mcp") {
      const mcp = data["mcp"] as Record<string, unknown> | undefined;
      return Object.entries(mcp ?? {})
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => ({ key: `mcp-${k}`, label: camelToLabel(k), children: renderValue(k, v) }));
    }
    if (variant === "ref") {
      return [{ key: "backend", label: "Backend Name", children: <span style={{ fontFamily: "monospace" }}>{String(data["backend"])}</span> }];
    }
    return [];
  })();

  return <Descriptions bordered column={1} size="small" items={[...coreItems, ...variantItems]} />;
}

// Generic fallback
function GenericDetailView({ data }: { data: Record<string, unknown> }) {
  const items = Object.entries(data)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && v !== null && v !== undefined)
    .map(([k, v]) => ({
      key: k,
      label: camelToLabel(k),
      children: renderValue(k, v),
    }));

  if (items.length === 0) {
    return <Muted>No details available.</Muted>;
  }

  return <Descriptions bordered column={1} size="small" items={items} />;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface NodeDetailViewProps {
  target: EditTarget;
}

export function NodeDetailView({ target }: NodeDetailViewProps) {
  const data = target.initialData;

  if (target.type === "bind") {
    return (
      <Section>
        <SectionTitle>Bind details</SectionTitle>
        <BindDetailView data={data} />
      </Section>
    );
  }

  if (target.type === "listener") {
    return (
      <Section>
        <SectionTitle>Listener details</SectionTitle>
        <ListenerDetailView data={data} />
      </Section>
    );
  }

  if (target.type === "route") {
    const isTcp = target.schemaCategory === "tcpRoutes";
    return (
      <Section>
        <SectionTitle>{isTcp ? "TCP Route" : "HTTP Route"} details</SectionTitle>
        <RouteDetailView data={data} isTcp={isTcp} />
      </Section>
    );
  }

  if (target.type === "backend") {
    const isTcp = target.schemaCategory === "tcpRouteBackends";
    return (
      <Section>
        <SectionTitle>{isTcp ? "TCP" : "HTTP"} Backend details</SectionTitle>
        <BackendDetailView data={data} />
      </Section>
    );
  }

  return <GenericDetailView data={data} />;
}
