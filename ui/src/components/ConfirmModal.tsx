import { Modal } from "antd";
import type { ReactNode } from "react";

interface ConfirmModalProps {
  title: string;
  content: ReactNode;
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
  danger?: boolean;
}

export const ConfirmModal = ({
  title,
  content,
  open,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmLoading = false,
  danger = false,
}: ConfirmModalProps) => {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{
        danger,
        loading: confirmLoading,
      }}
      confirmLoading={confirmLoading}
    >
      {content}
    </Modal>
  );
};
