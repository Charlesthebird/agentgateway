# Traffic Page - Manual TypeScript Schemas

Traffic is a variation of the Traffic routing page that uses **manually configured TypeScript schemas** instead of auto-generated JSON schemas. This approach provides more control and demonstrates how to build forms using handcrafted schema definitions.

## Key Differences from Traffic and Traffic2

### Traffic (Original)

- **Schema Source**: Auto-generated JSON schemas loaded from `public/schema-forms/`
- **Forms**: Uses generated schemas with SchemaForm component
- **Hierarchy**: Full hierarchy tree with edit/delete operations
- **Routing**: Nested routes with full detail views

### Traffic2

- **Schema Source**: Manually typed TypeScript schemas in `forms/` folder
- **Forms**: Uses RJSF with TypeScript types from config.d.ts
- **UI**: Tab-based interface with tables
- **Routing**: Separate pages for create/edit

### Traffic (This Page)

- **Schema Source**: Manually configured TypeScript schemas (NOT generated)
- **Forms**: Handcrafted schemas using config.d.ts types
- **Hierarchy**: Tree view showing config structure
- **Purpose**: Demonstrates manual schema configuration approach

## Structure

```
ui/src/pages/Traffic/
├── TrafficPage.tsx                # Main page component
├── index.ts                        # Exports
├── README.md                       # This file
├── forms/                          # Manual TypeScript schemas
│   ├── bindForm.ts                 # Bind configuration schema
│   ├── listenerForm.ts             # Listener configuration schema
│   ├── routeForm.ts                # Route configuration schema
│   ├── backendForm.ts              # Backend configuration schema
│   └── index.ts                    # Form exports
├── components/                     # UI components
│   └── HierarchyTree.tsx           # Tree view component
└── hooks/                          # React hooks
    └── useTrafficHierarchy.ts     # Hierarchy data hook
```

## Manual Schema Configuration

Each form in `forms/` is a manually written JSON Schema that:

1. **Imports types from config.d.ts**:

   ```typescript
   import type { LocalListener } from "../../../config";
   ```

2. **Defines a JSON Schema manually**:

   ```typescript
   export const schema: RJSFSchema = {
     type: "object",
     properties: {
       name: { type: "string", title: "Name" },
       // ... handcrafted properties
     },
   };
   ```

3. **Provides UI customization**:

   ```typescript
   export const uiSchema: UiSchema = {
     name: { "ui:placeholder": "Enter name..." },
   };
   ```

4. **Includes default values**:
   ```typescript
   export const defaultValues: Partial<LocalListener> = {
     hostname: "*",
     protocol: "HTTP",
   };
   ```

## Benefits of Manual Schemas

1. **Full Control**: Complete control over schema structure and validation
2. **Type Safety**: Uses TypeScript types from config.d.ts
3. **Customization**: Can add custom validation, descriptions, and UI hints
4. **No Generation Step**: No need to run schema generation scripts
5. **Educational**: Shows how to build schemas from scratch

## Trade-offs

### Advantages

- More flexible and customizable
- Easier to understand for developers
- No build-time generation required
- Can add custom logic and validation

### Disadvantages

- Requires manual maintenance when types change
- More code to write initially
- Schema and type can drift if not careful
- Less DRY than generated schemas

## Usage

### Viewing the Hierarchy

Navigate to `/traffic` to see:

- Metrics overview (binds, listeners, routes, validation issues)
- Collapsible hierarchy tree
- Validation warnings and errors

### Adding Resources

Currently, Traffic is read-only and focused on visualization. To add CRUD operations:

1. Create form components using the schemas in `forms/`
2. Add modal/drawer components for editing
3. Integrate with the API from `src/api/crud.ts`
4. Add navigation to detail views

## Comparison: Generated vs Manual Schemas

| Aspect         | Generated (Traffic)              | Manual (Traffic)       |
| -------------- | -------------------------------- | ---------------------- |
| Schema Source  | auto-generated JSON files        | handcrafted TypeScript |
| Maintenance    | automatic sync with config.json  | manual updates needed  |
| Flexibility    | limited to generator output      | full customization     |
| Type Safety    | runtime only                     | compile-time + runtime |
| Build Step     | requires `yarn generate:schemas` | none                   |
| Learning Curve | harder to modify                 | easier to understand   |

## When to Use Manual Schemas

Use manually configured schemas when:

- You need custom validation logic
- The auto-generated schemas don't match your needs
- You want more control over form behavior
- You're building a prototype or learning tool
- The schema is simple and unlikely to change

Use auto-generated schemas (like Traffic) when:

- You have complex, frequently changing schemas
- You want to ensure schema/type consistency
- You need to support many different resource types
- You prefer DRY (Don't Repeat Yourself) approach

## Future Enhancements

Potential additions to Traffic:

- [ ] Full CRUD operations (create, edit, delete)
- [ ] Detail view pages for each node type
- [ ] Form validation and error handling
- [ ] Integration with backend API
- [ ] Export/import configuration
- [ ] Real-time validation feedback

## Related Files

- [Traffic page](../Traffic/README.md) - Auto-generated schemas
- [Traffic2 page](../Traffic2/README.md) - TypeScript forms with tables
- [Form schemas](./forms/README.md) - Manual schema definitions
- [API CRUD operations](../../api/crud.ts) - Backend integration

---

**Note**: This is an educational implementation showing how to build forms with manually configured schemas. For production use, consider whether auto-generated schemas (Traffic) or typed forms (Traffic2) better suit your needs.
