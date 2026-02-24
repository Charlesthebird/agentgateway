import styled from "@emotion/styled";
import { Button, Card, Form, Input, Space, Tabs } from "antd";
import { useState } from "react";
import toast from "react-hot-toast";
import { StyledSelect } from "../../components/StyledSelect";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

const RequestContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`;

const ResponseContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
`;

const CodeBlock = styled.pre`
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-md);
  overflow: auto;
  max-height: 400px;
  font-family: "Monaco", "Consolas", monospace;
  font-size: 13px;
`;

const StatusBadge = styled.div<{ success?: boolean }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--border-radius-base);
  background: ${(props) =>
    props.success ? "var(--color-success-bg)" : "var(--color-error-bg)"};
  color: ${(props) =>
    props.success ? "var(--color-success)" : "var(--color-error)"};
  font-weight: 500;
`;

export const PlaygroundPage = () => {
  const [httpLoading, setHttpLoading] = useState(false);
  const [httpResponse, setHttpResponse] = useState<any>(null);
  const [form] = Form.useForm();

  const handleHttpRequest = async (values: any) => {
    setHttpLoading(true);

    const requestPromise = (async () => {
      // Mock HTTP request - will be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-" + Math.random().toString(36).substr(2, 9),
        },
        data: {
          message: "Request successful",
          method: values.method,
          url: values.url,
          timestamp: new Date().toISOString(),
        },
        duration: Math.floor(Math.random() * 500) + 50,
      };

      return mockResponse;
    })();

    toast
      .promise(requestPromise, {
        loading: "Sending request...",
        success: "Request completed successfully",
        error: "Request failed",
      })
      .then((mockResponse) => {
        setHttpResponse(mockResponse);
      })
      .catch(() => {
        setHttpResponse({
          status: 500,
          statusText: "Error",
          error: "Failed to complete request",
        });
      })
      .finally(() => {
        setHttpLoading(false);
      });
  };

  const HttpRequestTab = () => (
    <RequestContainer>
      <Form form={form} layout="vertical" onFinish={handleHttpRequest}>
        <Form.Item
          name="method"
          label="HTTP Method"
          initialValue="GET"
          rules={[{ required: true }]}
        >
          <StyledSelect style={{ width: 150 }}>
            <StyledSelect.Option value="GET">GET</StyledSelect.Option>
            <StyledSelect.Option value="POST">POST</StyledSelect.Option>
            <StyledSelect.Option value="PUT">PUT</StyledSelect.Option>
            <StyledSelect.Option value="DELETE">DELETE</StyledSelect.Option>
            <StyledSelect.Option value="PATCH">PATCH</StyledSelect.Option>
          </StyledSelect>
        </Form.Item>

        <Form.Item
          name="url"
          label="Request URL"
          initialValue="http://localhost:8080/api/test"
          rules={[{ required: true, message: "Please enter a URL" }]}
        >
          <Input placeholder="http://localhost:8080/api/test" />
        </Form.Item>

        <Form.Item name="headers" label="Headers (JSON)">
          <Input.TextArea
            rows={4}
            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
          />
        </Form.Item>

        <Form.Item name="body" label="Request Body (JSON)">
          <Input.TextArea rows={6} placeholder='{"key": "value"}' />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={httpLoading}>
              Send Request
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>

      {httpResponse && (
        <ResponseContainer>
          <h3>Response</h3>
          <div>
            <StatusBadge success={httpResponse.status < 400}>
              {httpResponse.status} {httpResponse.statusText}
            </StatusBadge>
            {httpResponse.duration && (
              <span style={{ marginLeft: 16, color: "#999" }}>
                Duration: {httpResponse.duration}ms
              </span>
            )}
          </div>

          {httpResponse.headers && (
            <>
              <h4>Headers</h4>
              <CodeBlock>
                {JSON.stringify(httpResponse.headers, null, 2)}
              </CodeBlock>
            </>
          )}

          {httpResponse.data && (
            <>
              <h4>Body</h4>
              <CodeBlock>
                {JSON.stringify(httpResponse.data, null, 2)}
              </CodeBlock>
            </>
          )}

          {httpResponse.error && (
            <>
              <h4>Error</h4>
              <CodeBlock>{httpResponse.error}</CodeBlock>
            </>
          )}
        </ResponseContainer>
      )}
    </RequestContainer>
  );

  const RouteTestingTab = () => (
    <RequestContainer>
      <p>
        Test your route configurations here. This tool allows you to verify
        routing rules and backend connections.
      </p>
      <Form layout="vertical">
        <Form.Item label="Route Path" required>
          <Input placeholder="/api/v1/chat" />
        </Form.Item>
        <Form.Item label="Test Request">
          <Input.TextArea
            rows={6}
            placeholder='{"method": "POST", "headers": {}, "body": {}}'
          />
        </Form.Item>
        <Button type="primary">Test Route</Button>
      </Form>
    </RequestContainer>
  );

  const MCPClientTab = () => (
    <RequestContainer>
      <p>
        Test MCP (Model Context Protocol) server connections and method calls.
      </p>
      <Form layout="vertical">
        <Form.Item label="MCP Server" required>
          <StyledSelect placeholder="Select MCP server">
            <StyledSelect.Option value="server1">MCP Server 1</StyledSelect.Option>
            <StyledSelect.Option value="server2">MCP Server 2</StyledSelect.Option>
          </StyledSelect>
        </Form.Item>
        <Form.Item label="Method" required>
          <Input placeholder="tools/list" />
        </Form.Item>
        <Form.Item label="Parameters (JSON)">
          <Input.TextArea rows={6} placeholder="{}" />
        </Form.Item>
        <Button type="primary">Call Method</Button>
      </Form>
    </RequestContainer>
  );

  const A2AClientTab = () => (
    <RequestContainer>
      <p>Test Agent-to-Agent (A2A) connections and protocol interactions.</p>
      <Form layout="vertical">
        <Form.Item label="Target Agent" required>
          <Input placeholder="agent://service-name" />
        </Form.Item>
        <Form.Item label="Action" required>
          <StyledSelect placeholder="Select action">
            <StyledSelect.Option value="query">Query</StyledSelect.Option>
            <StyledSelect.Option value="execute">Execute</StyledSelect.Option>
            <StyledSelect.Option value="subscribe">Subscribe</StyledSelect.Option>
          </StyledSelect>
        </Form.Item>
        <Form.Item label="Payload (JSON)">
          <Input.TextArea rows={6} placeholder='{"query": "test"}' />
        </Form.Item>
        <Button type="primary">Send Message</Button>
      </Form>
    </RequestContainer>
  );

  const items = [
    {
      key: "http",
      label: "HTTP Request",
      children: <HttpRequestTab />,
    },
    {
      key: "route",
      label: "Route Testing",
      children: <RouteTestingTab />,
    },
    {
      key: "mcp",
      label: "MCP Client",
      children: <MCPClientTab />,
    },
    {
      key: "a2a",
      label: "A2A Client",
      children: <A2AClientTab />,
    },
  ];

  return (
    <Container>
      <h1>Playground</h1>
      <Card>
        <Tabs defaultActiveKey="http" items={items} />
      </Card>
    </Container>
  );
};
