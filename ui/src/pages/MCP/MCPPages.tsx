import styled from "@emotion/styled";
import { Button, Card, Input, Select, Spin, Tag, Typography } from "antd";
import { BarChart3, FileText, Send, Server } from "lucide-react";
import { useState } from "react";
import { useMCPConfig } from "../../api";
import type { LocalMcpTarget } from "../../api/types";

const { TextArea } = Input;
const { Text } = Typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
`;

const PageSubtitle = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
`;

const EmptyStateCard = styled(Card)`
  text-align: center;
  .ant-card-body {
    padding: 64px 32px;
  }
`;

const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--color-bg-hover);
  color: var(--color-text-tertiary);
  margin: 0 auto 16px;
`;

// ---------------------------------------------------------------------------
// MCP Logs
// ---------------------------------------------------------------------------

export const MCPLogsPage = () => (
  <Container>
    <PageTitle>MCP Logs</PageTitle>
    <EmptyStateCard>
      <EmptyIcon>
        <FileText size={28} />
      </EmptyIcon>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
        MCP Request Logs
      </h3>
      <p
        style={{
          margin: "0 0 24px",
          color: "var(--color-text-secondary)",
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        MCP tool call logs, request and response details, latency, and error
        traces will be displayed here.
      </p>
      <Tag bordered={false} color="processing" style={{ padding: "4px 12px", fontSize: 13 }}>
        Coming soon
      </Tag>
    </EmptyStateCard>
  </Container>
);

// ---------------------------------------------------------------------------
// MCP Metrics
// ---------------------------------------------------------------------------

export const MCPMetricsPage = () => (
  <Container>
    <PageTitle>MCP Metrics</PageTitle>
    <EmptyStateCard>
      <EmptyIcon>
        <BarChart3 size={28} />
      </EmptyIcon>
      <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
        MCP Performance Metrics
      </h3>
      <p
        style={{
          margin: "0 0 24px",
          color: "var(--color-text-secondary)",
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Tool call counts, latency distributions, error rates, and per-target
        analytics will be available here.
      </p>
      <Tag bordered={false} color="processing" style={{ padding: "4px 12px", fontSize: 13 }}>
        Coming soon
      </Tag>
    </EmptyStateCard>
  </Container>
);

// ---------------------------------------------------------------------------
// MCP Playground
// ---------------------------------------------------------------------------

function getTargetType(target: LocalMcpTarget): string {
  const t = target as Record<string, unknown>;
  if (t["sse"]) return "SSE";
  if (t["mcp"]) return "MCP";
  if (t["stdio"]) return "STDIO";
  if (t["openapi"]) return "OpenAPI";
  return "Unknown";
}

const TYPE_COLORS: Record<string, string> = {
  SSE: "cyan",
  MCP: "blue",
  STDIO: "purple",
  OpenAPI: "geekblue",
};

const PlaygroundLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OutputBox = styled.div`
  background: var(--color-bg-layout);
  border: 1px solid var(--color-border-secondary);
  border-radius: 8px;
  padding: 12px;
  min-height: 200px;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text-base);
