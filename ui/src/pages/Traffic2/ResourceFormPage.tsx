import styled from "@emotion/styled";
import Form from "@rjsf/antd";
import { Button, Card, Space } from "antd";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useConfig } from "../../api/hooks";
import { validator } from "../../utils/validator";
import type { ResourceType } from "./forms";
import { forms, resourceLabels } from "./forms";
import * as api from "../../api";

const Container = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: var(--spacing-xxl);
`;

const PageTitle = styled.h1`
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text-base);
  letter-spacing: -0.02em;
`;

const Description = styled.p`
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
`;

const FormCard = styled(Card)`
  &.ant-card {
    background: var(--color-bg-container);
    border: none;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03),
                0 1px 6px -1px rgba(0, 0, 0, 0.02),
                0 2px 4px 0 rgba(0, 0, 0, 0.02);
  }

  [data-theme="dark"] &.ant-card {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2),
                0 1px 6px -1px rgba(0, 0, 0, 0.15),
                0 2px 4px 0 rgba(0, 0, 0, 0.1);
  }

  .ant-card-body {
    padding: var(--spacing-xxl);
  }

  /* Form items spacing */
  .ant-form-item {
    margin-bottom: var(--spacing-lg);
  }

  .ant-form-item-label {
    padding-bottom: var(--spacing-sm);
  }

  .ant-form-item-label > label {
    color: var(--color-text-base);
    font-weight: var(--font-weight-medium);
    font-size: 14px;
  }

  /* Input fields */
  .ant-input,
  .ant-input-number,
  .ant-select-selector,
  .ant-checkbox-wrapper {
    background: var(--color-bg-base);
    border-color: var(--color-border-base);
    color: var(--color-text-base);
  }

  .ant-input,
  .ant-input-number-input,
  .ant-select-selector {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .ant-input::placeholder,
  .ant-input-number-input::placeholder {
    color: var(--color-text-tertiary);
  }

  .ant-form-item-explain-error {
    color: var(--color-error);
  }

  /* Field sets for nested objects/arrays */
  fieldset {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    background: var(--color-bg-elevated);
  }

  legend {
    color: var(--color-text-base);
    font-weight: var(--font-weight-semibold);
    padding: 0 var(--spacing-sm);
    font-size: 14px;
  }

  /* Description text */
  .ant-form-item-extra {
    color: var(--color-text-tertiary);
    font-size: 13px;
    margin-top: var(--spacing-xs);
  }

  /* Array field controls */
  .array-item-toolbox {
    margin-top: var(--spacing-sm);
  }

  /* Checkbox styling */
  .ant-checkbox-wrapper {
    color: var(--color-text-base);
  }

  .ant-checkbox-inner {
    background-color: var(--color-bg-base);
    border-color: var(--color-border-base);
  }

  /* Error list at top */
  .error-list {
    margin-bottom: var(--spacing-lg);
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-xxl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border-secondary);
`;

export function ResourceFormPage() {
  const { resourceType, action } = useParams<{ resourceType: ResourceType; action: "create" | "edit" }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate } = useConfig();

  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get query params for edit mode
  const port = searchParams.get("port");
  const listenerName = searchParams.get("listener");
  const routeName = searchParams.get("route");
  const backendIndex = searchParams.get("backendIndex");

  const isEditMode = action === "edit";
  const currentForm = resourceType ? forms[resourceType] : null;
  const label = resourceType ? resourceLabels[resourceType] : null;

  useEffect(() => {
    // Load existing data in edit mode
    if (isEditMode && resourceType) {
      loadExistingData();
    } else if (currentForm) {
      // Set default values in create mode
      setFormData((currentForm as any).defaultValues || {});
    }
  }, [isEditMode, resourceType]);

  async function loadExistingData() {
    try {
      if (resourceType === "listener" && port) {
        const listeners = await api.getListeners();
        const listener = listeners.find((l) => l.port === Number(port) && l.name === listenerName);
        if (listener) {
          // Include port in the form data for editing
          setFormData(listener);
        }
      } else if (resourceType === "route" && port && listenerName) {
        const routes = await api.getRoutes();
        const route = routes.find(
          (r) => r.port === Number(port) && r.listenerName === listenerName && r.name === routeName
        );
        if (route) {
          const { port: _, listenerName: __, ...rest } = route;
          setFormData(rest);
        }
      } else if (resourceType === "backend" && port && listenerName && routeName && backendIndex) {
        const backends = await api.getBackends();
        const backend = backends.find(
          (b) =>
            b.port === Number(port) &&
            b.listenerName === listenerName &&
            b.routeName === routeName &&
            b.index === Number(backendIndex)
        );
        if (backend) {
          const { port: _, listenerName: __, routeName: ___, index: ____, ...rest } = backend as any;
          setFormData(rest);
        }
      } else if (resourceType === "policy" && port && listenerName && routeName) {
        const policies = await api.getPolicies();
        const policy = policies.find(
          (p) => p.port === Number(port) && p.listenerName === listenerName && p.routeName === routeName
        );
        if (policy) {
          const { port: _, listenerName: __, routeName: ___, policyType: ____, ...rest } = policy;
          setFormData(rest);
        }
      }
    } catch (error) {
      console.error("Failed to load existing data:", error);
      toast.error("Failed to load existing data");
    }
  }

  async function handleSubmit({ formData: fd }: { formData?: any }) {
    if (!fd || !resourceType) return;

    setIsSubmitting(true);

    try {
      if (resourceType === "listener") {
        // Extract port from form data and remove it before saving
        const { port: formPort, ...listenerData } = fd;

        if (!formPort) {
          toast.error("Port is required to create a listener");
          setIsSubmitting(false);
          return;
        }

        // Initialize routes array based on protocol
        // Runtime validation requires routes/tcpRoutes for certain protocols
        const protocol = listenerData.protocol || "HTTP";
        if ((protocol === "HTTP" || protocol === "HTTPS" || protocol === "HBONE") && !listenerData.routes) {
          listenerData.routes = [];
        } else if (protocol === "TCP" && !listenerData.tcpRoutes) {
          listenerData.tcpRoutes = [];
        }

        if (isEditMode && port) {
          // Update existing listener
          await api.updateListener(Number(port), listenerName, listenerData);
          toast.success("Listener updated successfully");
        } else {
          // Create new listener
          await api.createListener(Number(formPort), listenerData);
          toast.success("Listener created successfully");
        }
      } else if (resourceType === "route") {
        if (isEditMode && port && listenerName) {
          await api.updateRoute(Number(port), listenerName, routeName, fd);
          toast.success("Route updated successfully");
        } else if (port && listenerName) {
          await api.createRoute(Number(port), listenerName, fd);
          toast.success("Route created successfully");
        } else {
          toast.error("Port and listener name are required to create a route");
          setIsSubmitting(false);
          return;
        }
      } else if (resourceType === "backend") {
        if (isEditMode && port && listenerName && routeName && backendIndex) {
          await api.updateBackend(Number(port), listenerName, routeName, Number(backendIndex), fd);
          toast.success("Backend updated successfully");
        } else if (port && listenerName && routeName) {
          await api.createBackend(Number(port), listenerName, routeName, fd);
          toast.success("Backend created successfully");
        } else {
          toast.error("Port, listener, and route are required to create a backend");
          setIsSubmitting(false);
          return;
        }
      } else if (resourceType === "policy") {
        if (port && listenerName && routeName) {
          await api.updateRoutePolicy(Number(port), listenerName, routeName, fd);
          toast.success("Policy updated successfully");
        } else {
          toast.error("Port, listener, and route are required to save a policy");
          setIsSubmitting(false);
          return;
        }
      }

      // Refresh config
      await mutate();

      // Navigate back to the list
      navigate("/traffic2");
    } catch (error: any) {
      console.error(`Failed to save ${resourceType}:`, error);
      toast.error(error.message || `Failed to save ${resourceType}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    navigate("/traffic2");
  }

  if (!resourceType || !currentForm || !label) {
    return (
      <Container>
        <PageHeader>
          <PageTitle>Invalid Resource Type</PageTitle>
          <Description>The specified resource type is not valid.</Description>
        </PageHeader>
        <Button onClick={() => navigate("/traffic2")}>Back to Traffic</Button>
      </Container>
    );
  }

  // Show additional context for create mode
  let contextMessage = "";
  if (!isEditMode) {
    if (resourceType === "listener" && port) {
      contextMessage = `Creating listener on port ${port}`;
    } else if (resourceType === "route" && listenerName) {
      contextMessage = `Creating route in listener "${listenerName}"`;
    } else if (resourceType === "backend" && routeName) {
      contextMessage = `Creating backend in route "${routeName}"`;
    } else if (resourceType === "policy" && routeName) {
      contextMessage = `Creating policy for route "${routeName}"`;
    }
  }

  return (
    <Container>
      <PageHeader>
        <PageTitle>
          {isEditMode ? "Edit" : "Create"} {label.singular}
        </PageTitle>
        <Description>
          {contextMessage || `${isEditMode ? "Update" : "Configure"} the ${label.singular.toLowerCase()} settings below`}
        </Description>
      </PageHeader>

      <FormCard>
        <Form
          schema={currentForm.schema}
          uiSchema={currentForm.uiSchema}
          formData={formData}
          validator={validator}
          onChange={({ formData: fd }) => setFormData(fd)}
          onSubmit={handleSubmit}
          onError={(errors) => {
            console.error("Form errors:", errors);
            if (errors.length > 0) {
              toast.error(`Form has ${errors.length} validation error${errors.length > 1 ? "s" : ""}`);
            }
          }}
          showErrorList="top"
          disabled={isSubmitting}
        >
          <ActionBar>
            <Button onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {isEditMode ? "Save Changes" : "Create"}
              </Button>
            </Space>
          </ActionBar>
        </Form>
      </FormCard>
    </Container>
  );
}
