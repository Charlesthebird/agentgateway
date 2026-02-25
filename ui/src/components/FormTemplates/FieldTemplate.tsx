import { InfoCircleOutlined } from "@ant-design/icons";
import type { FieldTemplateProps } from "@rjsf/utils";
import { Form, Tooltip } from "antd";
import { useContext } from "react";
import { HideLabelContext } from "./HideLabelContext";

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
    rawErrors,
    children,
    schema,
    hidden,
  } = props;

  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  // Context-based label hiding: CollapsibleObjectFieldTemplate marks field IDs
  // whose labels duplicate the section title so we skip rendering the label.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const hideLabelIds = useContext(HideLabelContext);
  const shouldHideLabel = hideLabelIds.has(id);

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

  const hasErrors = rawErrors && rawErrors.length > 0;

  // Determine if label is too long - use vertical layout for better readability
  const labelText = typeof label === "string" ? label : "";
  const isLongLabel = labelText.length > 12;

  // For long labels: full width (vertical), for short: default horizontal
  const layoutProps = isLongLabel
    ? { labelCol: { span: 24 }, wrapperCol: { span: 24 } }
    : {};

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
      help={hasErrors ? rawErrors : undefined}
      className={classNames}
      htmlFor={id}
      {...layoutProps}
    >
      {children}
    </Form.Item>
  );
}
