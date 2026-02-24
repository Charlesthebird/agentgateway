import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const LLMModelsPage = () => {
  return (
    <Container>
      <h1>LLM Models</h1>
      <Card>
        <p>Configure and manage LLM models</p>
      </Card>
    </Container>
  );
};
