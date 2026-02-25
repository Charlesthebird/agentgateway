import styled from "@emotion/styled";
import { Badge, Card, Col, Row, Statistic, Tooltip } from "antd";
import {
  Headphones,
  Network,
  Route,
  Server,
  TriangleAlert,
} from "lucide-react";
import type { RoutingHierarchy } from "../hooks/useRoutingHierarchy";

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
  margin-bottom: 4px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
`;

interface RoutingMetricsProps {
  hierarchy: RoutingHierarchy;
}

export function RoutingMetrics({ hierarchy }: RoutingMetricsProps) {
  const { stats } = hierarchy;

  const metrics = [
    {
      icon: <Network size={16} />,
      label: "Binds (Ports)",
      value: stats.totalBinds,
      suffix: undefined as string | undefined,
      color: undefined as string | undefined,
      tooltip: "Active port bindings",
    },
    {
      icon: <Headphones size={16} />,
      label: "Listeners",
      value: stats.totalListeners,
      suffix: undefined,
      color: undefined,
      tooltip: "Total listeners across all binds",
    },
    {
      icon: <Route size={16} />,
      label: "Routes",
      value: stats.totalRoutes,
      suffix: undefined,
      color: undefined,
      tooltip: "Total HTTP/TCP routes across all listeners",
    },
    {
      icon: <Server size={16} />,
      label: "Named Backends",
      value: stats.totalTopLevelBackends,
      suffix: undefined,
      color: undefined,
      tooltip: "Top-level named backends available for reference",
    },
    {
      icon: <TriangleAlert size={16} />,
      label: "Issues",
      value: stats.totalValidationErrors,
      suffix:
        stats.brokenBackendRefs > 0
          ? `(${stats.brokenBackendRefs} broken refs)`
          : undefined,
      color:
        stats.totalValidationErrors > 0
          ? "var(--color-warning)"
          : "var(--color-success)",
      tooltip:
        stats.totalValidationErrors === 0
          ? "No configuration issues detected"
          : `${stats.totalValidationErrors} validation issue(s), including ${stats.brokenBackendRefs} broken backend reference(s)`,
    },
  ];

  return (
    <Card
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Configuration Overview
          {stats.totalValidationErrors > 0 && (
            <Badge
              count={stats.totalValidationErrors}
              color="var(--color-warning)"
              style={{ marginLeft: 4 }}
            />
          )}
        </span>
      }
    >
      <Row gutter={[16, 16]}>
        {metrics.map((m) => (
          <Col xs={12} sm={8} lg={4} key={m.label}>
            <Tooltip title={m.tooltip}>
              <StatCard hoverable={false}>
                <IconLabel>
                  {m.icon}
                  {m.label}
                </IconLabel>
                <Statistic
                  value={m.value}
                  valueStyle={m.color ? { color: m.color } : undefined}
                  suffix={
                    m.suffix ? (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {m.suffix}
                      </span>
                    ) : undefined
                  }
                  prefix={
                    m.label === "Issues" &&
                    stats.totalValidationErrors === 0 ? (
                      <Badge status="success" />
                    ) : m.label === "Issues" &&
                      stats.totalValidationErrors > 0 ? (
                      <Badge status="warning" />
                    ) : (
                      <Badge status="processing" />
                    )
                  }
                />
              </StatCard>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
