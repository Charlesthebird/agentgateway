import styled from "@emotion/styled";
import { Button, Card, Spin, Statistic } from "antd";
import { CodeOutlined } from "@ant-design/icons";
import { AlertTriangle, CheckCircle, Headphones, Network, Route } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StyledAlert } from "../../components/StyledAlert";
import { HierarchyTree } from "./components/HierarchyTree";
import { NodeDetailView } from "./components/NodeDetailView";
import { useTraffic3Hierarchy } from "./hooks/useTraffic3Hierarchy";

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

const MetricsHeader = styled.div`
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-layout);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const AllMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
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

const PlaceholderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--spacing-xl);
`;

const PlaceholderContent = styled.div`
  text-align: center;
  max-width: 400px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-base);
    margin-bottom: var(--spacing-md);
  }

  p {
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }
`;

const OverviewContent = styled.div`
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-base);
`;

const Description = styled.p`
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 14px;
`;

const MetricCard = styled(Card)`
  &.ant-card {
    background: var(--color-bg-container);
    border: 1px solid var(--color-border);
  }

  .ant-card-body {
    padding: var(--spacing-lg);
  }
`;

const MetricIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props) => props.color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  color: ${(props) => props.color};
`;

// ---------------------------------------------------------------------------
// URL parsing — extract hierarchy position from the current pathname
// ---------------------------------------------------------------------------

export interface UrlParams {
  port?: number;
  li?: number;
  isTcpRoute?: boolean;
  ri?: number;
  bi?: number;
  policyType?: string;
  topLevelType?: "llm" | "mcp" | "frontendPolicies";
  modelIndex?: number;
}

function parseTraffic3Path(pathname: string): UrlParams | null {
  // Check for model routes first (must be before general LLM route)
  const modelMatch = pathname.match(/\/traffic3\/llm\/model\/(\d+)/);
  if (modelMatch) {
    return {
      topLevelType: "llm",
      modelIndex: parseInt(modelMatch[1], 10),
    };
  }

  // Check for top-level config routes
  const topLevelMatch = pathname.match(/\/traffic3\/(llm|mcp|frontendPolicies)/);
  if (topLevelMatch) {
    return {
      topLevelType: topLevelMatch[1] as "llm" | "mcp" | "frontendPolicies",
    };
  }

  // Check for bind routes
  const m = pathname.match(
    /\/traffic3\/bind\/(\d+)(?:\/listener\/(\d+)(?:\/(tcp)?route\/(\d+)(?:\/backend\/(\d+)|\/policy\/([^/?]+))?)?)?/,
  );
  if (!m) return null;

  const bi = m[5] !== undefined ? parseInt(m[5], 10) : undefined;
  const policyType = m[6]; // Policy type like 'cors', 'requestHeaderModifier', etc.

  return {
    port: parseInt(m[1], 10),
    li: m[2] !== undefined ? parseInt(m[2], 10) : undefined,
    isTcpRoute: m[3] === "tcp",
    ri: m[4] !== undefined ? parseInt(m[4], 10) : undefined,
    bi,
    policyType,
  };
}


// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Traffic3Page() {
  const hierarchy = useTraffic3Hierarchy();
  const location = useLocation();
  const navigate = useNavigate();

  // Parse URL to determine if we're viewing a specific node
  const urlParams = useMemo(
    () => parseTraffic3Path(location.pathname),
    [location.pathname],
  );

  // ---------------------------------------------------------------------------
  // Error / loading states
  // ---------------------------------------------------------------------------
  if (hierarchy.error) {
    return (
      <FullContainer>
        <PageHeader>
          <div>
            <PageTitle>Traffic Configuration (Manual Schemas)</PageTitle>
            <Description>
              Manage your gateway routing with manually configured TypeScript
              schemas
            </Description>
          </div>
        </PageHeader>
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
            Loading traffic configuration…
          </div>
        </div>
      </FullContainer>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Determine if we should show a detail view or placeholder
  // Show detail if we have a bind (port) or any sub-resource selected
  const shouldShowDetail = urlParams !== null;

  const alertContent = (
    <StyledAlert
      message="Manual TypeScript Schemas"
      description="This page uses manually configured TypeScript form schemas (not auto-generated JSON). Forms are defined in traffic3/forms/ and use config.d.ts types directly for compile-time safety."
      type="info"
      showIcon
      closable
    />
  );

  const metricsCards = (
    <AllMetrics>
      <MetricCard>
        <MetricIcon color="var(--color-primary)">
          <Network size={20} />
        </MetricIcon>
        <Statistic title="Binds" value={hierarchy.stats.totalBinds} suffix="ports" />
      </MetricCard>

      <MetricCard>
        <MetricIcon color="var(--color-success)">
          <Headphones size={20} />
        </MetricIcon>
        <Statistic
          title="Listeners"
          value={hierarchy.stats.totalListeners}
          suffix="configured"
        />
      </MetricCard>

      <MetricCard>
        <MetricIcon color="var(--color-info)">
          <Route size={20} />
        </MetricIcon>
        <Statistic title="Routes" value={hierarchy.stats.totalRoutes} suffix="active" />
      </MetricCard>

      <MetricCard>
        <MetricIcon
          color={
            hierarchy.stats.totalValidationErrors > 0
              ? "var(--color-warning)"
              : "var(--color-success)"
          }
        >
          {hierarchy.stats.totalValidationErrors > 0 ? (
            <AlertTriangle size={20} />
          ) : (
            <CheckCircle size={20} />
          )}
        </MetricIcon>
        <Statistic
          title="Validation Issues"
          value={hierarchy.stats.totalValidationErrors}
          suffix={hierarchy.stats.totalValidationErrors === 1 ? "issue" : "issues"}
          valueStyle={{
            color:
              hierarchy.stats.totalValidationErrors > 0
                ? "var(--color-warning)"
                : "var(--color-success)",
          }}
        />
      </MetricCard>
    </AllMetrics>
  );

  return urlParams ? (
    /* Split layout: tree on left, detail/placeholder on right */
    <SplitRoot>
      <MetricsHeader>
        {alertContent}
      </MetricsHeader>
      <SplitBody>
        <Sidebar>
          <HierarchyTree hierarchy={hierarchy} />
        </Sidebar>
        <DetailPanel>
          {shouldShowDetail ? (
            <NodeDetailView hierarchy={hierarchy} urlParams={urlParams} />
          ) : (
            <PlaceholderContainer>
              <PlaceholderContent>
                <h3>Select an Item</h3>
                <p>
                  Choose a listener, route, backend, or policy from the hierarchy tree on the left to view and edit its configuration.
                </p>
              </PlaceholderContent>
            </PlaceholderContainer>
          )}
        </DetailPanel>
      </SplitBody>
    </SplitRoot>
  ) : (
    /* Full-width overview */
    <FullContainer>
      <PageHeader>
        <div>
          <PageTitle>Traffic Configuration (Manual Schemas)</PageTitle>
          <Description>
            Manage your gateway routing with manually configured TypeScript
            schemas
          </Description>
        </div>
        <Button
          icon={<CodeOutlined />}
          onClick={() => navigate("/traffic3/raw-config")}
        >
          Edit Raw Config
        </Button>
      </PageHeader>

      {alertContent}
      {metricsCards}

      <OverviewContent>
        <HierarchyTree hierarchy={hierarchy} />
        <PlaceholderContainer>
          <PlaceholderContent>
            <h3>Select an Item</h3>
            <p>
              Choose a bind, listener, route, backend, or policy from the hierarchy tree on the left to view and edit its configuration.
            </p>
          </PlaceholderContent>
        </PlaceholderContainer>
      </OverviewContent>
    </FullContainer>
  );
}
