/**
 * Custom OneOfField
 *
 * Replaces the default RJSF tab/select switcher with a compact Radio.Group.
 * When the user picks a different option the form data is sanitised (compatible
 * fields preserved) via `schemaUtils.sanitizeDataForNewSchema`.
 *
 * The sub-schema is rendered via `registry.fields.SchemaField` so all existing
 * templates (ObjectFieldTemplate, FieldTemplate, …) continue to apply.
 */
import type { FieldProps, RJSFSchema } from "@rjsf/utils";
import { Radio, Space } from "antd";
import { useState } from "react";

export function OneOfField(props: FieldProps) {
  const {
    schema,
    formData,
    onChange,
    registry,
    idSchema,
    uiSchema,
    disabled,
    readonly,
    errorSchema,
    required,
    onBlur,
    onFocus,
  } = props;

  const options = (schema.oneOf ?? []) as RJSFSchema[];
  const { schemaUtils, fields } = registry;

  // Determine which oneOf option currently matches formData.
  const initialIndex = Math.max(
    0,
    schemaUtils.getFirstMatchingOption(formData, options),
  );
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const handleSelect = (newIndex: number) => {
    if (newIndex === selectedIndex) return;
    const prevSchema = (options[selectedIndex] ?? {}) as RJSFSchema;
    const nextSchema = (options[newIndex] ?? {}) as RJSFSchema;
    // Preserve compatible fields when switching between options.
    const sanitized = schemaUtils.sanitizeDataForNewSchema(
      nextSchema,
      prevSchema,
      formData,
    );
    setSelectedIndex(newIndex);
    onChange(sanitized);
  };

  // Resolve any $refs in the selected sub-schema.
  const resolvedSchema = schemaUtils.retrieveSchema(
    (options[selectedIndex] ?? {}) as RJSFSchema,
    formData,
  );

  // Strip the title from the resolved sub-schema – the radio button already
  // communicates the selection, so the section heading would be redundant.
  const schemaForField: RJSFSchema = { ...resolvedSchema, title: "" };

  const SchemaField = fields.SchemaField as React.ComponentType<FieldProps>;

  const hasMultipleOptions = options.length > 1;

  // Check whether the resolved sub-schema has any renderable content.
  const hasProperties =
    resolvedSchema.type === "object" &&
    Object.keys(resolvedSchema.properties ?? {}).length > 0;
  const isScalar =
    resolvedSchema.type === "string" ||
    resolvedSchema.type === "number" ||
    resolvedSchema.type === "integer" ||
    resolvedSchema.type === "boolean";
  const hasContent = hasProperties || isScalar || !!resolvedSchema.$ref;

  return (
    <div>
      {hasMultipleOptions && (
        <Radio.Group
          value={selectedIndex}
          onChange={(e) => handleSelect(Number(e.target.value))}
          disabled={disabled || readonly}
          style={{ marginBottom: hasContent ? 8 : 0 }}
        >
          <Space wrap>
            {options.map((opt, i) => (
              <Radio key={i} value={i}>
                {(opt as RJSFSchema).title ?? `Option ${i + 1}`}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      )}

      {hasContent && SchemaField && (
        <div style={{ paddingTop: hasMultipleOptions ? 4 : 0 }}>
          <SchemaField
            {...props}
            schema={schemaForField}
            idSchema={idSchema}
            formData={formData}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            errorSchema={errorSchema}
            uiSchema={uiSchema ?? {}}
            required={required}
          />
        </div>
      )}
    </div>
  );
}
