import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import styled from "@emotion/styled";
import { Badge, Card, Col, Progress, Row, Spin, Statistic, Tag } from "antd";
import {
    Activity,
    Brain,
    Headphones,
    Network,
    Route,
    Server,
    Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBackends, useConfig, useListeners, usePolicies, useRoutes } from "../../api";
import { StyledAlert } from "../../components/StyledAlert";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

const StatCard = styled(Card)`
  .ant-card-body {
    padding: var(--spacing-lg);
  }
`;

const QuickActionCard = styled(Card)`
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
  height: 100%;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .ant-card-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    text-align: center;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-hover);
  color: var(--color-primary);
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border-secondary);

  &:last-child {
    border-bottom: none;
  }
`;

export const DashboardPage = () => {
  const navigate = useNavigate();

  // Fetch real data from API
  const { error: configError, isLoading: configLoading } = useConfig();
  const { data: listeners, isLoading: listenersLoading } = useListeners();
  const { data: routes, isLoading: routesLoading } = useRoutes();
  const { data: backends, isLoading: backendsLoading } = useBackends();
  const { data: policies, isLoading: policiesLoading } = usePolicies();

  const isLoading = configLoading || listenersLoading || routesLoading || backendsLoading || policiesLoading;

  // Calculate statistics from real data
  const stats = {
    listeners: { total: listeners.length, active: listeners.length },
    routes: { total: routes.length, active: routes.length },
    backends: { total: backends.length, healthy: backends.length, unhealthy: 0 },
    policies: { total: policies.length, enabled: policies.length },
    requests: { total: 0, change: 0 }, // These would come from metrics API
    latency: { avg: 0, change: 0 }, // These would come from metrics API
    errors: { count: 0, rate: 0 }, // These would come from metrics API
    uptime: 0, // This would come from metrics API
  };

  const recentActivity = [
    {
      type: "success",
      message: "Backend 'openai-prod' health check passed",
      time: "2 minutes ago",
    },
    {
      type: "warning",
      message: "Rate limit reached for policy 'api-throttle'",
      time: "5 minutes ago",
    },
    {
      type: "info",
      message: "New route '/api/v2/chat' created",
      time: "12 minutes ago",
    },
    {
      type: "success",
      message: "Configuration reload completed successfully",
      time: "18 minutes ago",
    },
    {
      type: "error",
      message: "Backend 'mcp-server-2' health check failed",
      time: "25 minutes ago",
    },
  ];

  const quickActions = [
    {
      icon: <Headphones size={24} />,
      title: "Listeners",
      description: "Configure network listeners",
      path: "/listeners",
    },
    {
      icon: <Route size={24} />,
      title: "Routes",
      description: "Manage routing rules",
      path: "/routes",
    },
    {
      icon: <Server size={24} />,
      title: "Backends",
      description: "Configure backend services",
      path: "/backends",
    },
    {
      icon: <Shield size={24} />,
      title: "Policies",
      description: "Set up security policies",
      path: "/policies",
    },
    {
      icon: <Brain size={24} />,
      title: "LLM",
      description: "Manage LLM models",
      path: "/llm",
    },
    {
      icon: <Network size={24} />,
      title: "MCP",
      description: "Model Context Protocol",
      path: "/mcp",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "error":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      case "warning":
        return <WarningOutlined style={{ color: "#faad14" }} />;
      default:
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
    }
  };

  if (configError) {
    return (
      <Container>
        <StyledAlert
          message="Error Loading Configuration"
          description={configError.message || "Failed to load configuration"}
          type="error"
          showIcon
        />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>Loading dashboard...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h1>Dashboard</h1>

      {/* System Health */}
      <Card title="System Health">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard>
              <Statistic
                title="Total Requests"
                value={stats.requests.total}
                prefix={<Activity size={20} />}
                suffix={
                  <Tag
                    color={stats.requests.change > 0 ? "green" : "red"}
                    icon={
                      stats.requests.change > 0 ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )
                    }
                  >
                    {Math.abs(stats.requests.change)}%
                  </Tag>
                }
              />
            </StatCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard>
              <Statistic
                title="Avg Latency"
                value={stats.latency.avg}
                suffix="ms"
                valueStyle={{
                  color: stats.latency.change < 0 ? "#3f8600" : "#cf1322",
                }}
                prefix={
                  stats.latency.change < 0 ? (
                    <ArrowDownOutlined />
                  ) : (
                    <ArrowUpOutlined />
                  )
                }
              />
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>
                {Math.abs(stats.latency.change)}% vs last hour
              </div>
            </StatCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard>
              <Statistic
                title="Error Rate"
                value={stats.errors.rate}
                suffix="%"
                valueStyle={{
                  color: stats.errors.rate > 1 ? "#cf1322" : "#3f8600",
                }}
              />
              <div style={{ fontSize: "12px", color: "#999", marginTop: 4 }}>
                {stats.errors.count} errors in last hour
              </div>
            </StatCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard>
              <Statistic title="Uptime" value={stats.uptime} suffix="%" />
              <Progress
                percent={stats.uptime}
                showInfo={false}
                strokeColor="#52c41a"
                style={{ marginTop: 8 }}
              />
            </StatCard>
          </Col>
        </Row>
      </Card>

      {/* Configuration Overview */}
      <Card title="Configuration Overview">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Listeners"
              value={stats.listeners.active}
              suffix={`/ ${stats.listeners.total}`}
              prefix={<Badge status="success" />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Routes"
              value={stats.routes.active}
              suffix={`/ ${stats.routes.total}`}
              prefix={<Badge status="success" />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Backends"
              value={stats.backends.healthy}
              suffix={`/ ${stats.backends.total}`}
              prefix={
                <Badge
                  status={stats.backends.unhealthy > 0 ? "warning" : "success"}
                />
              }
              valueStyle={{
                color: stats.backends.unhealthy > 0 ? "#faad14" : "#3f8600",
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Policies"
              value={stats.policies.enabled}
              suffix={`/ ${stats.policies.total}`}
              prefix={<Badge status="success" />}
            />
          </Col>
        </Row>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={12} sm={8} lg={4} key={action.path}>
              <QuickActionCard onClick={() => navigate(action.path)}>
                <IconWrapper>{action.icon}</IconWrapper>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {action.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    {action.description}
                  </div>
                </div>
              </QuickActionCard>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        {recentActivity.map((activity, index) => (
          <ActivityItem key={index}>
            {getActivityIcon(activity.type)}
            <div style={{ flex: 1 }}>
              <div>{activity.message}</div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {activity.time}
              </div>
            </div>
          </ActivityItem>
        ))}
      </Card>
    </Container>
  );
};
