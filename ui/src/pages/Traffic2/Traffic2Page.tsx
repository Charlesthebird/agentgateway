import { CodeOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import { Button, Card, Space, Table, Tabs } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { StyledAlert } from "../../components/StyledAlert";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useConfig } from "../../api/hooks";
import { resourceLabels, resourceTypes, type ResourceType } from "./forms";
import * as api from "../../api";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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

export function Traffic2Page() {
  const [activeTab, setActiveTab] = useState<ResourceType>("listener");
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { data: config, mutate, isLoading } = useConfig();

  const [listeners, setListeners] = useState<api.ListenerWithPort[]>([]);
  const [routes, setRoutes] = useState<api.RouteWithContext[]>([]);
  const [backends, setBackends] = useState<api.BackendWithContext[]>([]);
  const [policies, setPolicies] = useState<api.PolicyWithContext[]>([]);

  // Load data when config changes
  useEffect(() => {
    loadData();
  }, [config]);

  async function loadData() {
    try {
      const [listenersData, routesData, backendsData, policiesData] = await Promise.all([
        api.getListeners(),
        api.getRoutes(),
        api.getBackends(),
        api.getPolicies(),
      ]);
      setListeners(listenersData);
      setRoutes(routesData);
      setBackends(backendsData);
      setPolicies(policiesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  const handleCreate = () => {
    if (activeTab === "listener") {
      // For listeners, navigate directly to the create page (port is in the form)
      navigate(`/traffic2/listener/create`);
    } else if (activeTab === "route") {
      // For routes, navigate with listener selection
      // For simplicity, if there are listeners, use the first one's context
      if (listeners.length > 0) {
        const first = listeners[0];
        navigate(`/traffic2/route/create?port=${first.port}&listener=${first.name || ""}`);
      } else {
        toast.error("Please create a listener first");
      }
    } else if (activeTab === "backend") {
      // For backends, need route context
      if (routes.length > 0) {
        const first = routes[0];
        navigate(`/traffic2/backend/create?port=${first.port}&listener=${first.listenerName || ""}&route=${first.name || ""}`);
      } else {
        toast.error("Please create a route first");
      }
    } else if (activeTab === "policy") {
      // For policies, need route context
      if (routes.length > 0) {
        const first = routes[0];
        navigate(`/traffic2/policy/create?port=${first.port}&listener=${first.listenerName || ""}&route=${first.name || ""}`);
      } else {
        toast.error("Please create a route first");
      }
    }
  };

  const handleEdit = (item: any) => {
    if (activeTab === "listener") {
      navigate(`/traffic2/listener/edit?port=${item.port}&listener=${item.name || ""}`);
    } else if (activeTab === "route") {
      navigate(`/traffic2/route/edit?port=${item.port}&listener=${item.listenerName || ""}&route=${item.name || ""}`);
    } else if (activeTab === "backend") {
      navigate(`/traffic2/backend/edit?port=${item.port}&listener=${item.listenerName || ""}&route=${item.routeName || ""}&backendIndex=${item.index}`);
    } else if (activeTab === "policy") {
      navigate(`/traffic2/policy/edit?port=${item.port}&listener=${item.listenerName || ""}&route=${item.routeName || ""}`);
    }
  };

  const handleDelete = (item: any) => {
    confirm({
      title: `Delete ${resourceLabels[activeTab].singular}`,
      content: `Are you sure you want to delete this ${resourceLabels[activeTab].singular.toLowerCase()}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          if (activeTab === "listener") {
            await api.removeListener(item.port, item.name);
          } else if (activeTab === "route") {
            await api.deleteRoute(item.port, item.listenerName, item.name);
          } else if (activeTab === "backend") {
            await api.deleteBackend(item.port, item.listenerName, item.routeName, item.index);
          } else if (activeTab === "policy") {
            await api.deleteRoutePolicy(item.port, item.listenerName, item.routeName);
          }
          await mutate();
          toast.success(`${resourceLabels[activeTab].singular} deleted successfully`);
        } catch (error: any) {
          console.error(`Failed to delete ${activeTab}:`, error);
          toast.error(error.message || `Failed to delete ${activeTab}`);
        }
      },
      confirmText: "Delete",
      danger: true,
    });
  };

  // Define columns for each resource type
  const columns: Record<ResourceType, ColumnsType<any>> = {
    listener: [
      {
        title: "Port",
        dataIndex: "port",
        key: "port",
        width: 100,
      },
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name: string | null | undefined) => name || "<unnamed>",
      },
      {
        title: "Hostname",
        dataIndex: "hostname",
        key: "hostname",
        render: (hostname: string | null | undefined) => hostname || "*",
      },
      {
        title: "Protocol",
        dataIndex: "protocol",
        key: "protocol",
        render: (protocol: string | undefined) => protocol || "HTTP",
      },
      {
        title: "Routes",
        dataIndex: "routes",
        key: "routes",
        render: (routes: any[]) => `${routes?.length || 0}`,
      },
      {
        title: "Actions",
        key: "actions",
        width: 150,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    route: [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name: string | null | undefined) => name || "<unnamed>",
      },
      {
        title: "Listener",
        dataIndex: "listenerName",
        key: "listenerName",
        render: (name: string | null | undefined) => name || "<unnamed>",
      },
      {
        title: "Hostnames",
        dataIndex: "hostnames",
        key: "hostnames",
        render: (hostnames: string[] | undefined) => hostnames?.join(", ") || "-",
      },
      {
        title: "Backends",
        dataIndex: "backends",
        key: "backends",
        render: (backends: any[]) => `${backends?.length || 0}`,
      },
      {
        title: "Actions",
        key: "actions",
        width: 150,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    backend: [
      {
        title: "Type",
        key: "type",
        render: (record: any) => {
          if ("service" in record) return "SERVICE";
          if ("host" in record) return "HOST";
          if ("mcp" in record) return "MCP";
          if ("ai" in record) return "AI";
          if ("dynamic" in record) return "DYNAMIC";
          return "UNKNOWN";
        },
      },
      {
        title: "Details",
        key: "details",
        render: (record: any) => {
          if ("service" in record && record.service) {
            return `${record.service.name}:${record.service.port}`;
          }
          if ("host" in record) return record.host;
          if ("mcp" in record) return "MCP Backend";
          if ("ai" in record) return "AI Backend";
          if ("dynamic" in record) return "Dynamic Backend";
          return "-";
        },
      },
      {
        title: "Weight",
        dataIndex: "weight",
        key: "weight",
        render: (weight: number | undefined) => weight || 100,
      },
      {
        title: "Route",
        dataIndex: "routeName",
        key: "routeName",
        render: (name: string | null | undefined) => name || "<unnamed>",
      },
      {
        title: "Actions",
        key: "actions",
        width: 150,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
    policy: [
      {
        title: "Type",
        dataIndex: "policyType",
        key: "policyType",
        render: (type: string) => type?.toUpperCase(),
      },
      {
        title: "Route",
        dataIndex: "routeName",
        key: "routeName",
        render: (name: string | null | undefined) => name || "<unnamed>",
      },
      {
        title: "Has CORS",
        key: "cors",
        render: (record: any) => (record.cors ? "Yes" : "No"),
      },
      {
        title: "Has Auth",
        key: "auth",
        render: (record: any) => (record.authorization || record.jwtAuth || record.basicAuth || record.apiKey ? "Yes" : "No"),
      },
      {
        title: "Actions",
        key: "actions",
        width: 150,
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ],
  };

  const currentData = {
    listener: listeners,
    route: routes,
    backend: backends,
    policy: policies,
  };
  const currentColumns = columns[activeTab];

  return (
    <Container>
      <PageHeader>
        <div>
          <PageTitle>Traffic Configuration</PageTitle>
          <Description>
            Manage listeners, routes, backends, and policies for your gateway
          </Description>
        </div>
        <Button
          icon={<CodeOutlined />}
          onClick={() => navigate("/traffic2/raw-config")}
        >
          Edit Raw Config
        </Button>
      </PageHeader>

      <StyledAlert
        message="TypeScript-Based Forms"
        description="This page uses TypeScript form definitions with full type safety from config.d.ts. Forms open in full-page mode for better editing experience."
        type="info"
        showIcon
        closable
      />

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as ResourceType)}
        items={resourceTypes.map((type) => ({
          key: type,
          label: resourceLabels[type].plural,
          children: (
            <Card
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  Create {resourceLabels[type].singular}
                </Button>
              }
            >
              <Table
                columns={currentColumns}
                dataSource={currentData[type]}
                pagination={{ pageSize: 10 }}
                rowKey={(_record, index) => `${type}-${index}`}
                loading={isLoading}
              />
            </Card>
          ),
        }))}
      />

    </Container>
  );
}
