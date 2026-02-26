import styled from "@emotion/styled";
import { Button, Card, Col, Empty, Row, Spin, Statistic, Tag, Timeline, Tooltip } from "antd";
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Headphones,
  Network,
  Route,
  Server,
  Workflow,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRoutingHierarchy } from "./hooks/useRoutingHierarchy";

export { TrafficRoutingPage } from "./TrafficRoutingPage";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
`;

const PageHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
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

const StatCard = styled(Card)`
  .ant-card-body {
    padding: var(--spacing-lg);
  }
  height: 100%;
`;

const IconLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
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
// Traffic Overview
// ---------------------------------------------------------------------------

export const TrafficOverviewPage = () => {
  const navigate = useNavigate();
  const hierarchy = useRoutingHierarchy();

  if (hierarchy.isLoading) {
    return (
      <Container>
        <PageTitle>Traffic Overview</PageTitle>
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" />
        </div>
      </Container>
    );
  }

  const { stats } = hierarchy;

  const statItems = [
    {
      icon: <Network size={18} />,
      label: "Port Binds",
      value: stats.totalBinds,
      color: "var(--color-primary)",
      tooltip: "Active port bindings accepting connections",
    },
    {
      icon: <Headphones size={18} />,
      label: "Listeners",
      value: stats.totalListeners,
      color: "var(--color-primary)",
      tooltip: "Total listeners across all binds",
    },
    {
      icon: <Route size={18} />,
      label: "Routes",
      value: stats.totalRoutes,
      color: "var(--color-primary)",
      tooltip: "Total HTTP and TCP routes",
    },
    {
      icon: <Server size={18} />,
      label: "Named Backends",
      value: stats.totalTopLevelBackends,
      color: "var(--color-primary)",
      tooltip: "Top-level backend definitions",
    },
  ];

  const hasIssues = stats.totalValidationErrors > 0;

  return (
    <Container>
      <PageHeader>
        <div>
          <PageTitle>Traffic Overview</PageTitle>
          <PageSubtitle>
            Summary of your current routing configuration
          </PageSubtitle>
        </div>
        <Button type="primary" onClick={() => navigate("/traffic/routing")}>
          Manage Routing
        </Button>
      </PageHeader>

      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        {statItems.map((item) => (
          <Col xs={12} sm={6} key={item.label}>
            <Tooltip title={item.tooltip}>
              <StatCard hoverable onClick={() => navigate("/traffic/routing")}>
                <IconLabel>
                  {item.icon}
                  {item.label}
                </IconLabel>
                <Statistic value={item.value} valueStyle={{ color: item.color, fontSize: 28 }} />
              </StatCard>
            </Tooltip>
          </Col>
        ))}
      </Row>

      {/* Status Card */}
      <Card
        title="Configuration Health"
        extra={
          hasIssues ? (
            <Tag color="warning" icon={<AlertTriangle size={12} style={{ marginRight: 4 }} />}>
              {stats.totalValidationErrors} issue{stats.totalValidationErrors !== 1 ? "s" : ""}
            </Tag>
          ) : (
            <Tag color="success" icon={<CheckCircle size={12} style={{ marginRight: 4 }} />}>
              Healthy
            </Tag>
          )
        }
      >
        {hierarchy.binds.length === 0 ? (
          <Empty
            description="No routing configuration yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate("/traffic/routing")}>
              Set Up Routing
            </Button>
          </Empty>
        ) : (
          <Timeline
            items={hierarchy.binds.flatMap((bindNode) =>
              bindNode.listeners.map((ln) => {
                const routeCount = ln.routes.length;
                const errors = ln.validationErrors.length;
                return {
                  color: errors > 0 ? "orange" : "green",
                  children: (
                    <span>
                      <strong>Port {bindNode.bind.port}</strong>
                      {" → "}
                      <Tag bordered={false}>
                        {ln.listener.protocol ?? "HTTP"}
                      </Tag>
                      {ln.listener.name && (
                        <span style={{ marginRight: 8 }}>{ln.listener.name}</span>
                      )}
                      <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>
                        {routeCount} route{routeCount !== 1 ? "s" : ""}
                        {errors > 0 && (
                          <Tag color="warning" style={{ marginLeft: 8 }}>
                            {errors} issue{errors !== 1 ? "s" : ""}
                          </Tag>
                        )}
                      </span>
                    </span>
                  ),
                };
              }),
            )}
          />
        )}
      </Card>

      {/* Quick links */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            onClick={() => navigate("/traffic/routing")}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "var(--color-bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary)",
                  flexShrink: 0,
                }}
              >
                <Workflow size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Routing Configuration</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Manage binds, listeners, and routes
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ opacity: 0.65 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "var(--color-bg-hover)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-tertiary)",
                  flexShrink: 0,
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  Logs & Metrics{" "}
                  <Tag bordered={false} style={{ fontSize: 11 }}>
                    Coming soon
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Real-time traffic logs and analytics
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// ---------------------------------------------------------------------------
// Shared empty state for unimplemented pages
// ---------------------------------------------------------------------------

function ComingSoonPage({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Container>
      <PageTitle>{title}</PageTitle>
      <EmptyStateCard>
        <EmptyIcon>{icon}</EmptyIcon>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
          {title}
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
          {description}
        </p>
        <Tag bordered={false} color="processing" style={{ padding: "4px 12px", fontSize: 13 }}>
          Coming soon
        </Tag>
      </EmptyStateCard>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Traffic Logs
// ---------------------------------------------------------------------------

export const TrafficLogsPage = () => (
  <ComingSoonPage
    title="Traffic Logs"
    icon={<FileText size={28} />}
    description="Real-time and historical traffic logs will be displayed here, including request details, response codes, latency, and error traces."
  />
);

// ---------------------------------------------------------------------------
// Traffic Metrics
// ---------------------------------------------------------------------------

export const TrafficMetricsPage = () => (
  <ComingSoonPage
    title="Traffic Metrics"
    icon={<Route size={28} />}
    description="Traffic analytics including request throughput, error rates, latency percentiles, and per-route breakdowns will be available here."
  />
);
