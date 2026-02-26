import { Drawer, Space, Tag, Typography } from "antd";
import type { EditTarget } from "./HierarchyTree";
import { NodeEditForm } from "./NodeEditForm";
import { NODE_LABELS } from "./nodeEditUtils";

export type { SchemaCategory } from "./nodeEditUtils";

const { Text } = Typography;

interface NodeEditDrawerProps {
  target: EditTarget | null;
  onClose: () => void;
  onSaved: () => void;
  /** Called after a successful delete (in addition to onClose). Defaults to onSaved. */
  onDeleted?: () => void;
}

export function NodeEditDrawer({
  target,
  onClose,
  onSaved,
  onDeleted,
}: NodeEditDrawerProps) {
  const nodeLabel = target ? NODE_LABELS[target.type] : "";
  const itemName =
    (target?.initialData?.["name"] as string | undefined) ??
    (target?.type === "bind" ? `Port ${target.bindPort}` : null);

  const title = target
    ? target.isNew
      ? `New ${nodeLabel}`
      : `Edit ${nodeLabel}${itemName ? `: ${itemName}` : ""}`
    : "";

  return (
    <Drawer
      title={
        <Space>
          <Text strong>{title}</Text>
          {target && (
            <Tag color="default" style={{ fontSize: 11 }}>
              port {target.bindPort}
            </Tag>
          )}
        </Space>
      }
      open={!!target}
      onClose={onClose}
      width="min(92vw, 1040px)"
      destroyOnClose
    >
      {target && (
        <NodeEditForm
          target={target}
          onSaved={() => {
            onSaved();
            onClose();
          }}
          onDeleted={() => {
            onClose();
            (onDeleted ?? onSaved)();
          }}
        />
      )}
    </Drawer>
  );
}
