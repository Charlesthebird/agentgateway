import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import Form from "@rjsf/antd";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import {
  Button,
  Drawer,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { StyledAlert } from "../../../components/StyledAlert";
import { fetchConfig, updateConfig } from "../../../api/config";
import { cleanupConfig, stripFormDefaults } from "../../../api/helpers";
import type { LocalBind, LocalConfig } from "../../../api/types";
import type {
  ExclusiveFormContext,
  ExclusiveGroup as ExclusiveGroupType,
} from "../../../components/FormTemplates";
import {
  AnyOfField,
  ArrayFieldTemplate,
  ExclusiveObjectFieldTemplate,
  FieldTemplate,
  OneOfField,
} from "../../../components/FormTemplates";
import { validator } from "../../../utils/validator";
import type { EditTarget, NodeType } from "./HierarchyTree";
import { NodeDetailView } from "./NodeDetailView";
import { RelationshipWidget } from "./RelationshipWidget";

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

const NODE_LABELS: Record<NodeType, string> = {
  bind: "Bind",
  listener: "Listener",
  route: "Route",
};

const SCHEMA_TYPE_MAP: Record<
  "listeners" | "routes" | "tcpRoutes" | "backends",
  string
> = {
  listeners: "LocalListener",
  routes: "LocalRoute",
  tcpRoutes: "LocalTCPRoute",
  backends: "LocalBind",
};

/** Maps schema category to the public schema-forms subfolder name. */
const SCHEMA_FOLDER_MAP: Record<
  "listeners" | "routes" | "tcpRoutes" | "backends",
  string
> = {
  listeners: "listeners",
  routes: "routes",
  tcpRoutes: "routes",
  backends: "backends",
};

// ---------------------------------------------------------------------------
// Mutual exclusion groups
// Fields within a group are mutually exclusive — only one may be set at a time.
// These are not encoded in JSON Schema (they're Rust-side constraints), so we
// define them here and render radio buttons + hide the inactive fields.
// ---------------------------------------------------------------------------

interface ExclusiveOption {
  /** The formData key this option controls */
  fieldKey: string;
  /** Human-readable button label */
  label: string;
}

interface ExclusiveGroup extends ExclusiveGroupType {
  options: ExclusiveOption[];
}

const MUTUAL_EXCLUSIVE_GROUPS: Partial<
  Record<"listeners" | "routes" | "tcpRoutes" | "backends", ExclusiveGroup[]>
> = {
  listeners: [
    {
      groupLabel: "Route type",
      defaultKey: "routes",
      options: [
        { fieldKey: "routes", label: "HTTP / HTTPS routes" },
        { fieldKey: "tcpRoutes", label: "TCP routes" },
      ],
    },
  ],
};

/** Pick the initially-active key for a group from existing formData. */
function detectActiveKey(
  group: ExclusiveGroup,
  formData: Record<string, unknown> | null,
): string {
  if (!formData) return group.defaultKey;
  for (const opt of group.options) {
    const v = formData[opt.fieldKey];
    if (Array.isArray(v) && v.length > 0) return opt.fieldKey;
    if (v !== null && v !== undefined && !Array.isArray(v)) return opt.fieldKey;
  }
  return group.defaultKey;
}

// ---------------------------------------------------------------------------
// Config patching helpers
// ---------------------------------------------------------------------------

async function applyEdit(
  target: EditTarget,
  rawFormData: Record<string, unknown>,
  keepTopLevelKeys?: ReadonlySet<string>,
): Promise<void> {
  // Strip null values and empty arrays that RJSF injects for optional fields,
  // but preserve any keys in keepTopLevelKeys (active oneOf fields must be
  // present even when the array is empty).
  const formData = (stripFormDefaults(rawFormData, keepTopLevelKeys) ??
    {}) as Record<string, unknown>;
  const config = await fetchConfig();
  const newConfig = { ...config, binds: [...(config.binds ?? [])] };

  const bindIdx = newConfig.binds.findIndex((b) => b.port === target.bindPort);

  if (target.type === "bind") {
    if (target.isNew) {
      // Create a new bind
      newConfig.binds.push(formData as unknown as LocalBind);
    } else {
      // Edit existing bind
      if (bindIdx === -1) throw new Error("Bind not found");
      newConfig.binds[bindIdx] = formData as unknown as LocalBind;
    }
  } else if (target.type === "listener") {
    if (target.isNew) {
      if (bindIdx === -1) {
        // Create a new bind with this listener
        newConfig.binds.push({ port: target.bindPort, listeners: [formData] });
      } else {
        const bind = { ...newConfig.binds[bindIdx] };
        bind.listeners = [...bind.listeners, formData];
        newConfig.binds[bindIdx] = bind;
      }
    } else {
      // Edit existing listener
      if (bindIdx === -1) throw new Error("Bind not found");
      const bind = { ...newConfig.binds[bindIdx] };
      bind.listeners = [...bind.listeners];
      bind.listeners[target.listenerIndex!] = formData;
      newConfig.binds[bindIdx] = bind;
    }
  } else if (target.type === "route") {
    if (bindIdx === -1) throw new Error("Bind not found");
    const bind = { ...newConfig.binds[bindIdx] };
    const listeners = [...bind.listeners];
    const listener = { ...listeners[target.listenerIndex!] };
    const isTcp = target.schemaCategory === "tcpRoutes";

    // Guard: routes and tcpRoutes are mutually exclusive on a listener.
    if (isTcp && (listener.routes?.length ?? 0) > 0) {
      throw new Error(
        "Cannot add a TCP route to a listener that already has HTTP routes. " +
          "Remove the existing HTTP routes first.",
      );
    }
    if (!isTcp && (listener.tcpRoutes?.length ?? 0) > 0) {
      throw new Error(
        "Cannot add an HTTP route to a listener that already has TCP routes. " +
          "Remove the existing TCP routes first.",
      );
    }

    if (isTcp) {
      const tcpRoutes = [...(listener.tcpRoutes ?? [])];
      if (target.isNew) {
        tcpRoutes.push(formData);
      } else {
        tcpRoutes[target.routeIndex!] = formData;
      }
      listener.tcpRoutes = tcpRoutes;
    } else {
      const routes = [...(listener.routes ?? [])];
      if (target.isNew) {
        routes.push(formData);
      } else {
        routes[target.routeIndex!] = formData;
      }
      listener.routes = routes;
    }

    listeners[target.listenerIndex!] = listener;
    bind.listeners = listeners;
    newConfig.binds[bindIdx] = bind;
  }

  await updateConfig(cleanupConfig(newConfig as LocalConfig));
}

async function applyDelete(target: EditTarget): Promise<void> {
  const config = await fetchConfig();
  const newConfig = { ...config, binds: [...(config.binds ?? [])] };
  const bindIdx = newConfig.binds.findIndex((b) => b.port === target.bindPort);
  if (bindIdx === -1) throw new Error("Bind not found");

  if (target.type === "bind") {
    // Delete the entire bind
    newConfig.binds.splice(bindIdx, 1);
  } else if (target.type === "listener") {
    const bind = { ...newConfig.binds[bindIdx] };
    bind.listeners = bind.listeners.filter(
      (_, i) => i !== target.listenerIndex,
    );
    newConfig.binds[bindIdx] = bind;
  } else if (target.type === "route") {
    const bind = { ...newConfig.binds[bindIdx] };
    const listeners = [...bind.listeners];
    const listener = { ...listeners[target.listenerIndex!] };
    if (target.schemaCategory === "tcpRoutes") {
      listener.tcpRoutes = (listener.tcpRoutes ?? []).filter(
        (_, i) => i !== target.routeIndex,
      );
    } else {
      listener.routes = (listener.routes ?? []).filter(
        (_, i) => i !== target.routeIndex,
      );
    }
    listeners[target.listenerIndex!] = listener;
    bind.listeners = listeners;
    newConfig.binds[bindIdx] = bind;
  }

  await updateConfig(cleanupConfig(newConfig as LocalConfig));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NodeEditDrawerProps {
  target: EditTarget | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NodeEditDrawer({
  target,
  onClose,
  onSaved,
}: NodeEditDrawerProps) {
  const [schema, setSchema] = useState<RJSFSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown> | null>(
    null,
  );
  // When opening an existing node, start in view (detail) mode.
  // New nodes go straight to edit mode.
  const [isEditing, setIsEditing] = useState(false);
  // Track which option is active for each exclusive group (indexed by groupLabel)
  const [activeGroupKeys, setActiveGroupKeys] = useState<
    Record<string, string>
  >({});

  // Load schema when target changes
  useEffect(() => {
    if (!target) return;
    setSchemaLoading(true);
    setSchemaError(null);
    const schemaType = SCHEMA_TYPE_MAP[target.schemaCategory];
    const schemaFolder = SCHEMA_FOLDER_MAP[target.schemaCategory];
    fetch(`/schema-forms/${schemaFolder}/${schemaType}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((s) => setSchema(s))
      .catch((e) => setSchemaError(e.message))
      .finally(() => setSchemaLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.schemaCategory, target?.type]);

  // Reset editing mode when target changes
  useEffect(() => {
    setIsEditing(target?.isNew ?? false);
  }, [target]);

  // Reset form data and active group keys when target changes
  useEffect(() => {
    const initial = target?.initialData ?? null;
    setFormData(initial);
    if (
      target?.schemaCategory &&
      target.schemaCategory in MUTUAL_EXCLUSIVE_GROUPS
    ) {
      const groups =
        MUTUAL_EXCLUSIVE_GROUPS[
          target.schemaCategory as keyof typeof MUTUAL_EXCLUSIVE_GROUPS
        ] ?? [];
      const keys: Record<string, string> = {};
      for (const group of groups) {
        keys[group.groupLabel] = detectActiveKey(group, initial);
      }
      setActiveGroupKeys(keys);
    } else {
      setActiveGroupKeys({});
    }
  }, [target]);

  /** Called when the user picks a different option inside an exclusive group. */
  const handleGroupKeyChange = (group: ExclusiveGroup, newKey: string) => {
    setActiveGroupKeys((prev) => ({ ...prev, [group.groupLabel]: newKey }));
    // Clear all inactive fields from formData so they won't be submitted
    setFormData((prev) => {
      const next = { ...(prev ?? {}) };
      for (const opt of group.options) {
        if (opt.fieldKey !== newKey) {
          delete next[opt.fieldKey];
        }
      }
      return next;
    });
  };

  /**
   * Build a uiSchema that hides inactive exclusive-group fields so the user
   * only sees and edits the active one.
   */
  const exclusiveGroupUiSchema = (): UiSchema => {
    if (!target?.schemaCategory) return {};
    const groups =
      MUTUAL_EXCLUSIVE_GROUPS[
        target.schemaCategory as keyof typeof MUTUAL_EXCLUSIVE_GROUPS
      ] ?? [];
    const ui: UiSchema = {};

    // Handle mutual exclusive groups (like routes vs tcpRoutes)
    for (const group of groups) {
      const activeKey = activeGroupKeys[group.groupLabel] ?? group.defaultKey;
      for (const opt of group.options) {
        if (opt.fieldKey !== activeKey) {
          ui[opt.fieldKey] = { "ui:widget": "hidden" };
        }
      }
    }

    return ui;
  };

  const activeGroups = target?.schemaCategory
    ? (MUTUAL_EXCLUSIVE_GROUPS[
        target.schemaCategory as keyof typeof MUTUAL_EXCLUSIVE_GROUPS
      ] ?? [])
    : [];

  const handleSubmit = async ({
    formData: fd,
  }: {
    formData?: Record<string, unknown>;
  }) => {
    if (!target || fd == null) return;
    // Build the set of active oneOf field keys so stripFormDefaults preserves
    // them even when empty (the API requires the active choice to be present).
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
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    setSaving(true);
    try {
      await applyDelete(target);
      toast.success(`${NODE_LABELS[target.type]} deleted`);
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const nodeLabel = target ? NODE_LABELS[target.type] : "";
  const itemName =
    (target?.initialData?.["name"] as string | undefined) ??
    (target?.type === "bind" ? `Port ${target.bindPort}` : null);

  const title = target
    ? target.isNew
      ? `New ${nodeLabel}`
      : isEditing
        ? `Edit ${nodeLabel}${itemName ? `: ${itemName}` : ""}`
        : `${nodeLabel}${itemName ? `: ${itemName}` : ""}`
    : "";

  const deleteButton = target && !target.isNew ? (
    <Popconfirm
      title={`Delete this ${NODE_LABELS[target.type]}?`}
      description="This cannot be undone."
      onConfirm={handleDelete}
      okText="Delete"
      okButtonProps={{ danger: true }}
    >
      <Button danger icon={<DeleteOutlined />} size="small">
        Delete
      </Button>
    </Popconfirm>
  ) : null;

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
      extra={
        <Space size="small">
          {!isEditing && !target?.isNew && target && (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
          {deleteButton}
        </Space>
      }
    >
      {/* Detail (view) mode */}
      {target && !isEditing && !target.isNew && (
        <>
          <NodeDetailView target={target} />
          <Button
            icon={<EditOutlined />}
            onClick={() => setIsEditing(true)}
            style={{ marginTop: 24 }}
            block
          >
            Edit {nodeLabel}
          </Button>
        </>
      )}

      {/* Edit / create mode */}
      {(isEditing || target?.isNew) && (
        <>
          {schemaLoading && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          )}

          {schemaError && (
            <StyledAlert
              type="error"
              message="Failed to load form schema"
              description={schemaError}
              showIcon
            />
          )}

          {!schemaLoading && !schemaError && schema && (
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
              widgets={{ RelationshipWidget }}
              fields={{
                OneOfField,
                AnyOfField,
              }}
              templates={{
                ObjectFieldTemplate: ExclusiveObjectFieldTemplate,
                FieldTemplate,
                ArrayFieldTemplate,
              }}
              showErrorList="top"
              disabled={saving}
            >
              <Space style={{ marginTop: 16, width: "100%" }}>
                {!target?.isNew && (
                  <Button onClick={() => setIsEditing(false)} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  style={{ flex: 1 }}
                  block={!!target?.isNew}
                >
                  {target?.isNew ? "Create" : "Save Changes"}
                </Button>
              </Space>
            </Form>
          )}
        </>
      )}
    </Drawer>
  );
}
