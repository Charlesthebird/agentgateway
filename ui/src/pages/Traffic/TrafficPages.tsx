import styled from "@emotion/styled";
import { Card } from "antd";

export { TrafficRoutingPage } from "./TrafficRoutingPage";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
`;

export const TrafficOverviewPage = () => {
  return (
    <Container>
      <h1>Traffic Overview</h1>
      <Card>
        <p>Traffic overview and statistics</p>
      </Card>
    </Container>
  );
};

export const TrafficLogsPage = () => {
  return (
    <Container>
      <h1>Traffic Logs</h1>
      <Card>
        <p>View traffic logs (TODO: Implement backend)</p>
      </Card>
    </Container>
  );
};

export const TrafficMetricsPage = () => {
  return (
    <Container>
      <h1>Traffic Metrics</h1>
      <Card>
        <p>View traffic metrics (TODO: Implement backend)</p>
      </Card>
    </Container>
  );
};
