import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const MCPServersPage = () => {
  return (
    <Container>
      <h1>MCP Servers</h1>
      <Card>
        <p>Configure and manage MCP servers</p>
      </Card>
    </Container>
  );
};
