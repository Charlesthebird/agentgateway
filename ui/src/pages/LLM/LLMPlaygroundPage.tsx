import styled from "@emotion/styled";
import { Card } from "antd";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const LLMPlaygroundPage = () => {
  return (
    <Container>
      <h1>LLM Playground</h1>
      <Card>
        <p>Test LLM interactions and prompts</p>
      </Card>
    </Container>
  );
};
