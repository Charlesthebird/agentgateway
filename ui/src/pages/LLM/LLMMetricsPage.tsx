import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const LLMMetricsPage = () => {
  return (
    <Container>
      <h1>LLM Metrics</h1>
      <Card>
        <p>View LLM performance metrics and analytics</p>
      </Card>
    </Container>
  );
};
