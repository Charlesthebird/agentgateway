# Agent Gateway UI - Context

_Last updated: Feb 26, 2026_

## Dev Notes
- Lint: `yarn run lint` from `ui/`
- Pre-existing lint errors exist — don't fix unless necessary
- Config types: `ui/src/config.d.ts` → `ui/src/api/types.ts`
- DO NOT add `padding: var(--spacing-xl)` in page containers — MainLayout already adds it

## Sidebar (DO NOT CHANGE)
OLD: /dashboard, /listeners, /routes, /backends, /policies, /playground  
LLM: /llm, /llm/models, /llm/logs, /llm/metrics, /llm/playground  
MCP: /mcp, /mcp/servers, /mcp/logs, /mcp/metrics, /mcp/playground  
Traffic: /traffic, /traffic/routing, /traffic/logs [disabled], /traffic/metrics [disabled]  
CEL: /cel-playground

All pages ✅ built. Only actively change Traffic Routing files unless instructed otherwise.

## Config Schema
```
binds[]: port, tunnelProtocol
  listeners[]: name, protocol, hostname
    routes[]: name, matches, backends, policies  (HTTP; mutually exclusive with tcpRoutes)
    tcpRoutes[]: name, backends
backends[]: name + oneOf {host, service, ai, mcp, dynamic}
policies, frontendPolicies, llm, mcp
```

## Traffic Routing Architecture

### URL routing
`/traffic/routing/bind/:port/listener/:li/(tcp)?route/:ri/backend/:bi`  
App.tsx registers nested Routes; all map to `NodeDetailPage`.

### Layout (TrafficRoutingPage)
- No sub-route active → full-width overview
- Sub-route active → 380px `Sidebar` (HierarchyTree) + `DetailPanel` (Outlet → NodeDetailPage)
- Full-width `PageHeader` with breadcrumbs, title "Routing", Edit/Cancel buttons
- `isEditing` state lives in TrafficRoutingPage, reset on path change

### Key files
| File | Role |
|------|------|
| `TrafficRoutingPage.tsx` | Layout, URL param parsing, EditTarget resolution, isEditing state |
| `NodeDetailPage.tsx` | Outlet; renders NodeDetailView or NodeEditForm based on isEditing |
| `NodeDetailView.tsx` | Read-only type-specific Descriptions tables |
| `NodeEditForm.tsx` | RJSF form; strips child fields from schema+data; shows `<type> details` SectionTitle |
| `NodeEditDrawer.tsx` | Thin drawer wrapper around NodeEditForm (used only for Add new) |
| `HierarchyTree.tsx` | Tree; row clicks navigate; Add+Delete buttons fade in on hover (CSS); delete calls applyDelete + navigate to parent |
| `nodeEditUtils.ts` | applyEdit, applyDelete, NODE_LABELS, SCHEMA_TYPE_MAP, CHILD_FIELDS_TO_HIDE, MUTUAL_EXCLUSIVE_GROUPS |
| `useRoutingHierarchy.ts` | Builds BindNode[] tree from config |

### Form system (RJSF + Ant Design)
- Custom fields: `OneOfField`, `AnyOfField`
- Custom templates: `ExclusiveObjectFieldTemplate` (delegates to `CollapsibleObjectFieldTemplate`), `FieldTemplate`, `ArrayFieldTemplate`, `NullTitleFieldTemplate`
- Schemas: `/public/schema-forms/{listeners|routes|backends}/{Type}.json`
- `uiSchema: { "ui:title": "", "ui:description": "" }` suppresses RJSF root title/description (manual SectionTitle shown instead)
- `CollapsibleObjectFieldTemplate`: renders all fields flat (no collapse); section titles via `<Title level={5}>`
- `CHILD_FIELDS_TO_HIDE`: hides child arrays (listeners/routes/backends) from edit forms; `applyEdit` re-injects them on save
- `MUTUAL_EXCLUSIVE_GROUPS`: currently empty (routes/tcpRoutes handled via tree Add buttons + runtime check in applyEdit)
- `validateFormats: false` in Ajv to silence unknown format warnings (uint16, etc.)

### Sidebar active state
`MainLayout.tsx`: uses prefix matching so `/traffic/routing/*` keeps "Routing" menu item highlighted.

### HierarchyTree behaviors
- Row click → navigate to URL
- Add buttons (Add Listener / Add Route / Add Backend) → open NodeEditDrawer
- Both Add and Delete buttons live in `HoverActions` (opacity:0 → 1 on NodeRow:hover, CSS transition)
- Delete: `Popconfirm` → `applyDelete(target)` → toast → navigate to parent path
- "Configuration" title click → navigate to /traffic/routing
- Collapse/Expand all: icon-only button with Tooltip
- Backend icon: `Server` (lucide), color: `var(--color-primary)`
- Selected node: `var(--color-bg-selected)` override for dark mode
