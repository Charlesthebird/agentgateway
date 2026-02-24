import styled from "@emotion/styled";
import { Alert } from "antd";

/**
 * Styled Alert component that works well in both light and dark modes
 */
export const StyledAlert = styled(Alert)`
  &.ant-alert {
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-base);
    border-radius: var(--border-radius-lg);
    color: var(--color-text-base);
    
    .ant-alert-message {
      color: var(--color-text-base);
    }
    
    .ant-alert-description {
      color: var(--color-text-secondary);
    }
  }

  /* Success Alert */
  &.ant-alert-success {
    background-color: rgba(82, 196, 26, 0.1);
    border-color: var(--color-success);
    
    .ant-alert-icon {
      color: var(--color-success);
    }
  }

  /* Error Alert */
  &.ant-alert-error {
    background-color: rgba(255, 77, 79, 0.1);
    border-color: var(--color-error);
    
    .ant-alert-icon {
      color: var(--color-error);
    }
  }

  /* Warning Alert */
  &.ant-alert-warning {
    background-color: rgba(250, 173, 20, 0.1);
    border-color: var(--color-warning);
    
    .ant-alert-icon {
      color: var(--color-warning);
    }
  }

  /* Info Alert */
  &.ant-alert-info {
    background-color: rgba(22, 119, 255, 0.1);
    border-color: var(--color-info);
    
    .ant-alert-icon {
      color: var(--color-info);
    }
  }

  /* Dark mode adjustments */
  [data-theme="dark"] & {
    &.ant-alert-success {
      background-color: rgba(82, 196, 26, 0.15);
    }

    &.ant-alert-error {
      background-color: rgba(255, 77, 79, 0.15);
    }

    &.ant-alert-warning {
      background-color: rgba(250, 173, 20, 0.15);
    }

    &.ant-alert-info {
      background-color: rgba(22, 119, 255, 0.15);
    }
  }
`;
