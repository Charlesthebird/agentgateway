import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const LLMOverviewPage = () => {
  return (
    <Container>
      <h1>LLM Overview</h1>
      <Card>
        <p>LLM (Large Language Model) overview and statistics</p>
      </Card>
    </Container>
  );
};
