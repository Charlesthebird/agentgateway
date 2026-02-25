# Fresh Routing Page Implementation Plan

## TL;DR

Replace the `TrafficRoutingPage` stub with a full-hierarchy configuration interface covering `binds → listeners → routes → backends` (plus policies at every level). The key innovation is **schema-driven forms generated at build time** from `schema/config.json` — meaning form fields, validation, and options update automatically when the schema changes, with zero manual maintenance. The UX centers on a visual hierarchy tree with inline editing and a metrics dashboard at the top.

## Context

The schema defines a strict hierarchy (from `config-overview.md`):

```
Binds (Ports)
  ↓
Listeners (Protocols, Hostnames)
  ↓
Routes (Match conditions, Policies)
  ↓
Backends (Hosts)
```

Policies can attach at every level. The Routing page must expose this full hierarchy — not just routes in isolation.

## Steps

### 1. Create Full-Hierarchy Data Hook

**Technical Details:** Create `useRoutingHierarchy` hook (in `ui/src/api/`) that joins data from existing `useListeners`, `useRoutes`, `useBackends`, and `usePolicies` hooks into a single resolved tree. Each node carries its children and attached policies. This is read-only first; mutations come later (Step 5). Include derived state: orphaned routes (no listener parent), broken backend references, policy attachment errors.

### 2. Add Routing Metrics Dashboard

**Technical Details:** At the top of `TrafficRoutingPage`, add a stat row using the `StatCard` pattern from `DashboardPage`. Show: active binds/listeners/routes/backends counts (from `useRoutingHierarchy`), backends with broken references (derived state), and policies-per-level summary. These are config-level metrics, not traffic metrics — no backend API needed beyond the existing config endpoint.

### 3. Build Visual Hierarchy Tree

**Technical Details:** Replace the page body stub with a collapsible tree using Ant Design's `Tree` component (already a dependency). Each node type (bind, listener, route, backend) gets a custom title renderer showing its key properties inline (port, protocol/hostname, path patterns, host:port). Clicking a node opens the inline editing panel (Step 5). Use `defaultExpandAll` for small configs; add a collapse-all toggle for large ones.

### 4. Build Schema-Driven Form Components

**Technical Details:** Forms are generated **at build time** from `schema/config.json` via the existing `yarn generate:schemas` pipeline — do not add runtime schema fetching. For each node type (listener, route, backend, policy), create a typed wrapper around the existing `SchemaForm` component that:

- Loads the pre-generated schema from `public/schema-forms/{category}/index.json`
- Populates relationship fields from live config: backend selectors show existing backend names, policy selectors show existing policy names
- Adds `uiSchema` overrides to group fields (basic vs. advanced) for progressive disclosure

Relationship fields (e.g., "which backends does this route target?") use a custom RJSF widget that reads from `useRoutingHierarchy` to populate options — this is the only runtime schema enhancement needed.

### 5. Develop Inline Editing Panel

**Technical Details:** Add a slide-in `Drawer` (Ant Design) that opens when a tree node is selected. The drawer contains the schema form for that node type (Step 4). On submit, call the existing config mutation API with the full updated config object (patch the relevant node in the hierarchy). Use SWR's `mutate` for optimistic updates. Include create/delete actions in the drawer header. No auto-save — explicit save button to avoid accidental config changes.

### 6. Add Relationship-Aware Validation

**Technical Details:** In `useRoutingHierarchy`, derive validation errors from cross-resource rules that RJSF alone cannot check:

- Route references a backend name that doesn't exist in `config.backends`
- Listener protocol is TCP but has HTTP routes attached
- Duplicate hostnames across listeners on the same bind
- Policy type incompatible with attachment level (e.g., frontend-only policy on a route)

Surface these as warning badges on tree nodes and inline alerts in the editing drawer.

### 7. Implement Smart Defaults on Create

**Technical Details:** When a user creates a new node from the tree (e.g., "Add Route" under a listener), pre-populate the form with context-derived defaults: the parent listener's hostname as a route hostname suggestion, existing backend names pre-filled in the backends array, protocol-appropriate match conditions. This uses the same `useRoutingHierarchy` data — no new infra needed.

### 8. Write Tests

**Technical Details:** Unit tests for `useRoutingHierarchy` join logic and derived validation rules. Integration tests for the inline edit → mutate → SWR revalidation flow. Component tests for tree rendering with various hierarchy shapes (empty config, single route, deep nesting, broken references).

## Verification

- **Hierarchy display:** Tree correctly shows all binds → listeners → routes → backends from the live config, including policy counts per node
- **Metrics row:** Stat cards reflect real config counts; broken-reference count updates when a backend is deleted
- **Schema forms:** Adding a new field to `schema/config.json` and running `yarn generate:schemas` causes it to appear in the form with no other code changes
- **Relationship fields:** Backend selector in route form shows only backends defined in `config.backends`; selecting a non-existent backend name shows a validation error
- **Inline editing:** Edit a route's path match, save, and confirm the config API receives the correct payload and the tree re-renders
- **Validation:** Deleting a backend that is referenced by a route shows a warning badge on the orphaned route node
- **Create flow:** "Add Route" under a listener pre-populates the listener's hostname in the route form

## Decisions

### Build-Time Schema Generation, Not Runtime

**Why:** The existing `yarn generate:schemas` pipeline already solves zero-maintenance form updates — adding HTTP ETag-based hot-reloading would introduce complexity with no benefit. Schema files are bundled assets, not API responses.

### React Flow / D3 Not Needed — Use Ant Design Tree

**Why:** The hierarchy is strictly linear (not a graph), so Ant Design's `Tree` component is sufficient. React Flow adds a large dependency for a use case that is already covered. Revisit if the hierarchy ever becomes a true DAG (e.g., shared backends across listeners).

### No Auto-Save

**Why:** Config changes have immediate production impact. Explicit save with SWR optimistic update gives users confidence without accidental writes. Contrast with form apps where partial data is harmless.

### Inline Drawer Over Full-Page Navigation

**Why:** Keeps the tree visible while editing, preserving relationship context. The existing `/form` route loses the tree context entirely. Drawer can deeplink (`/traffic/routing?edit=listenerName`) for shareability.

### RJSF With Custom Relationship Widget

**Why:** RJSF handles field rendering, validation, and schema changes for free. The only thing RJSF can't do is populate options from live config — a single custom widget covers all relationship fields across all resource types.

## File Structure

All new code lives under the existing Traffic section:

```
ui/src/pages/Traffic/
├── TrafficRoutingPage.tsx       # Replaces stub — main page entry point
├── components/
│   ├── RoutingMetrics.tsx       # Stat row at top of page
│   ├── HierarchyTree.tsx        # Ant Design Tree with custom node renderers
│   ├── NodeEditDrawer.tsx       # Slide-in form panel
│   └── RelationshipWidget.tsx   # Custom RJSF widget for ref fields
└── hooks/
    └── useRoutingHierarchy.ts   # Joined + validated hierarchy data
```

No new pages directory — this is an enhancement to the existing `Traffic` section. The existing `RoutesPage`, `ListenersPage`, `BackendsPage` remain unchanged as the "OLD" section until this page is validated.
