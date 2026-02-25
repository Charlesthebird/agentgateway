/**
 * RelationshipWidget — custom RJSF widget that populates Select options
 * from live config data (backends, policies, listeners).
 *
 * Usage in uiSchema:
 *   "backendRef": {
 *     "ui:widget": "RelationshipWidget",
 *     "ui:options": { "relationshipType": "backend" }
 *   }
 *
 * Supported relationshipType values: "backend" | "policy" | "listener"
 */
import type { WidgetProps } from "@rjsf/utils";
import { Select, Tag } from "antd";
import type { RoutingHierarchy } from "../hooks/useRoutingHierarchy";
import { useRoutingHierarchyContext } from "./RoutingHierarchyContext";

type RelationshipType = "backend" | "policy" | "listener";

const COLOR_MAP: Record<RelationshipType, string> = {
  backend: "blue",
  policy: "purple",
  listener: "green",
};

function buildOptions(
  relationshipType: RelationshipType,
  context: RoutingHierarchy | null,
) {
  if (!context) return [];

  switch (relationshipType) {
    case "backend":
      return (context.topLevelBackends ?? []).map(
        (b: { name: string; host: string }) => ({
          label: (
            <span>
              {b.name}
              <Tag
                color={COLOR_MAP.backend}
                style={{ marginLeft: 6, fontSize: 11 }}
              >
                {b.host}
              </Tag>
            </span>
          ),
          value: b.name,
        }),
      );

    case "policy":
      return (context.topLevelPolicies ?? []).map((p) => ({
        label: <span>{p.name.name ?? "(unnamed policy)"}</span>,
        value: p.name.name ?? "",
      }));

    case "listener": {
      const listeners: Array<{ name?: string | null; port: number }> = [];
      for (const bindNode of context.binds ?? []) {
        for (const ln of bindNode.listeners ?? []) {
          listeners.push({
            name: ln.listener?.name,
            port: bindNode.bind?.port,
          });
        }
      }
      return listeners.map((l) => ({
        label: (
          <span>
            {l.name ?? "(unnamed)"}
            <Tag
              color={COLOR_MAP.listener}
              style={{ marginLeft: 6, fontSize: 11 }}
            >
              :{l.port}
            </Tag>
          </span>
        ),
        value: l.name ?? "",
      }));
    }

    default:
      return [];
  }
}

export function RelationshipWidget(props: WidgetProps) {
  const { value, onChange, disabled, readonly, options } = props;
  const relationshipType = ((options as { relationshipType?: string })
    ?.relationshipType ?? "backend") as RelationshipType;

  const hierarchy = useRoutingHierarchyContext();
  const selectOptions = buildOptions(relationshipType, hierarchy);

  const handleChange = (val: string) => {
    onChange(val);
  };

  return (
    <Select
      style={{ width: "100%" }}
      value={value ?? undefined}
      onChange={handleChange}
      disabled={disabled || readonly}
      allowClear
      showSearch
      optionFilterProp="value"
      placeholder={`Select ${relationshipType}…`}
      options={selectOptions}
      notFoundContent={
        <span style={{ color: "var(--color-text-secondary)", padding: 8 }}>
          No {relationshipType}s defined yet
        </span>
      }
    />
  );
}
