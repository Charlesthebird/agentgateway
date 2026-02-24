import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const MCPOverviewPage = () => {
  return (
    <Container>
      <h1>MCP Overview</h1>
      <Card>
        <p>Model Context Protocol overview and statistics</p>
      </Card>
    </Container>
  );
};
