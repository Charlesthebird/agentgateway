import { InfoCircleOutlined } from "@ant-design/icons";
import type { FieldTemplateProps } from "@rjsf/utils";
import { Form, Tooltip } from "antd";
import React from "react";

/**
 * Custom FieldTemplate that provides Ant Design Form.Item styling
 * and enhanced help text display. Uses vertical layout for long labels.
 */
export function FieldTemplate(props: FieldTemplateProps) {
  const {
    id,
    classNames,
    label,
    help,
    required,
    description,
    errors,
    children,
    schema,
    hidden,
  } = props;

  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  // Check if parent wrapper has data-hide-label attribute
  // This is set by CollapsibleObjectFieldTemplate when label matches section title
  const shouldHideLabel = React.useMemo(() => {
    if (!id) return false;

    try {
      // Try to find the wrapper div with data-hide-label
      const element = document.getElementById(id);
      if (element) {
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          if (parent.getAttribute("data-hide-label") === "true") {
            return true;
          }
          // Stop at form item level
          if (parent.classList.contains("ant-form-item")) {
            break;
          }
          parent = parent.parentElement;
        }
      }
    } catch {
      // If DOM query fails, don't hide label
      return false;
    }

    return false;
  }, [id]);

  // Build help text from description - handle string, ReactElement, or object
  let helpText = "";
  if (typeof description === "string") {
    helpText = description;
  } else if (typeof help === "string") {
    helpText = help;
  }

  // Check if field has a default value to show in help
  const hasDefault = schema.default !== undefined;
  const defaultValueHint = hasDefault
    ? ` (Default: ${JSON.stringify(schema.default)})`
    : "";

  // Handle errors array or ReactElement
  const errorList = (
    errors && typeof errors !== "string" && "props" in errors
      ? []
      : Array.isArray(errors)
        ? errors
        : errors
          ? [errors]
          : []
  ) as string[];
  const hasErrors = errorList.length > 0;

  // Determine if label is too long - use vertical layout for better readability
  const labelText = typeof label === "string" ? label : "";
  const isLongLabel = labelText.length > 12;

  // For long labels: full width (vertical), for short: default horizontal
  const layoutProps = isLongLabel
    ? { labelCol: { span: 24 }, wrapperCol: { span: 24 } }
    : {};

  // Don't show label if it matches parent section title
  const displayLabel = shouldHideLabel ? undefined : (
    <span>
      {label}
      {required && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
      {helpText && (
        <Tooltip title={helpText + defaultValueHint}>
          <InfoCircleOutlined
            style={{
              marginLeft: 8,
              color: "var(--color-text-tertiary)",
              cursor: "help",
            }}
          />
        </Tooltip>
      )}
    </span>
  );

  return (
    <Form.Item
      label={displayLabel}
      validateStatus={hasErrors ? "error" : undefined}
      help={hasErrors ? errorList : undefined}
      className={classNames}
      htmlFor={id}
      {...layoutProps}
    >
      {children}
    </Form.Item>
  );
}
