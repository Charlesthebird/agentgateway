# Traffic2 Implementation

Traffic management page at `/traffic2` with TypeScript forms.

## Overview

**Route**: `/traffic2` (Sidebar: Traffic → Routing (TS Forms))

**Resources**: Listeners, Routes, Backends, Policies

## Features

- **TypeScript Forms** - Typed with `config.d.ts`, compile-time safety
- **Full-Page Forms** - Create/edit on separate routes, not modals
- **Real API** - Uses `fetchConfig`/`updateConfig`, SWR auto-refresh
- **Dark Mode** - Properly styled

## Structure

```
ui/src/pages/Traffic2/
├── Traffic2Page.tsx       # List view (tabs + tables)
├── ResourceFormPage.tsx   # Form page (create/edit)
├── api.ts                 # CRUD helpers
└── forms/
    ├── listenerForm.ts    # import type { LocalListener }
    ├── routeForm.ts       # import type { LocalRoute }
    ├── backendForm.ts     # import type { LocalRouteBackend }
    ├── policyForm.ts      # import type { FilterOrPolicy }
    └── index.ts
```

## Adding a Form

1. Create `forms/myForm.ts`:
```typescript
import type { MyType } from "../../../config";
export const schema = { /* JSON Schema */ };
export const uiSchema = { /* UI */ };
export const defaultValues: Partial<MyType> = { /* defaults */ };
```

2. Export in `forms/index.ts`:
```typescript
import * as myForm from "./myForm";
export const forms = { ...existing, my: myForm };
export const resourceLabels = { my: { singular: "My", plural: "Mys" } };
```
export const forms = {
  listener: listenerForm,
  route: routeForm,
  backend: backendForm,
  policy: policyForm,
};

export type ResourceType = keyof typeof forms;

export const resourceLabels: Record<ResourceType, {...}> = {...};
```

### Page Component Flow

1. User selects a resource type tab (Listener, Route, Backend, Policy)
2. Table displays existing resources for that type
3. User clicks "Create" or "Edit" button
4. Modal opens with the appropriate form
5. Form validates on submit
6. Data is saved (currently mock, ready for API integration)
7. Table refreshes with updated data

## Usage

### Accessing the Page

1. Navigate to `/traffic2` in the browser
2. Or click **Traffic → Routing (TS Forms)** in the sidebar

### Creating a Resource

1. Select the resource type tab
2. Click "Create {Resource Type}" button
3. Fill out the form
4. Click "Create" to save

### Editing a Resource

1. Find the resource in the table
2. Click the "Edit" button
3. Modify the form fields
4. Click "Save Changes"

### Deleting a Resource

1. Find the resource in the table
2. Click the "Delete" button
3. Confirm the deletion in the dialog

## Adding New Forms

### Step 1: Create the Form File

```typescript
// ui/src/forms/myResourceForm.ts
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

export const schema: RJSFSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", title: "Name" },
    // ... more fields
  },
};

export const uiSchema: UiSchema = {
  name: { "ui:placeholder": "Enter name..." },
  // ... more UI customization
};
```

### Step 2: Export in Index

```typescript
// ui/src/forms/index.ts
import * as myResourceForm from "./myResourceForm";

export const forms = {
  // ... existing forms
  myResource: myResourceForm,
};

