# Traffic3 Implementation - Manual TypeScript Schemas

Traffic3 is a new traffic routing page that demonstrates how to build a hierarchy tree using manually configured TypeScript schemas instead of auto-generated JSON schemas.

## Overview

**Route**: `/traffic3`

**Purpose**: Showcase an alternative approach to form schema configuration where schemas are handcrafted in TypeScript rather than generated from JSON files.

## Key Features

- **Manual TypeScript Schemas** - Handcrafted schemas in `forms/` folder, not auto-generated
- **Type-Safe Forms** - Uses `config.d.ts` types directly for compile-time safety
- **Hierarchy Tree** - Visual tree showing binds → listeners → routes → backends
- **Validation** - Built-in validation with warnings and errors
- **Metrics Dashboard** - Overview stats (binds, listeners, routes, validation issues)
- **Read-Only** - Currently focused on visualization (CRUD can be added later)

## Architecture Comparison

### Traffic (Original)
- **Schemas**: Auto-generated JSON from `schema/config.json`
- **Location**: `ui/public/schema-forms/`
- **Forms**: SchemaForm component loads JSON at runtime
- **Advantage**: Always in sync with backend schema
- **Trade-off**: Less flexibility, harder to customize

### Traffic2
- **Schemas**: Manually typed TypeScript schemas
- **Location**: `ui/src/pages/Traffic2/forms/`
- **Forms**: RJSF with table-based UI
- **Advantage**: Full TypeScript integration
- **Trade-off**: Tab-based interface, not hierarchical

### Traffic3 (New)
- **Schemas**: Manually configured TypeScript schemas (NOT generated)
- **Location**: `ui/src/pages/Traffic3/forms/`
- **Forms**: Handcrafted JSON Schema definitions
- **Advantage**: Full control, easy to customize, educational
- **Trade-off**: Manual maintenance required

## Structure

```
ui/src/pages/Traffic3/
├── Traffic3Page.tsx              # Main page with metrics and tree
├── index.ts                      # Module exports
├── README.md                     # Detailed documentation
├── forms/                        # Manual schema definitions
│   ├── bindForm.ts              # Schema for LocalBind
│   ├── listenerForm.ts          # Schema for LocalListener
│   ├── routeForm.ts             # Schema for LocalRoute
│   ├── backendForm.ts           # Schema for LocalRouteBackend
│   └── index.ts                 # Form exports
├── components/                   # UI components
│   └── HierarchyTree.tsx        # Tree visualization
└── hooks/                        # React hooks
    └── useTraffic3Hierarchy.ts  # Data transformation and validation
```

## Manual Schema Example

Each form exports:

```typescript
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { LocalListener } from "../../../config";

// 1. JSON Schema (manually configured)
export const schema: RJSFSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Name",
      description: "Unique name for this listener",
    },
    protocol: {
      type: "string",
      enum: ["HTTP", "HTTPS", "TLS", "TCP", "HBONE"],
      default: "HTTP",
    },
    // ... more fields
  },
};

// 2. UI Schema (form customization)
export const uiSchema: UiSchema = {
  name: {
    "ui:placeholder": "e.g., main-listener",
    "ui:help": "Optional unique identifier",
  },
  protocol: {
    "ui:widget": "select",
  },
};

// 3. Default values
export const defaultValues: Partial<LocalListener> = {
  hostname: "*",
  protocol: "HTTP",
};

// 4. Type guard
export function isLocalListener(data: unknown): data is LocalListener {
  return typeof data === "object" && data !== null;
}
```

## Hierarchy Hook

`useTraffic3Hierarchy` transforms the config into a tree structure:

```typescript
interface Traffic3Hierarchy {
  binds: BindNode[];           // Top-level binds
  stats: {
    totalBinds: number;
    totalListeners: number;
    totalRoutes: number;
    totalBackends: number;
    totalValidationErrors: number;
  };
  isLoading: boolean;
  error: Error | undefined;
}
```

Each node includes:
- Original data (LocalBind, LocalListener, etc.)
- Validation errors and warnings
- Child nodes (listeners → routes → backends)
- Metadata (port, indices, protocol)

## Validation

Built-in validation checks:

### Bind Level
- Warns if bind has no listeners

### Listener Level
- Warns about duplicate hostname+port combinations
- Warns if HTTP protocol has TCP routes
- Warns if listener has no routes

### Route Level
- Warns if TCP listener has HTTP match conditions
- Warns if route has no backends

## Metrics Dashboard

The overview page shows:
- **Binds**: Total number of port bindings
- **Listeners**: Total number of configured listeners
- **Routes**: Total HTTP + TCP routes
- **Validation Issues**: Sum of errors and warnings

Each metric has an icon and color coding:
- Primary (blue) - Binds
- Success (green) - Listeners
- Info (cyan) - Routes
- Warning/Success - Validation (changes based on count)

