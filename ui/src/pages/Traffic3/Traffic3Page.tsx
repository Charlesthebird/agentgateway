import styled from "@emotion/styled";
import { Button, Card, Spin, Statistic } from "antd";
import { CodeOutlined } from "@ant-design/icons";
import { Activity, AlertTriangle, Database, Network } from "lucide-react";
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

const TopMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
`;

const OverviewContent = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const SideMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
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
    border: 1px solid var(--color-border-base);
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
  port: number;
  li?: number;
  isTcpRoute: boolean;
  ri?: number;
  bi?: number;
  policyType?: string;
}

function parseTraffic3Path(pathname: string): UrlParams | null {
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
// Metrics components
// ---------------------------------------------------------------------------

interface MetricsProps {
  hierarchy: ReturnType<typeof useTraffic3Hierarchy>;
}

function TopMetricsRow({ hierarchy }: MetricsProps) {
  const { stats } = hierarchy;

  return (
    <TopMetrics>
      <MetricCard>
        <MetricIcon color="var(--color-primary)">
          <Network size={20} />
        </MetricIcon>
        <Statistic title="Binds" value={stats.totalBinds} suffix="ports" />
      </MetricCard>

      <MetricCard>
        <MetricIcon color="var(--color-success)">
          <Activity size={20} />
        </MetricIcon>
        <Statistic
          title="Listeners"
          value={stats.totalListeners}
          suffix="configured"
        />
      </MetricCard>
    </TopMetrics>
  );
}

function SideMetricsColumn({ hierarchy }: MetricsProps) {
  const { stats } = hierarchy;

  return (
    <SideMetrics>
      <MetricCard>
        <MetricIcon color="var(--color-info)">
          <Database size={20} />
        </MetricIcon>
        <Statistic title="Routes" value={stats.totalRoutes} suffix="active" />
      </MetricCard>

      <MetricCard>
        <MetricIcon
          color={
            stats.totalValidationErrors > 0
              ? "var(--color-warning)"
              : "var(--color-success)"
          }
        >
          <AlertTriangle size={20} />
        </MetricIcon>
        <Statistic
          title="Validation Issues"
          value={stats.totalValidationErrors}
          suffix={stats.totalValidationErrors === 1 ? "issue" : "issues"}
          valueStyle={{
            color:
              stats.totalValidationErrors > 0
                ? "var(--color-warning)"
                : "var(--color-success)",
          }}
        />
      </MetricCard>
    </SideMetrics>
  );
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
  return urlParams ? (
    /* Split layout: tree on left, detail view on right */
    <SplitRoot>
      <SplitBody>
        <Sidebar>
          <HierarchyTree hierarchy={hierarchy} />
        </Sidebar>
        <DetailPanel>
          <NodeDetailView hierarchy={hierarchy} urlParams={urlParams} />
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

      <TopMetricsRow hierarchy={hierarchy} />

      <OverviewContent>
        <HierarchyTree hierarchy={hierarchy} />
        <RightColumn>
          <StyledAlert
            message="Manual TypeScript Schemas"
            description="This page uses manually configured TypeScript form schemas (not auto-generated JSON). Forms are defined in traffic3/forms/ and use config.d.ts types directly for compile-time safety."
            type="info"
            showIcon
            closable
          />
          <SideMetricsColumn hierarchy={hierarchy} />
        </RightColumn>
      </OverviewContent>
    </FullContainer>
  );
}
