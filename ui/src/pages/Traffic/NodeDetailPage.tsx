import styled from "@emotion/styled";
import { Spin } from "antd";
import { useLocation, useOutletContext } from "react-router-dom";
import { NodeDetailView } from "./components/NodeDetailView";
import { NodeEditForm } from "./components/NodeEditForm";
import type { RoutingOutletContext } from "./TrafficRoutingPage";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const ContentArea = styled.div`
  padding: var(--spacing-xl);
  height: 100%;
  overflow-y: auto;
`;

const CenteredArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

// ---------------------------------------------------------------------------
// Component — purely renders detail view or edit form based on outlet context
// ---------------------------------------------------------------------------

export function NodeDetailPage() {
  const { target, isEditing, onSaved, onDeleted } =
    useOutletContext<RoutingOutletContext>();
  const location = useLocation();

  if (!target) {
    return (
      <CenteredArea>
        <Spin size="large" />
      </CenteredArea>
    );
  }

  return (
    <ContentArea>
      {isEditing ? (
        <NodeEditForm
          key={location.pathname}
          target={target}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      ) : (
        <NodeDetailView target={target} />
      )}
    </ContentArea>
  );
}
