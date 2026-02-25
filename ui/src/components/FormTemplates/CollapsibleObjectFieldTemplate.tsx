import type { ObjectFieldTemplateProps } from "@rjsf/utils";
import { Collapse, Typography } from "antd";
import { useMemo } from "react";
import { HideLabelContext } from "./HideLabelContext";

const { Title } = Typography;

// Maximum nesting level before we stop indenting further
const MAX_NESTING_LEVEL = 2;

// Only use the collapsible "Advanced Options" panel when there are enough
// optional fields to warrant it. For small forms (e.g. individual oneOf
// sub-schemas) collapsing is more confusing than helpful.
const MIN_OPTIONAL_FOR_COLLAPSE = 3;

/**
 * Custom ObjectFieldTemplate that:
 * - Renders required fields at the top, always visible.
 * - Collapses optional fields into an expandable "Advanced Options" panel
 *   (only when there are enough of them to justify it).
 * - Provides HideLabelContext so FieldTemplate can suppress labels that
 *   duplicate the parent section title.
 */
export function CollapsibleObjectFieldTemplate(
  props: ObjectFieldTemplateProps,
) {
  const {
    title,
    description,
    properties,
    required = [],
    uiSchema,
    idSchema,
  } = props;

  // Track nesting level to limit indentation
  const nestingLevel = (uiSchema?.["ui:nestingLevel"] as number) || 0;
  const effectiveNestingLevel = Math.min(nestingLevel, MAX_NESTING_LEVEL);
  const leftPadding = effectiveNestingLevel * 12;

  const sectionTitle = title?.toString() || "";
  const sectionTitleLower = sectionTitle.toLowerCase().trim();

  // Compute the set of field IDs whose labels duplicate the section title.
  const idsToHideLabel = useMemo(() => {
    const ids = new Set<string>();
    if (!sectionTitleLower) return ids;
    for (const prop of properties) {
      if (prop.name.toLowerCase().trim() === sectionTitleLower) {
        const s = (idSchema as Record<string, { $id: string }>)[prop.name];
        if (s?.$id) ids.add(s.$id);
      }
    }
    return ids;
  }, [properties, sectionTitleLower, idSchema]);

  // Categorize fields as required vs optional
  const { requiredFields, optionalFields } = useMemo(() => {
    const req: typeof properties = [];
    const opt: typeof properties = [];
    const requiredArray: string[] = Array.isArray(required) ? required : [];
    for (const prop of properties) {
      if (requiredArray.includes(prop.name)) {
        req.push(prop);
      } else {
        opt.push(prop);
      }
    }
    return { requiredFields: req, optionalFields: opt };
  }, [properties, required]);

  // Use the collapsible panel only when the field count justifies it and the
  // section name doesn't match "advanced" patterns (auto-collapse those).
  const useCollapse = optionalFields.length >= MIN_OPTIONAL_FOR_COLLAPSE;

  const shouldAutoCollapse = useMemo(() => {
    const advancedPatterns = ["advanced", "override", "optional", "extra"];
    const fieldName = title?.toLowerCase() || "";
    return advancedPatterns.some((pattern) => fieldName.includes(pattern));
  }, [title]);

  return (
    <HideLabelContext.Provider value={idsToHideLabel}>
      <div
        className="object-field-template"
        style={{ paddingLeft: `${leftPadding}px` }}
      >
        {title && (
          <Title level={5} style={{ marginBottom: 12, marginTop: 4 }}>
            {title}
          </Title>
        )}
        {description && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            {description}
          </Typography.Paragraph>
        )}

        {/* Required fields – always visible */}
        {requiredFields.length > 0 && (
          <div className="required-fields">
            {requiredFields.map((prop) => (
              <div key={prop.name}>{prop.content}</div>
            ))}
          </div>
        )}

        {/* Optional fields */}
        {optionalFields.length > 0 &&
          (useCollapse ? (
            <Collapse
              defaultActiveKey={shouldAutoCollapse ? [] : ["optional"]}
              ghost
              style={{ marginTop: 8 }}
              items={[
                {
                  key: "optional",
                  label: (
                    <Typography.Text strong>
                      Advanced Options ({optionalFields.length})
                    </Typography.Text>
                  ),
                  children: optionalFields.map((prop) => (
                    <div key={prop.name} style={{ marginBottom: 4 }}>
                      {prop.content}
                    </div>
                  )),
                },
              ]}
            />
          ) : (
            <div className="optional-fields" style={{ marginTop: 4 }}>
              {optionalFields.map((prop) => (
                <div key={prop.name}>{prop.content}</div>
              ))}
            </div>
          ))}
      </div>
    </HideLabelContext.Provider>
  );
}
