# Traffic2 Page

CRUD interface for listeners, routes, backends, and policies.

## Structure

```
Traffic2/
├── Traffic2Page.tsx       # List view with tabs
├── ResourceFormPage.tsx   # Full-page create/edit forms
├── api.ts                 # CRUD helpers (uses fetchConfig/updateConfig)
└── forms/
    ├── listenerForm.ts    # Typed with LocalListener
    ├── routeForm.ts       # Typed with LocalRoute
    ├── backendForm.ts     # Typed with LocalRouteBackend
    ├── policyForm.ts      # Typed with FilterOrPolicy
    └── index.ts
```

## Features

- TypeScript forms typed with `config.d.ts`
- Full-page forms (not modals)
- Real API integration via SWR
- Dark mode support
The Traffic2Page component:

1. **Manages State**: Tracks active tab, modal state, and form data
2. **Loads Forms**: Dynamically loads the appropriate form based on selected resource type
3. **Handles CRUD**: Create, edit, and delete operations
4. **Displays Tables**: Shows existing resources in tables with actions

### 4. Usage in Component

```typescript
// Get the current form based on active tab
const currentForm = forms[activeTab];

// Render the form
<Form
  schema={currentForm.schema}
  uiSchema={currentForm.uiSchema}
  formData={formData}
  validator={validator}
  onChange={({ formData }) => setFormData(formData)}
  onSubmit={handleSubmit}
/>
```

## Key Features

### Tabbed Interface

Users can switch between resource types (Listeners, Routes, Backends, Policies) using tabs.

### Table Display

Each tab shows a table of existing resources with:
- Relevant columns for that resource type
- Edit and Delete actions
- Pagination

### Modal Forms

Create and Edit operations open a modal with:
- Full form for the resource
- Validation
- Save and Cancel buttons

### TypeScript Benefits

1. **Compile-time Checking**: Errors caught before runtime
2. **IDE Support**: Autocomplete and IntelliSense
3. **Type Safety**: Forms are typed with `config.d.ts`
4. **Refactoring**: Easy to find and update form usages

## Customization

### Adding a New Resource Type

1. **Create the form** in `ui/src/forms/`:

```typescript
// ui/src/forms/myResourceForm.ts
export const schema: RJSFSchema = { /* ... */ };
export const uiSchema: UiSchema = { /* ... */ };
```

2. **Export it** in `ui/src/forms/index.ts`:

```typescript
import * as myResourceForm from "./myResourceForm";

export const forms = {
  // ... existing forms
  myResource: myResourceForm,
};
```

3. **Add labels** in `forms/index.ts`:

```typescript
export const resourceLabels = {
  // ... existing labels
  myResource: { singular: "My Resource", plural: "My Resources" },
};
```

4. **Define columns** in `Traffic2Page.tsx`:

```typescript
const columns: Record<ResourceType, ColumnsType<any>> = {
  // ... existing columns
  myResource: [
    { title: "Name", dataIndex: "name", key: "name" },
    // ... more columns
  ],
};
```

5. **Add mock data** (or API integration):

```typescript
const mockData: Record<ResourceType, any[]> = {
  // ... existing data
  myResource: [{ key: "1", name: "Example" }],
};
```

That's it! The new resource type will automatically appear in the tabs.

### Styling

The page uses:
- **Emotion CSS**: Styled components with `@emotion/styled`
- **Ant Design**: UI components from `antd`
- **CSS Variables**: Theme-aware colors from `var(--color-*)`

### Validation

Validation is handled by:
- **JSON Schema**: Built-in validation rules (minLength, required, etc.)
- **AJV**: The validator from `utils/validator.ts`
- **Form Library**: React JSON Schema Form (@rjsf/antd)

## Integration with Real APIs

To integrate with real APIs, replace the mock data and CRUD operations:

### 1. Create API Hooks

```typescript
// ui/src/api/listeners.ts
export function useListeners() {
  return useSWR("/api/listeners", fetcher);
}

export async function createListener(data: any) {
  return await fetchConfig().then(config => {
    config.listeners.push(data);
    return updateConfig(config);
  });
}
```

### 2. Update Page Component

```typescript
import { useListeners, createListener } from "../../api/listeners";

export function Traffic2Page() {
  const { data: listeners, mutate } = useListeners();

  const handleSubmit = async ({ formData }) => {
    await createListener(formData);
    mutate(); // Refresh data
  };
}
```

### 3. Replace Mock Data

```typescript
// Instead of:
const mockData = { listener: [...] };

// Use:
const { data: listeners } = useListeners();
```

## Next Steps

1. **Connect to Backend**: Replace mock data with real API calls
2. **Add Validation**: Enhance forms with custom validation rules
3. **Improve UX**: Add loading states, better error handling
4. **Add Search/Filter**: Table filtering and search functionality
5. **Export/Import**: Allow exporting/importing configurations

## Resources

- [React JSON Schema Form Docs](https://rjsf-team.github.io/react-jsonschema-form/)
- [JSON Schema Specification](https://json-schema.org/)
- [Form Creation Guide](../../forms/README.md)
- [Ant Design Components](https://ant.design/components/overview/)