export const resourceLabels = {
  // ... existing labels
  myResource: { singular: "My Resource", plural: "My Resources" },
};
```

### Step 3: Update Page Component

Add table columns and mock data in `Traffic2Page.tsx`.

**That's it!** The new resource will automatically appear as a tab.

## Form Examples

### Simple String Field
```typescript
name: {
  type: "string",
  title: "Name",
  minLength: 1,
  maxLength: 100,
}
```

### Enum/Dropdown
```typescript
protocol: {
  type: "string",
  title: "Protocol",
  enum: ["HTTP", "HTTPS", "TCP"],
  default: "HTTP",
}
```

### Object with Properties
```typescript
tls: {
  type: "object",
  title: "TLS Configuration",
  properties: {
    mode: { type: "string", enum: ["DISABLED", "SIMPLE"] },
    cert: { type: "string", title: "Certificate Path" },
  },
}
```

### Array of Items
```typescript
headers: {
  type: "array",
  title: "Headers",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      value: { type: "string" },
    },
  },
}
```

### OneOf (Union Type)
```typescript
{
  oneOf: [
    {
      title: "Service",
      type: "object",
      properties: {
        service: { type: "string" },
      },
    },
    {
      title: "Host",
      type: "object",
      properties: {
        host: { type: "string" },
      },
    },
  ],
}
```

## UI Schema Examples

### Textarea
```typescript
description: {
  "ui:widget": "textarea",
  "ui:options": { rows: 4 },
}
```

### Radio Buttons
```typescript
protocol: {
  "ui:widget": "radio",
}
```

### Help Text
```typescript
name: {
  "ui:placeholder": "Enter a unique name",
  "ui:help": "This name must be unique across all resources",
}
```

### Array Options
```typescript
items: {
  "ui:options": {
    addable: true,
    removable: true,
    orderable: true,
  },
}
```

## Integration with Backend

The page currently uses mock data. To integrate with real APIs:

### 1. Create API Functions
```typescript
// ui/src/api/resources.ts
export async function createListener(data: LocalListener) {
  const config = await fetchConfig();
  config.listeners.push(data);
  await updateConfig(config);
}

export async function updateListener(name: string, data: LocalListener) {
  const config = await fetchConfig();
  const index = config.listeners.findIndex(l => l.name === name);
  config.listeners[index] = data;
  await updateConfig(config);
}

export async function deleteListener(name: string) {
  const config = await fetchConfig();
  config.listeners = config.listeners.filter(l => l.name !== name);
  await updateConfig(config);
}
```

### 2. Update Page Component
```typescript
import { createListener, updateListener, deleteListener } from "../../api/resources";
import { useConfig } from "../../api";

export function Traffic2Page() {
  const { data: config, mutate } = useConfig();

  const handleSubmit = async ({ formData }) => {
    if (editingItem) {
      await updateListener(editingItem.name, formData);
    } else {
      await createListener(formData);
    }
    mutate(); // Refresh config
  };
}
```

## Testing the Implementation

### 1. Development Server
```bash
cd ui
yarn dev
```

### 2. Navigate to the Page
Open http://localhost:5173/traffic2

### 3. Test CRUD Operations
- Create new resources with different configurations
- Edit existing resources
- Delete resources
- Switch between tabs
- Test form validation (leave required fields empty, etc.)

### 4. Verify Console
Check browser console for any errors or warnings.

## Advantages Over JSON-Based Forms

| Aspect | JSON Forms | TypeScript Forms |
|--------|-----------|------------------|
| Type Safety | ❌ No compile-time checks | ✅ Full TypeScript checking |
| IDE Support | ⚠️ Limited | ✅ Autocomplete & IntelliSense |
| Loading | 🌐 Runtime HTTP fetch | ⚡ Bundled with code |
| Refactoring | ⚠️ Manual search/replace | ✅ IDE refactoring tools |
| Validation | ⚠️ Only at runtime | ✅ Compile-time + runtime |
| Documentation | 📝 Separate docs | 📝 Inline JSDoc + types |
| Performance | ⚠️ Network latency | ✅ Instant (no fetch) |

## Future Enhancements

1. **API Integration** - Connect to real backend endpoints
2. **Search/Filter** - Add table search and filtering
3. **Bulk Operations** - Select and delete multiple items
4. **Export/Import** - Export configs to YAML/JSON
5. **Validation** - Add custom validation rules
6. **Relationships** - Show relationships between resources
7. **Metrics** - Display usage metrics for each resource
8. **Version Control** - Track changes and rollback

## Resources

- **Form Creation Guide**: [ui/src/forms/README.md](ui/src/forms/README.md)
- **Page Documentation**: [ui/src/pages/Traffic2/README.md](ui/src/pages/Traffic2/README.md)
- **RJSF Docs**: https://rjsf-team.github.io/react-jsonschema-form/
- **JSON Schema**: https://json-schema.org/
- **Ant Design**: https://ant.design/components/overview/

## Support

For questions or issues:
1. Check the README files in `ui/src/forms/` and `ui/src/pages/Traffic2/`
2. Review the example forms for patterns
3. Consult the RJSF documentation for advanced features
4. Check the existing codebase for similar patterns

---

**Implementation Date**: 2026-03-03
**Status**: ✅ Complete and Ready for Use
