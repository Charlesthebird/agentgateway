import styled from "@emotion/styled";
import { Button, Card, Col, Input, Row, Space } from "antd";
import { PlayCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { StyledAlert } from "../../components/StyledAlert";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

const EditorCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-secondary);
  background: var(--color-bg-container);
`;

const EditorContent = styled.div`
  padding: var(--spacing-lg);
`;

const CodeInput = styled(Input.TextArea)`
  font-family: "Monaco", "Consolas", monospace;
  font-size: 13px;
`;

const ResultContainer = styled.div`
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-base);
  font-family: "Monaco", "Consolas", monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const TemplateItem = styled.div`
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }
`;

export const CELPlaygroundPage = () => {
  const [expression, setExpression] = useState(
    'request.path.startsWith("/api") && request.method == "GET"',
  );
  const [context, setContext] = useState(
    JSON.stringify(
      {
        request: {
          path: "/api/users",
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        },
        user: {
          id: "user123",
          role: "admin",
        },
      },
      null,
      2,
    ),
  );
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const templates = [
    {
      name: "Path Matching",
      description: "Check if request path matches pattern",
      expression: 'request.path.startsWith("/api/v1")',
      context: {
        request: { path: "/api/v1/users", method: "GET" },
      },
    },
    {
      name: "Header Validation",
      description: "Validate request headers",
      expression:
        'has(request.headers.authorization) && request.headers["content-type"] == "application/json"',
      context: {
        request: {
          headers: {
            authorization: "Bearer token",
            "content-type": "application/json",
          },
        },
      },
    },
    {
      name: "Role-Based Access",
      description: "Check user role",
      expression: 'user.role in ["admin", "moderator"] && user.active == true',
      context: {
        user: { role: "admin", active: true },
      },
    },
    {
      name: "Rate Limiting",
      description: "Rate limit by time window",
      expression: "request.count < 100 && request.window < duration('1h')",
      context: {
        request: { count: 50, window: "30m" },
      },
    },
    {
      name: "JWT Claims",
      description: "Validate JWT claims",
      expression: 'jwt.claims.sub == "user123" && jwt.claims.exp > now()',
      context: {
        jwt: {
          claims: { sub: "user123", exp: 1735689600 },
        },
      },
    },
  ];

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const evaluationPromise = (async () => {
      // Validate JSON context
      JSON.parse(context);

      // Mock CEL evaluation - will be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock result
      const mockResult = {
        result: true,
        type: "bool",
        duration: "12ms",
        expression,
      };

      return mockResult;
    })();

    toast
      .promise(evaluationPromise, {
        loading: "Evaluating expression...",
        success: "Expression evaluated successfully",
        error: (err) => err.message || "Evaluation failed",
      })
      .then((mockResult) => {
        setResult(JSON.stringify(mockResult, null, 2));
      })
      .catch((err: any) => {
        setError(err.message || "Failed to evaluate expression");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadTemplate = (template: (typeof templates)[0]) => {
    setExpression(template.expression);
    setContext(JSON.stringify(template.context, null, 2));
    setResult(null);
    setError(null);
  };

  return (
    <Container>
      <h1>CEL Playground</h1>

      <StyledAlert
        message="Common Expression Language (CEL)"
        description="Test CEL expressions used for policy evaluation, routing decisions, and request validation. CEL provides a simple, fast, and safe way to evaluate expressions."
        type="info"
        showIcon
        closable
      />

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <EditorCard>
              <EditorHeader>
                <strong>CEL Expression</strong>
                <Select
                  placeholder="Load template..."
                  style={{ width: 200 }}
                  onChange={(value) => {
                    const template = templates[parseInt(value)];
                    if (template) loadTemplate(template);
                  }}
                >
                  {templates.map((template, index) => (
                    <Select.Option key={index} value={index.toString()}>
                      {template.name}
                    </Select.Option>
                  ))}
                </Select>
              </EditorHeader>
              <EditorContent>
                <CodeInput
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  rows={4}
                  placeholder="Enter CEL expression..."
                />
              </EditorContent>
            </EditorCard>

            <EditorCard>
              <EditorHeader>
                <strong>Context (JSON)</strong>
              </EditorHeader>
              <EditorContent>
                <CodeInput
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={12}
                  placeholder='{"request": {...}, "user": {...}}'
                />
              </EditorContent>
            </EditorCard>

            <Button
              type="primary"
              size="large"
              icon={<PlayCircle size={20} />}
              onClick={handleEvaluate}
              loading={loading}
              block
            >
              Evaluate Expression
            </Button>

            {error && (
              <StyledAlert
                message="Evaluation Error"
                description={error}
                type="error"
                showIcon
              />
            )}

            {result && (
              <EditorCard>
                <EditorHeader>
                  <strong>Result</strong>
                </EditorHeader>
                <EditorContent>
                  <ResultContainer>{result}</ResultContainer>
                </EditorContent>
              </EditorCard>
            )}
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Expression Templates">
            <TemplateList>
              {templates.map((template, index) => (
                <TemplateItem
                  key={index}
                  onClick={() => loadTemplate(template)}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    {template.description}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontFamily: "Monaco, monospace",
                      marginTop: 8,
                      color: "var(--color-primary)",
                    }}
                  >
                    {template.expression.length > 50
                      ? template.expression.substring(0, 50) + "..."
                      : template.expression}
                  </div>
                </TemplateItem>
              ))}
            </TemplateList>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
