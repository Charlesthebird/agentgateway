import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const LLMLogsPage = () => {
  return (
    <Container>
      <h1>LLM Logs</h1>
      <Card>
        <p>View LLM request and response logs</p>
      </Card>
    </Container>
  );
};
