import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const MCPLogsPage = () => {
  return (
    <Container>
      <h1>MCP Logs</h1>
      <Card>
        <p>View MCP request and response logs</p>
      </Card>
    </Container>
  );
};

export const MCPMetricsPage = () => {
  return (
    <Container>
      <h1>MCP Metrics</h1>
      <Card>
        <p>View MCP performance metrics and analytics</p>
      </Card>
    </Container>
  );
};

export const MCPPlaygroundPage = () => {
  return (
    <Container>
      <h1>MCP Playground</h1>
      <Card>
        <p>Test MCP server interactions</p>
      </Card>
    </Container>
  );
};