## Hierarchy Tree

The tree component displays:
- **Binds** (Network icon) - Port number + tunnel protocol
- **Listeners** (Headphones icon) - Name + protocol badge
- **Routes** (Route icon) - Name + TCP badge (if TCP route)
- **Backends** (Server icon) - Type (Service/Host/MCP/AI/etc.)

Features:
- Click to navigate (placeholder, can be extended)
- Expand/collapse all button
- Validation badges (error/warning counts)
- Empty state with "Add First Bind" button

## Usage

### Viewing the Page

1. Navigate to `/traffic3` in the browser
2. Or add a menu item in the sidebar (see below)

### Extending with CRUD Operations

To add create/edit/delete functionality:

1. **Create Modal/Drawer Component**:
   ```typescript
   import Form from "@rjsf/antd";
   import { forms } from "./forms";

   function BindFormModal({ onSave }) {
     return (
       <Modal title="Edit Bind">
         <Form
           schema={forms.bind.schema}
           uiSchema={forms.bind.uiSchema}
           formData={data}
           onSubmit={({ formData }) => onSave(formData)}
         />
       </Modal>
     );
   }
   ```

2. **Add to Tree Actions**:
   Update `HierarchyTree.tsx` to add edit/delete buttons (like Traffic page)

3. **Use API CRUD Functions**:
   ```typescript
   import * as api from "../../api/crud";

   await api.createListener(port, listenerData);
   await api.updateListener(port, name, listenerData);
   await api.removeListener(port, name);
   ```

### Adding to Sidebar

To add Traffic3 to the navigation menu, edit `MainLayout.tsx`:

```typescript
{
  key: "traffic3",
  icon: <Activity />,
  label: <Link to="/traffic3">Traffic (Manual Schemas)</Link>,
}
```

## Benefits

1. **Educational** - Great for learning how JSON Schema and RJSF work
2. **Full Control** - Complete freedom over validation and UI
3. **Type Safety** - Compile-time checking against config.d.ts
4. **No Build Step** - No schema generation script needed
5. **Customizable** - Easy to add custom logic and validation

## Trade-offs

### Advantages
✅ More flexible and customizable
✅ Easier to understand for developers
✅ No build-time generation required
✅ Can add custom validation logic
✅ Great learning tool

### Disadvantages
❌ Requires manual maintenance when types change
❌ More code to write initially
❌ Schema and type can drift if not careful
❌ Less DRY than auto-generated schemas

## When to Use

**Use Manual Schemas (Traffic3)** when:
- You need custom validation or form behavior
- The schema is simple and stable
- You want full control over the UI
- You're prototyping or learning
- Auto-generated schemas don't fit your needs

**Use Auto-Generated Schemas (Traffic)** when:
- You have complex, frequently changing schemas
- You want guaranteed schema/type consistency
- You need to support many resource types
- You prefer automation over control

**Use TypeScript Forms (Traffic2)** when:
- You want table-based CRUD interface
- You need full-page edit forms
- You prefer flat navigation over hierarchy

## Testing

To test Traffic3:

```bash
cd ui
yarn dev
```

Then navigate to http://localhost:5173/traffic3

Test scenarios:
- [ ] Metrics display correctly
- [ ] Tree expands/collapses
- [ ] Validation badges appear for warnings
- [ ] Empty state shows when no config
- [ ] Loading state shows while fetching
- [ ] Error state shows on fetch failure

## Future Enhancements

Potential additions:
- [ ] Add CRUD operations (create, edit, delete)
- [ ] Detail view pages for each node
- [ ] Form modals using the manual schemas
- [ ] Export/import configuration
- [ ] Advanced validation rules
- [ ] Search/filter in tree
- [ ] Drag-and-drop reordering

## Related Files

- **Traffic**: [ui/src/pages/Traffic/](../ui/src/pages/Traffic/) - Auto-generated schemas
- **Traffic2**: [ui/src/pages/Traffic2/](../ui/src/pages/Traffic2/) - TypeScript typed forms
- **Traffic3**: [ui/src/pages/Traffic3/](../ui/src/pages/Traffic3/) - Manual schemas (this)
- **API**: [ui/src/api/crud.ts](../ui/src/api/crud.ts) - CRUD operations
- **Types**: [ui/src/config.d.ts](../ui/src/config.d.ts) - Generated TypeScript types

## Resources

- **React JSON Schema Form**: https://rjsf-team.github.io/react-jsonschema-form/
- **JSON Schema**: https://json-schema.org/
- **Ant Design**: https://ant.design/
- **TypeScript**: https://www.typescriptlang.org/

---

**Implementation Date**: 2026-03-03
**Status**: ✅ Complete and Ready for Use
**Type**: Read-Only Visualization (CRUD can be added)
