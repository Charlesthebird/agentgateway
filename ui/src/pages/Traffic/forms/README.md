# Traffic Manual Form Schemas

This folder contains **manually configured TypeScript form schemas** for the Traffic page. Unlike auto-generated schemas, these are handcrafted JSON Schema definitions that use TypeScript types from [config.d.ts](../../../config.d.ts) for type safety.

## Files

- **[bindForm.ts](./bindForm.ts)** - Schema for `LocalBind` (port bindings)
- **[listenerForm.ts](./listenerForm.ts)** - Schema for `LocalListener` (protocol listeners)
- **[routeForm.ts](./routeForm.ts)** - Schema for `LocalRoute` (HTTP routes)
- **[backendForm.ts](./backendForm.ts)** - Schema for `LocalRouteBackend` (service/host backends)
- **[index.ts](./index.ts)** - Exports and type definitions

## Schema Structure

Each form file exports:

### 1. JSON Schema

The main schema definition compatible with [React JSON Schema Form (RJSF)](https://rjsf-team.github.io/react-jsonschema-form/):

```typescript
import type { RJSFSchema } from "@rjsf/utils";

export const schema: RJSFSchema = {
  type: "object",
  properties: {
    // Manually defined fields
  },
};
```

### 2. UI Schema

Customizations for form rendering (placeholders, widgets, help text):

```typescript
import type { UiSchema } from "@rjsf/utils";

export const uiSchema: UiSchema = {
  fieldName: {
    "ui:placeholder": "Enter value...",
    "ui:widget": "select",
    "ui:help": "Additional help text",
  },
};
```

### 3. Default Values

Pre-filled values for new forms:

```typescript
import type { LocalListener } from "../../../config";

export const defaultValues: Partial<LocalListener> = {
  hostname: "*",
  protocol: "HTTP",
};
```

### 4. Type Guard

Runtime type checking:

```typescript
export function isLocalListener(data: unknown): data is LocalListener {
  return typeof data === "object" && data !== null;
}
```

## Example: Listener Form

```typescript
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalListener } from "../../../config";

export const schema: RJSFSchema = {
  type: "object",
  required: [],
  properties: {
    name: {
      type: "string",
      title: "Name",
      description: "Unique name for this listener",
    },
    hostname: {
      type: "string",
      title: "Hostname",
      default: "*",
    },
    protocol: {
      type: "string",
      enum: ["HTTP", "HTTPS", "TLS", "TCP", "HBONE"],
      default: "HTTP",
    },
  },
};

export const uiSchema: UiSchema = {
  name: {
    "ui:placeholder": "e.g., main-listener",
  },
  protocol: {
    "ui:widget": "select",
  },
};

export const defaultValues: Partial<LocalListener> = {
  hostname: "*",
  protocol: "HTTP",
};
```

## Using These Schemas

### In a Form Component

```typescript
import Form from "@rjsf/antd";
import { validator } from "../../../utils/validator";
import { forms } from "./forms";

function ListenerFormModal({ initialData, onSubmit }) {
  return (
    <Form
      schema={forms.listener.schema}
      uiSchema={forms.listener.uiSchema}
      formData={initialData ?? forms.listener.defaultValues}
      validator={validator}
      onSubmit={({ formData }) => onSubmit(formData)}
    />
  );
}
```

### With Type Safety

```typescript
import type { LocalListener } from "../../../config";
import { forms } from "./forms";

function handleSubmit(data: unknown) {
  if (forms.listener.isLocalListener(data)) {
    // TypeScript knows data is LocalListener here
    const listener: LocalListener = data;
    console.log(listener.protocol); // ✅ Type-safe access
  }
}
```

## Benefits of Manual Configuration

1. **Full Control** - Customize every aspect of the schema
2. **Type Safety** - Leverage TypeScript types from config.d.ts
3. **Educational** - Easy to understand and modify
4. **No Build Step** - No schema generation required
5. **Flexible Validation** - Add custom validation rules

## Maintenance

When types in [config.d.ts](../../../config.d.ts) change:

1. Update the corresponding schema in this folder
2. Update default values if needed
3. Update UI schema for new fields
4. Test the form with the new schema

**Tip**: Use your IDE's "Find References" to locate all schema usages.

## Schema Features

### Conditional Fields (Dependencies)

```typescript
dependencies: {
  protocol: {
    oneOf: [
      {
        properties: { protocol: { enum: ["HTTP"] } },
      },
      {
        properties: {
          protocol: { enum: ["HTTPS"] },
          tls: { /* TLS config required */ },
        },
        required: ["tls"],
      },
    ],
  },
}
```

### Union Types (oneOf)

```typescript
oneOf: [
  {
    title: "Service Backend",
    properties: {
      service: {
        /* service config */
      },
    },
  },
  {
    title: "Host Backend",
    properties: {
      host: { type: "string" },
    },
  },
];
```

### Arrays

```typescript
hostnames: {
  type: "array",
  items: {
    type: "string",
  },
}
```

### Nested Objects

```typescript
tls: {
  type: "object",
  properties: {
    cert: { type: "string" },
    key: { type: "string" },
  },
  required: ["cert", "key"],
}
```

## UI Schema Options

### Widgets

- `"ui:widget": "select"` - Dropdown
- `"ui:widget": "textarea"` - Multi-line text
- `"ui:widget": "updown"` - Number input with arrows
- `"ui:widget": "radio"` - Radio buttons

### Arrays

```typescript
"ui:options": {
  orderable: true,   // Enable drag-to-reorder
  addable: true,     // Show "Add" button
  removable: true,   // Show "Remove" buttons
}
```

### Field Order

```typescript
"ui:order": ["name", "protocol", "hostname", "*"]
```

### Help Text

```typescript
"ui:placeholder": "Enter value...",
"ui:help": "Additional guidance for users",
```

## Comparison with Generated Schemas

| Aspect        | Manual (Traffic)           | Generated (Traffic)             |
| ------------- | -------------------------- | ------------------------------- |
| Source        | Handcrafted                | Auto-generated from config.json |
| Location      | `src/pages/Traffic/forms/` | `public/schema-forms/`          |
| Type Safety   | Compile-time               | Runtime only                    |
| Maintenance   | Manual updates             | Automatic sync                  |
| Flexibility   | High                       | Limited                         |
| Customization | Full control               | Generator constraints           |

## Resources

- [React JSON Schema Form Docs](https://rjsf-team.github.io/react-jsonschema-form/)
- [JSON Schema Specification](https://json-schema.org/)
- [Ant Design Form Widgets](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/widgets/)
- [UI Schema Reference](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema)

---

**Last Updated**: 2026-03-03
**Purpose**: Manual TypeScript form schemas for Traffic page
**Related**: [Traffic README](../README.md)
