import type { ObjectFieldTemplateProps } from "@rjsf/utils";
import { Collapse, Typography } from "antd";
import { useMemo } from "react";

const { Panel } = Collapse;
const { Title } = Typography;

// Maximum nesting level before we stop indenting further
const MAX_NESTING_LEVEL = 2;

/**
 * Custom ObjectFieldTemplate that automatically collapses optional/advanced fields
 * into expandable sections for cleaner form layout.
 */
export function CollapsibleObjectFieldTemplate(
  props: ObjectFieldTemplateProps,
) {
  const { title, description, properties, required = [], uiSchema } = props;

  // Track nesting level to limit indentation
  const nestingLevel = (uiSchema?.["ui:nestingLevel"] as number) || 0;
  const effectiveNestingLevel = Math.min(nestingLevel, MAX_NESTING_LEVEL);
  const leftPadding = effectiveNestingLevel * 12;

  // Store the section title for child fields to check against
  const sectionTitle = title?.toString() || "";

  // Categorize fields as required vs optional, and mark fields for label hiding
  const { requiredFields, optionalFields } = useMemo(() => {
    const req: typeof properties = [];
    const opt: typeof properties = [];

    const requiredArray: string[] = Array.isArray(required) ? required : [];

    // Check which field labels match the section title
    const sectionTitleLower = sectionTitle.toLowerCase().trim();

    properties.forEach((prop) => {
      // Clone the property to modify it
      const modifiedProp = { ...prop };

      // Check if this property should have its label hidden
      // We pass this info via a data attribute that the FieldTemplate can read
      const propNameLower = prop.name.toLowerCase().trim();
      if (sectionTitleLower && propNameLower === sectionTitleLower) {
        // Mark this property to hide its label by wrapping content with a marker
        modifiedProp.content = (
          <div data-hide-label="true" key={prop.name}>
            {prop.content}
          </div>
        );
      }

      if (requiredArray.includes(prop.name)) {
        req.push(modifiedProp);
      } else {
        opt.push(modifiedProp);
      }
    });

    return { requiredFields: req, optionalFields: opt };
  }, [properties, required, sectionTitle]);

  // Check if fields should be auto-collapsed based on naming patterns
  const shouldAutoCollapse = useMemo(() => {
    const advancedPatterns = ["advanced", "override", "optional", "extra"];
    const fieldName = title?.toLowerCase() || "";
    return advancedPatterns.some((pattern) => fieldName.includes(pattern));
  }, [title]);

  return (
    <div
      className="object-field-template"
      style={{ paddingLeft: `${leftPadding}px` }}
    >
      {title && (
        <Title level={5} style={{ marginBottom: 16 }}>
          {title}
        </Title>
      )}
      {description && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          {description}
        </Typography.Paragraph>
      )}

      {/* Render required fields first */}
      {requiredFields.length > 0 && (
        <div className="required-fields" style={{ marginBottom: 16 }}>
          {requiredFields.map((prop) => (
            <div key={prop.name}>{prop.content}</div>
          ))}
        </div>
      )}

      {/* Render optional fields in collapsible section if there are any */}
      {optionalFields.length > 0 && (
        <Collapse
          defaultActiveKey={shouldAutoCollapse ? [] : ["optional"]}
          ghost
          style={{ marginBottom: 16 }}
        >
          <Panel
            header={
              <Typography.Text strong>
                Advanced Options ({optionalFields.length})
              </Typography.Text>
            }
            key="optional"
          >
            {optionalFields.map((prop) => (
              <div key={prop.name} style={{ marginBottom: 8 }}>
                {prop.content}
              </div>
            ))}
          </Panel>
        </Collapse>
      )}
    </div>
  );
}