`;

interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export const MCPPlaygroundPage = () => {
  const { data: mcp, isLoading } = useMCPConfig();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [method, setMethod] = useState("tools/list");
  const [paramsJson, setParamsJson] = useState("");
  const [history, setHistory] = useState<MCPRequest[]>([]);
  const [sending, setSending] = useState(false);

  const targets = mcp?.targets ?? [];

  const handleSend = async () => {
    if (!selectedTarget || !method.trim()) return;

    let params: Record<string, unknown> | undefined;
    if (paramsJson.trim()) {
      try {
        params = JSON.parse(paramsJson);
      } catch {
        setHistory((prev) => [
          ...prev,
          { method, params: undefined, error: "Invalid JSON in params" },
        ]);
        return;
      }
    }

    setSending(true);
    const req: MCPRequest = { method, params };
    setHistory((prev) => [...prev, req]);

    await new Promise((r) => setTimeout(r, 600));

    setHistory((prev) => {
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.result =
        "MCP Playground requires a live MCP server connection. This is a UI preview — connect a real MCP target to execute tool calls.";
      updated[updated.length - 1] = last;
      return updated;
    });
    setSending(false);
  };

  if (isLoading) {
    return (
      <Container>
        <PageTitle>MCP Playground</PageTitle>
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div>
        <PageTitle>MCP Playground</PageTitle>
        <PageSubtitle>Test MCP server tool calls interactively</PageSubtitle>
      </div>

      <PlaygroundLayout>
        {/* Settings */}
        <Card title="Settings" size="small">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Target
              </div>
              {targets.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  No MCP targets configured.{" "}
                  <a href="/mcp/servers">Add targets</a> to get started.
                </div>
              ) : (
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select a target"
                  value={selectedTarget}
                  onChange={setSelectedTarget}
                  options={targets.map((t) => ({
                    label: (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Tag
                          color={TYPE_COLORS[getTargetType(t)] ?? "default"}
                          style={{ fontSize: 10, marginRight: 0 }}
                        >
                          {getTargetType(t)}
                        </Tag>
                        {t.name}
                      </span>
                    ),
                    value: t.name,
                  }))}
                />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Method
              </div>
              <Select
                style={{ width: "100%" }}
                value={method}
                onChange={setMethod}
                options={[
                  { label: "tools/list", value: "tools/list" },
                  { label: "tools/call", value: "tools/call" },
                  { label: "resources/list", value: "resources/list" },
                  { label: "resources/read", value: "resources/read" },
                  { label: "prompts/list", value: "prompts/list" },
                  { label: "prompts/get", value: "prompts/get" },
                  { label: "initialize", value: "initialize" },
                ]}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Params (JSON)
              </div>
              <TextArea
                placeholder='{"name": "tool_name"}'
                value={paramsJson}
                onChange={(e) => setParamsJson(e.target.value)}
                autoSize={{ minRows: 3, maxRows: 8 }}
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
            </div>

            <Button
              type="primary"
              icon={<Send size={14} />}
              onClick={handleSend}
              loading={sending}
              disabled={!selectedTarget || !method.trim()}
              block
            >
              Send
            </Button>

            <Button
              size="small"
              onClick={() => setHistory([])}
              disabled={history.length === 0}
            >
              Clear History
            </Button>
          </div>
        </Card>

        {/* Output */}
        <Card
          title={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Server size={16} />
              Output
            </span>
          }
        >
          {history.length === 0 && !sending ? (
            <div
              style={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-tertiary)",
                fontSize: 14,
              }}
            >
              {targets.length === 0
                ? "Configure MCP targets to start"
                : selectedTarget
                  ? "Click Send to execute a request"
                  : "Select a target to begin"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((req, idx) => (
                <div key={idx}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    → {req.method}
                  </Text>
                  {req.params && (
                    <OutputBox style={{ marginTop: 4, minHeight: "auto", opacity: 0.7 }}>
                      {JSON.stringify(req.params, null, 2)}
                    </OutputBox>
                  )}
                  {req.result !== undefined && (
                    <OutputBox style={{ marginTop: 4 }}>
                      {typeof req.result === "string"
                        ? req.result
                        : JSON.stringify(req.result, null, 2)}
                    </OutputBox>
                  )}
                  {req.error && (
                    <OutputBox
                      style={{
                        marginTop: 4,
                        borderColor: "var(--color-error)",
                        color: "var(--color-error)",
                      }}
                    >
                      Error: {req.error}
                    </OutputBox>
                  )}
                </div>
              ))}
              {sending && (
                <div style={{ textAlign: "center", padding: 16 }}>
                  <Spin size="small" />
                </div>
              )}
            </div>
          )}
        </Card>
      </PlaygroundLayout>
    </Container>
  );
};
