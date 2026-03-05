import { DeleteOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";
import Form from "@rjsf/antd";
import { Button, Popconfirm, Space, Spin } from "antd";
import { Edit2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useConfig } from "../../../api";
import { ProtocolTag } from "../../../components/ProtocolTag";
import { StyledAlert } from "../../../components/StyledAlert";
import { validator } from "../../../utils/validator";
import { forms } from "../forms";
import type {
  BackendNode,
  BindNode,
  ListenerNode,
  RouteNode,
  PolicyNode,
} from "../hooks/useTraffic3Hierarchy";
import type { useTraffic3Hierarchy } from "../hooks/useTraffic3Hierarchy";
import type { UrlParams } from "../Traffic3Page";
import * as api from "../../../api/crud";
import { useNodePolling } from "../hooks/useNodePolling";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Container = styled.div`
  padding: var(--spacing-xl);
  background: var(--color-bg-container);
  min-height: 100%;
`;

const Header = styled.div`
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  justify-content: space-between;
`;

const TitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-base);
`;

const TypeBadge = styled.span`
  font-size: 12px;
  color: var(--color-text-base);
  background: var(--color-bg-layout);
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  padding-bottom: 8px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
`;

// ---------------------------------------------------------------------------
// Type guards to determine node type
// ---------------------------------------------------------------------------

function findSelectedNode(
  hierarchy: ReturnType<typeof useTraffic3Hierarchy>,
  urlParams: UrlParams,
):
  | { type: "bind"; node: BindNode }
  | { type: "listener"; node: ListenerNode; bind: BindNode }
  | { type: "route"; node: RouteNode; listener: ListenerNode; bind: BindNode }
  | {
      type: "backend";
      node: BackendNode;
      route: RouteNode;
      listener: ListenerNode;
      bind: BindNode;
    }
  | {
      type: "policy";
      node: PolicyNode;
      route: RouteNode;
      listener: ListenerNode;
      bind: BindNode;
    }
  | null {
  const { port, li, ri, bi, isTcpRoute, policyType } = urlParams;
  const bindNode = hierarchy.binds.find((b) => b.bind.port === port);
  if (!bindNode) return null;

  if (li === undefined) {
    return { type: "bind", node: bindNode };
  }

  const listenerNode = bindNode.listeners[li];
  if (!listenerNode) return null;

  if (ri === undefined) {
    return { type: "listener", node: listenerNode, bind: bindNode };
  }

  const routeNode = listenerNode.routes.find(
    (rn) => rn.isTcp === isTcpRoute && rn.categoryIndex === ri,
  );
  if (!routeNode) return null;

  if (bi === undefined && !policyType) {
    return {
      type: "route",
      node: routeNode,
      listener: listenerNode,
      bind: bindNode,
    };
  }

  if (policyType) {
    const policyNode = routeNode.policies.find(p => p.policyType === policyType);
    if (!policyNode) return null;
    return {
      type: "policy",
      node: policyNode,
      route: routeNode,
      listener: listenerNode,
      bind: bindNode,
    };
  }

  const backendNode = routeNode.backends[bi!];
  if (!backendNode) return null;

  return {
    type: "backend",
    node: backendNode,
    route: routeNode,
    listener: listenerNode,
    bind: bindNode,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NodeDetailViewProps {
  hierarchy: ReturnType<typeof useTraffic3Hierarchy>;
  urlParams: UrlParams;
}

export function NodeDetailView({ hierarchy, urlParams }: NodeDetailViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate } = useConfig();

  // Edit mode is URL-driven
  const searchParams = new URLSearchParams(location.search);
  const isEditing = searchParams.get("edit") === "true";
  const isCreating = searchParams.get("creating") === "true";

  const [formData, setFormData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Poll for the node if we're in creating mode
  const { isPolling, hasTimedOut } = useNodePolling(hierarchy, urlParams, isCreating);

  const selected = useMemo(() => {
    const sel = findSelectedNode(hierarchy, urlParams);
    // Initialize formData when selection changes
    if (sel) {
      if (sel.type === "bind") {
        setFormData(sel.node.bind as unknown as Record<string, unknown>);
      } else if (sel.type === "listener") {
        // Filter out routes and tcpRoutes - they're managed separately via the tree
        const { routes, tcpRoutes, ...listenerData } = sel.node.listener as Record<string, unknown>;
        setFormData(listenerData);
      } else if (sel.type === "route") {
        // Filter out backends - they're managed separately via the tree
        const { backends, ...routeData } = sel.node.route as Record<string, unknown>;
        setFormData(routeData);
      } else if (sel.type === "backend") {
        // Transform backend data from API format to form format
        const form = forms.backend as any;
        const backendData = sel.node.backend as Record<string, unknown>;
        const transformedData = form?.transformForForm
          ? form.transformForForm(backendData)
          : backendData;
        setFormData(transformedData as Record<string, unknown>);
      } else if (sel.type === "policy") {
        setFormData(sel.node.policy as Record<string, unknown>);
      }
    }
    return sel;
  }, [hierarchy, urlParams]);

  // Reset form data when exiting edit mode
  useEffect(() => {
    if (!isEditing && selected) {
      // Reset to original data from the node
      if (selected.type === "bind") {
        setFormData(selected.node.bind as unknown as Record<string, unknown>);
      } else if (selected.type === "listener") {
        // Filter out routes and tcpRoutes - they're managed separately via the tree
        const { routes, tcpRoutes, ...listenerData } = selected.node.listener as Record<string, unknown>;
        setFormData(listenerData);
      } else if (selected.type === "route") {
        // Filter out backends - they're managed separately via the tree
        const { backends, ...routeData } = selected.node.route as Record<string, unknown>;
        setFormData(routeData);
      } else if (selected.type === "backend") {
        // Transform backend data from API format to form format
        const form = forms.backend as any;
        const backendData = selected.node.backend as Record<string, unknown>;
        const transformedData = form?.transformForForm
          ? form.transformForForm(backendData)
          : backendData;
        setFormData(transformedData as Record<string, unknown>);
      } else if (selected.type === "policy") {
        setFormData(selected.node.policy as Record<string, unknown>);
      }
    }
  }, [isEditing, selected]);

  if (hierarchy.isLoading || isPolling) {
    return (
      <Container>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
          {isPolling && (
            <p style={{ marginTop: 16, color: "var(--color-text-secondary)" }}>
              Loading node...
            </p>
          )}
        </div>
      </Container>
    );
  }

  if (!selected) {
    return (
      <Container>
        <StyledAlert
          type="warning"
          message="Node Not Found"
          description={
            hasTimedOut
              ? "The node was created but could not be loaded in time. Please refresh the page or navigate to it from the tree."
              : "The selected node could not be found in the current configuration."
          }
          showIcon
        />
      </Container>
    );
  }

  const handleSave = async (fd: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { port, li, ri, bi, isTcpRoute } = urlParams;

      // Apply form-specific transformation if available
      const form = forms[selected.type] as any;
      let dataToSave = fd;
      if (form?.transformBeforeSubmit) {
        dataToSave = form.transformBeforeSubmit(fd) as Record<string, unknown>;
      }

      if (selected.type === "bind") {
        await api.updateBind(port, dataToSave);
      } else if (selected.type === "listener") {
        // Merge back the routes/tcpRoutes that we filtered out from the form
        const listenerWithRoutes = {
          ...dataToSave,
          routes: selected.node.listener.routes,
          tcpRoutes: selected.node.listener.tcpRoutes,
        };
        await api.updateListenerByIndex(port, li!, listenerWithRoutes);
      } else if (selected.type === "route") {
        // Merge back the backends that we filtered out from the form
        const routeWithBackends = {
          ...dataToSave,
          backends: selected.node.route.backends,
        };
        if (isTcpRoute) {
          await api.updateTCPRouteByIndex(port, li!, ri!, routeWithBackends);
        } else {
          await api.updateRouteByIndex(port, li!, ri!, routeWithBackends);
        }
      } else if (selected.type === "backend") {
        if (isTcpRoute) {
          await api.updateTCPRouteBackendByIndex(port, li!, ri!, bi!, dataToSave);
        } else {
          await api.updateRouteBackendByIndex(port, li!, ri!, bi!, dataToSave);
        }
      } else if (selected.type === "policy") {
        // For policy, update the specific policy type in the parent route's policies field
        const currentPolicies = (selected.route.route.policies && typeof selected.route.route.policies === 'object')
          ? selected.route.route.policies
          : {};

        const updatedRoute = {
          ...selected.route.route,
          policies: {
            ...currentPolicies,
            [selected.node.policyType]: dataToSave,
          },
        };
        if (isTcpRoute) {
          await api.updateTCPRouteByIndex(port, li!, ri!, updatedRoute as any);
        } else {
          await api.updateRouteByIndex(port, li!, ri!, updatedRoute as any);
        }
      }

      toast.success(
        `${selected.type.charAt(0).toUpperCase() + selected.type.slice(1)} updated successfully`,
      );
      mutate();
      navigate(location.pathname); // Remove ?edit=true
    } catch (e: unknown) {
      const errorMessage =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "Failed to save changes";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { port, li, ri, bi, isTcpRoute } = urlParams;

      if (selected.type === "bind") {
        await api.removeBind(port);
        navigate("/traffic3");
      } else if (selected.type === "listener") {
        await api.removeListenerByIndex(port, li!);
        navigate(`/traffic3/bind/${port}`);
      } else if (selected.type === "route") {
        if (isTcpRoute) {
          await api.removeTCPRouteByIndex(port, li!, ri!);
        } else {
          await api.removeRouteByIndex(port, li!, ri!);
        }
        navigate(`/traffic3/bind/${port}/listener/${li}`);
      } else if (selected.type === "backend") {
        if (isTcpRoute) {
          await api.removeTCPRouteBackendByIndex(port, li!, ri!, bi!);
        } else {
          await api.removeRouteBackendByIndex(port, li!, ri!, bi!);
        }
        navigate(
          `/traffic3/bind/${port}/listener/${li}/${isTcpRoute ? "tcproute" : "route"}/${ri}`,
        );
      } else if (selected.type === "policy") {
        // For policy, remove the specific policy type from the parent route
        const currentPolicies = (selected.route.route.policies && typeof selected.route.route.policies === 'object')
          ? selected.route.route.policies
          : {};

        const { [selected.node.policyType]: removed, ...remainingPolicies } = currentPolicies as Record<string, unknown>;

        const updatedRoute = {
          ...selected.route.route,
          policies: Object.keys(remainingPolicies).length > 0 ? remainingPolicies : null,
        };
        if (isTcpRoute) {
          await api.updateTCPRouteByIndex(port, li!, ri!, updatedRoute as any);
        } else {
          await api.updateRouteByIndex(port, li!, ri!, updatedRoute as any);
        }
        navigate(
          `/traffic3/bind/${port}/listener/${li}/${isTcpRoute ? "tcproute" : "route"}/${ri}`,
        );
      }

      toast.success(
        `${selected.type.charAt(0).toUpperCase() + selected.type.slice(1)} deleted`,
      );
      mutate();
    } catch (e: unknown) {
      const errorMessage =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "Failed to delete";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = ({ formData: fd }: { formData?: Record<string, unknown> }) => {
    if (fd) {
      handleSave(fd);
    }
  };

  const handleError = (errors: any) => {
    // Show first validation error in toast
    if (errors && errors.length > 0) {
      const firstError = errors[0];
      const errorMessage = firstError.stack || firstError.message || "Validation error";
      toast.error(errorMessage);
    }
  };

  // Render based on node type
  if (selected.type === "bind") {
    const { node } = selected;
    return (
      <Container>
        <Header>
          <TitleRow>
            <TitleLeft>
              <Title>
                {isEditing ? "Edit: " : ""}Port {node.bind.port}
              </Title>
              <TypeBadge>Bind</TypeBadge>
            </TitleLeft>
            {!isEditing && (
              <Button
                type="primary"
                icon={<Edit2 size={14} />}
                onClick={() => navigate(location.pathname + "?edit=true")}
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                icon={<X size={14} />}
                onClick={() => navigate(location.pathname)}
              >
                Cancel
              </Button>
            )}
          </TitleRow>
          <Description>Port binding configuration</Description>
        </Header>

        <SectionTitle>Bind Details</SectionTitle>
        <Form
          key={isEditing ? 'editing' : 'viewing'}
          schema={forms.bind.schema}
          uiSchema={forms.bind.uiSchema}
          formData={formData}
          validator={validator}
          disabled={!isEditing || saving}
          onChange={({ formData: fd }) => setFormData(fd)}
          onSubmit={handleSubmit}
          onError={handleError}
        >
          {isEditing && (
            <FormActions>
              <Popconfirm
                title="Delete this bind?"
                description="This cannot be undone."
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} disabled={saving}>
                  Delete
                </Button>
              </Popconfirm>
              <Space>
                <Button
                  onClick={() => navigate(location.pathname)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Changes
                </Button>
              </Space>
            </FormActions>
          )}
          {!isEditing && (
            <FormActions>
              <div />
              <Button onClick={() => navigate("/traffic3")}>
                Back to Overview
              </Button>
            </FormActions>
          )}
        </Form>
      </Container>
    );
  }

  if (selected.type === "listener") {
    const { node } = selected;
    const protocol = node.listener.protocol ?? "HTTP";
    return (
      <Container>
        <Header>
          <TitleRow>
            <TitleLeft>
              <Title>
                {isEditing ? "Edit: " : ""}
                {node.listener.name ?? "(unnamed listener)"}
              </Title>
              <TypeBadge>Listener</TypeBadge>
              <ProtocolTag protocol={protocol} />
            </TitleLeft>
            {!isEditing && (
              <Button
                type="primary"
                icon={<Edit2 size={14} />}
                onClick={() => navigate(location.pathname + "?edit=true")}
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                icon={<X size={14} />}
                onClick={() => navigate(location.pathname)}
              >
                Cancel
              </Button>
            )}
          </TitleRow>
          <Description>
            Listener configuration on port {selected.bind.bind.port}
          </Description>
        </Header>

        <SectionTitle>Listener Details</SectionTitle>
        <Form
          key={isEditing ? 'editing' : 'viewing'}
          schema={forms.listener.schema}
          uiSchema={forms.listener.uiSchema}
          formData={formData}
          validator={validator}
          disabled={!isEditing || saving}
          onChange={({ formData: fd }) => setFormData(fd)}
          onSubmit={handleSubmit}
          onError={handleError}
        >
          {isEditing && (
            <FormActions>
              <Popconfirm
                title="Delete this listener?"
                description="This cannot be undone."
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} disabled={saving}>
                  Delete
                </Button>
              </Popconfirm>
              <Space>
                <Button
                  onClick={() => navigate(location.pathname)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Changes
                </Button>
              </Space>
            </FormActions>
          )}
          {!isEditing && (
            <FormActions>
              <div />
              <Button onClick={() => navigate("/traffic3")}>
                Back to Overview
              </Button>
            </FormActions>
          )}
        </Form>
      </Container>
    );
  }

  if (selected.type === "route") {
    const { node } = selected;
    const isTcp = node.isTcp;
    return (
      <Container>
        <Header>
          <TitleRow>
            <TitleLeft>
              <Title>
                {isEditing ? "Edit: " : ""}
                {(node.route.name as string | undefined) ?? "(unnamed route)"}
              </Title>
              <TypeBadge>{isTcp ? "TCP Route" : "HTTP Route"}</TypeBadge>
            </TitleLeft>
            {!isEditing && (
              <Button
                type="primary"
                icon={<Edit2 size={14} />}
                onClick={() => navigate(location.pathname + "?edit=true")}
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                icon={<X size={14} />}
                onClick={() => navigate(location.pathname)}
              >
                Cancel
              </Button>
            )}
          </TitleRow>
          <Description>
            Route configuration for listener "
            {selected.listener.listener.name ?? "unnamed"}"
          </Description>
        </Header>

        <SectionTitle>Route Details</SectionTitle>
        <Form
          key={isEditing ? 'editing' : 'viewing'}
          schema={forms.route.schema}
          uiSchema={forms.route.uiSchema}
          formData={formData}
          validator={validator}
          disabled={!isEditing || saving}
          onChange={({ formData: fd }) => setFormData(fd)}
          onSubmit={handleSubmit}
          onError={handleError}
        >
          {isEditing && (
            <FormActions>
              <Popconfirm
                title="Delete this route?"
                description="This cannot be undone."
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} disabled={saving}>
                  Delete
                </Button>
              </Popconfirm>
              <Space>
                <Button
                  onClick={() => navigate(location.pathname)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Changes
                </Button>
              </Space>
            </FormActions>
          )}
          {!isEditing && (
            <FormActions>
              <div />
              <Button onClick={() => navigate("/traffic3")}>
                Back to Overview
              </Button>
            </FormActions>
          )}
        </Form>
      </Container>
    );
  }

  if (selected.type === "backend") {
    const { node } = selected;
    const backend = node.backend;

    // Determine backend type
    let backendType = "Backend";
    if (typeof backend === "object" && backend !== null) {
      const b = backend as Record<string, unknown>;
      if ("service" in b) backendType = "Service Backend";
      else if ("host" in b) backendType = "Host Backend";
      else if ("mcp" in b) backendType = "MCP Backend";
      else if ("ai" in b) backendType = "AI Backend";
    }

    return (
      <Container>
        <Header>
          <TitleRow>
            <TitleLeft>
              <Title>
                {isEditing ? "Edit: " : ""}
                {backendType}
              </Title>
              <TypeBadge>Backend</TypeBadge>
            </TitleLeft>
            {!isEditing && (
              <Button
                type="primary"
                icon={<Edit2 size={14} />}
                onClick={() => navigate(location.pathname + "?edit=true")}
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                icon={<X size={14} />}
                onClick={() => navigate(location.pathname)}
              >
                Cancel
              </Button>
            )}
          </TitleRow>
          <Description>
            Backend configuration for route "
            {(selected.route.route.name as string | undefined) ?? "unnamed"}"
          </Description>
        </Header>

        <SectionTitle>Backend Details</SectionTitle>
        <Form
          key={isEditing ? 'editing' : 'viewing'}
          schema={forms.backend.schema}
          uiSchema={forms.backend.uiSchema}
          formData={formData}
          validator={validator}
          disabled={!isEditing || saving}
          onChange={({ formData: fd }) => setFormData(fd)}
          onSubmit={handleSubmit}
          onError={handleError}
        >
          {isEditing && (
            <FormActions>
              <Popconfirm
                title="Delete this backend?"
                description="This cannot be undone."
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} disabled={saving}>
                  Delete
                </Button>
              </Popconfirm>
              <Space>
                <Button
                  onClick={() => navigate(location.pathname)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Changes
                </Button>
              </Space>
            </FormActions>
          )}
          {!isEditing && (
            <FormActions>
              <div />
              <Button onClick={() => navigate("/traffic3")}>
                Back to Overview
              </Button>
            </FormActions>
          )}
        </Form>
      </Container>
    );
  }

  if (selected.type === "policy") {
    // Format policy type for display
    const displayName = selected.node.policyType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    return (
      <Container>
        <Header>
          <TitleRow>
            <TitleLeft>
              <Title>
                {isEditing ? "Edit: " : ""}{displayName}
              </Title>
              <TypeBadge>Policy</TypeBadge>
            </TitleLeft>
            {!isEditing && (
              <Button
                type="primary"
                icon={<Edit2 size={14} />}
                onClick={() => navigate(location.pathname + "?edit=true")}
              >
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                icon={<X size={14} />}
                onClick={() => navigate(location.pathname)}
              >
                Cancel
              </Button>
            )}
          </TitleRow>
          <Description>
            Policy configuration for route "
            {(selected.route.route.name as string | undefined) ?? "unnamed"}"
          </Description>
        </Header>

        <SectionTitle>Policy Details</SectionTitle>
        <Form
          key={isEditing ? 'editing' : 'viewing'}
          schema={
            selected.node.policyType === 'cors'
              ? forms.corsPolicy.schema
              : selected.node.policyType === 'requestHeaderModifier'
              ? forms.requestHeaderModifierPolicy.schema
              : selected.node.policyType === 'responseHeaderModifier'
              ? forms.responseHeaderModifierPolicy.schema
              : forms.routePolicy.schema
          }
          uiSchema={
            selected.node.policyType === 'cors'
              ? forms.corsPolicy.uiSchema
              : selected.node.policyType === 'requestHeaderModifier'
              ? forms.requestHeaderModifierPolicy.uiSchema
              : selected.node.policyType === 'responseHeaderModifier'
              ? forms.responseHeaderModifierPolicy.uiSchema
              : forms.routePolicy.uiSchema
          }
          formData={formData}
          validator={validator}
          disabled={!isEditing || saving}
          onChange={({ formData: fd }) => setFormData(fd)}
          onSubmit={handleSubmit}
          onError={handleError}
        >
          {isEditing && (
            <FormActions>
              <Popconfirm
                title="Delete this policy?"
                description="This cannot be undone."
                onConfirm={handleDelete}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />} disabled={saving}>
                  Delete
                </Button>
              </Popconfirm>
              <Space>
                <Button
                  onClick={() => navigate(location.pathname)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save Changes
                </Button>
              </Space>
            </FormActions>
          )}
          {!isEditing && (
            <FormActions>
              <div />
              <Button onClick={() => navigate("/traffic3")}>
                Back to Overview
              </Button>
            </FormActions>
          )}
        </Form>
      </Container>
    );
  }

  return null;
}
