import { DeleteOutlined } from "@ant-design/icons";
import Form from "@rjsf/antd";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { Button, Popconfirm, Space, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ExclusiveFormContext } from "../../../components/FormTemplates";
import {
  AnyOfField,
  ArrayFieldTemplate,
  ExclusiveObjectFieldTemplate,
  FieldTemplate,
  OneOfField,
  SelectWidget,
} from "../../../components/FormTemplates";
import { StyledAlert } from "../../../components/StyledAlert";
import { validator } from "../../../utils/validator";
import type { EditTarget } from "./HierarchyTree";
import { RelationshipWidget } from "./RelationshipWidget";
import {
  CHILD_FIELDS_TO_HIDE,
  MUTUAL_EXCLUSIVE_GROUPS,
  NODE_LABELS,
  SCHEMA_FOLDER_MAP,
  SCHEMA_TYPE_MAP,
  applyDelete,
  applyEdit,
  detectActiveKey,
  extractErrorMessage,
} from "./nodeEditUtils";
import type { ExclusiveGroup } from "./nodeEditUtils";

interface NodeEditFormProps {
  target: EditTarget;
  /** Called after a successful save. */
  onSaved: () => void;
  /** Called when Cancel is clicked (inline edit mode). Omit to hide Cancel. */
  onCancel?: () => void;
  /** Called after a successful delete. Defaults to onSaved if omitted. */
  onDeleted?: () => void;
}

export function NodeEditForm({
  target,
  onSaved,
  onCancel,
  onDeleted,
}: NodeEditFormProps) {
  const [rawSchema, setRawSchema] = useState<RJSFSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Strip child collection fields from the schema so the user can't edit them
  // inline; they're managed via the hierarchy tree Add buttons instead.
  const schema = useMemo((): RJSFSchema | null => {
    if (!rawSchema) return null;
    const childFields =
      CHILD_FIELDS_TO_HIDE[
        target.schemaCategory as keyof typeof CHILD_FIELDS_TO_HIDE
      ] ?? [];
    if (childFields.length === 0) return rawSchema;
    const properties = { ...(rawSchema.properties as Record<string, unknown>) };
    for (const f of childFields) delete properties[f];
    return {
      ...rawSchema,
      properties,
      required: ((rawSchema.required as string[] | undefined) ?? []).filter(
        (f) => !childFields.includes(f),
      ),
    };
  }, [rawSchema, target.schemaCategory]);
  const [saving, setSaving] = useState(false);

  // Strip child collection fields from the initial formData to match the
  // filtered schema — otherwise additionalProperties validation fires.
  const [formData, setFormData] = useState<Record<string, unknown> | null>(
    () => {
      const childFields =
        CHILD_FIELDS_TO_HIDE[
          target.schemaCategory as keyof typeof CHILD_FIELDS_TO_HIDE
        ] ?? [];
      if (childFields.length === 0) return target.initialData;
      const stripped = { ...target.initialData };
      for (const f of childFields) delete stripped[f];
      return stripped;
    },
  );
  const [activeGroupKeys, setActiveGroupKeys] = useState<
    Record<string, string>
  >(() => {
    const groups =
      MUTUAL_EXCLUSIVE_GROUPS[
        target.schemaCategory as keyof typeof MUTUAL_EXCLUSIVE_GROUPS
      ] ?? [];
    const keys: Record<string, string> = {};
    for (const group of groups) {
      keys[group.groupLabel] = detectActiveKey(group, target.initialData);
    }
    return keys;
  });

  useEffect(() => {
    setSchemaLoading(true);
    setSchemaError(null);
    const schemaType = SCHEMA_TYPE_MAP[target.schemaCategory];
    const schemaFolder = SCHEMA_FOLDER_MAP[target.schemaCategory];
    fetch(`/schema-forms/${schemaFolder}/${schemaType}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((s) => setRawSchema(s))
      .catch((e: unknown) =>
        setSchemaError(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => setSchemaLoading(false));
  }, [target.schemaCategory]);

  const handleGroupKeyChange = (group: ExclusiveGroup, newKey: string) => {
    setActiveGroupKeys((prev) => ({ ...prev, [group.groupLabel]: newKey }));
    setFormData((prev) => {
      const next = { ...(prev ?? {}) };
      for (const opt of group.options) {
        if (opt.fieldKey !== newKey) delete next[opt.fieldKey];
      }
      return next;
    });
  };

  const activeGroups =
    MUTUAL_EXCLUSIVE_GROUPS[
      target.schemaCategory as keyof typeof MUTUAL_EXCLUSIVE_GROUPS
    ] ?? [];

  const exclusiveGroupUiSchema = (): UiSchema => {
    const ui: UiSchema = {};
    for (const group of activeGroups) {
      const activeKey = activeGroupKeys[group.groupLabel] ?? group.defaultKey;
      for (const opt of group.options) {
        if (opt.fieldKey !== activeKey) {
          ui[opt.fieldKey] = { "ui:widget": "hidden" };
        }
      }
    }
    return ui;
  };

  const handleSubmit = async ({
    formData: fd,
  }: {
    formData?: Record<string, unknown>;
  }) => {
    if (fd == null) return;
    const keepKeys = new Set<string>();
    for (const group of activeGroups) {
      keepKeys.add(activeGroupKeys[group.groupLabel] ?? group.defaultKey);
    }
    setSaving(true);
    try {
      await applyEdit(target, fd, keepKeys.size > 0 ? keepKeys : undefined);
      toast.success(
        `${NODE_LABELS[target.type]} ${target.isNew ? "created" : "updated"} successfully`,
      );
      onSaved();
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e) ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await applyDelete(target);
      toast.success(`${NODE_LABELS[target.type]} deleted`);
      (onDeleted ?? onSaved)();
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e) ?? "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  if (schemaLoading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (schemaError) {
    return (
      <StyledAlert
        type="error"
        message="Failed to load form schema"
        description={schemaError}
        showIcon
      />
    );
  }

  if (!schema) return null;

  const deleteButton = !target.isNew ? (
    <Popconfirm
      title={`Delete this ${NODE_LABELS[target.type]}?`}
      description="This cannot be undone."
      onConfirm={handleDelete}
      okText="Delete"
      okButtonProps={{ danger: true }}
    >
      <Button danger icon={<DeleteOutlined />} disabled={saving}>
        Delete
      </Button>
    </Popconfirm>
  ) : null;

  return (
    <Form
      schema={schema}
      validator={validator}
      formData={formData}
      uiSchema={exclusiveGroupUiSchema()}
      formContext={
        {
          exclusiveGroups: activeGroups,
          activeGroupKeys,
          onGroupKeyChange: handleGroupKeyChange,
        } satisfies ExclusiveFormContext
      }
      onChange={({ formData: fd }) => setFormData(fd)}
      onSubmit={handleSubmit}
      onError={(errors) => {
        console.error("Form errors:", errors);
        if (errors.length > 0) {
          toast.error(
            `Form has ${errors.length} validation error${errors.length > 1 ? "s" : ""}`,
          );
        }
      }}
      widgets={{ RelationshipWidget, SelectWidget }}
      fields={{ OneOfField, AnyOfField }}
      templates={{
        ObjectFieldTemplate: ExclusiveObjectFieldTemplate,
        FieldTemplate,
        ArrayFieldTemplate,
      }}
      showErrorList="top"
      disabled={saving}
    >
      <Space
        style={{
          marginTop: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div>{deleteButton}</div>
        <Space>
          {onCancel && (
            <Button onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={saving}>
            {target.isNew ? "Create" : "Save Changes"}
          </Button>
        </Space>
      </Space>
    </Form>
  );
}
