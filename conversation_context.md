# Agent Gateway UI Development - Conversation Context

## Overview

This document tracks the development of the Agent Gateway UI, covering routing page functionality, form validation, improved UX, and full-page build-out across all sidebar sections.

## Current State (as of Feb 26, 2026)

All pages in the UI project have been built out or improved. The sidebar structure is preserved unchanged.

---

## Sidebar Structure (DO NOT CHANGE)

```
OLD (legacy)
  - Home (/dashboard)
  - Listeners (/listeners)
  - Routes (/routes)
  - Backends (/backends)
  - Policies (/policies)
  - Playground (/playground)

LLM
  - LLM Overview (/llm)
  - Models (/llm/models)
  - Logs (/llm/logs)
  - Metrics (/llm/metrics)
  - Playground (/llm/playground)

MCP
  - MCP Overview (/mcp)
  - Servers (/mcp/servers)
  - Logs (/mcp/logs)
  - Metrics (/mcp/metrics)
  - Playground (/mcp/playground)

Traffic
  - Traffic Overview (/traffic)
  - Routing (/traffic/routing)
  - Logs (/traffic/logs)   [disabled]
  - Metrics (/traffic/metrics) [disabled]

CEL Playground (/cel-playground)
```

---

## Pages Status

### Traffic Section
- **TrafficRoutingPage** (/traffic/routing): ✅ Fully implemented - HierarchyTree + NodeEditDrawer with view/edit mode
- **TrafficOverviewPage** (/traffic): ✅ Shows routing stats (binds/listeners/routes), health, links to routing
- **TrafficLogsPage** (/traffic/logs): ✅ Professional "Coming soon" state
- **TrafficMetricsPage** (/traffic/metrics): ✅ Professional "Coming soon" state

### LLM Section
- **LLMOverviewPage** (/llm): ✅ Shows model count, providers, policies summary; links to models
- **LLMModelsPage** (/llm/models): ✅ Master-detail view of models with provider tags, params, guardrails
- **LLMLogsPage** (/llm/logs): ✅ Professional "Coming soon" state
- **LLMMetricsPage** (/llm/metrics): ✅ Professional "Coming soon" state
- **LLMPlaygroundPage** (/llm/playground): ✅ Functional UI with model selector, chat interface (stub responses)

### MCP Section
- **MCPOverviewPage** (/mcp): ✅ Shows target count, port, stateful mode; lists targets
- **MCPServersPage** (/mcp/servers): ✅ Master-detail view of MCP targets with type+address display
- **MCPLogsPage** (/mcp/logs): ✅ Professional "Coming soon" state
- **MCPMetricsPage** (/mcp/metrics): ✅ Professional "Coming soon" state
- **MCPPlaygroundPage** (/mcp/playground): ✅ Functional UI with target selector, method selector, JSON params, output panel

### Dashboard
- **DashboardPage** (/dashboard): ✅ Gateway-wide overview: traffic stats, LLM model count, MCP target count, clickable section cards

### OLD Section (legacy, preserved)
- **ListenersPage**: Functional with table + old form navigation
- **RoutesPage**: Functional with table + old form navigation
- **BackendsPage**: Functional with table + old form navigation
- **PoliciesPage**: Functional with table + old form navigation
- **PlaygroundPage**: Fully implemented A2A/MCP playground

### CEL Playground
- **CELPlaygroundPage**: Fully implemented Monaco editor + CEL expression evaluation

---

## Key Architecture

### API Hooks (ui/src/api/hooks.ts)
- `useConfig()` - Full config
- `useConfigDump()` - Config dump
- `useListeners()` - Derived listeners from config
- `useRoutes()` - Derived routes from config
- `useBackends()` - Derived backends from config
- `usePolicies()` - Derived policies from config
- `useLLMConfig()` - `config.llm` 
- `useMCPConfig()` - `config.mcp`

### Traffic Routing System (most complex)

**Components:**
- `HierarchyTree.tsx` - Tree view; clicking rows opens detail view
- `NodeEditDrawer.tsx` - Drawer with view/edit mode toggle
  - View mode: `NodeDetailView` with formatted Descriptions
  - Edit mode: RJSF form with schema loaded from `/schema-forms/`
- `NodeDetailView.tsx` - Type-specific detail views (bind/listener/route)
- `RoutingMetrics.tsx` - Config stats bar
- `RoutingHierarchyContext.tsx` - React context for hierarchy

**Hooks:**
- `useRoutingHierarchy.ts` - Builds `BindNode[]` tree with HTTP + TCP routes, validation errors

**Key behaviors:**
- Click row → view mode (details)
- Click "Edit" button (in drawer header or bottom button) → edit mode (RJSF form)
- "Add" buttons stay on rows for quick access
- TCP routes shown with blue "TCP" tag; `categoryIndex` used for correct routing
- Mutual exclusion: routes and tcpRoutes cannot coexist on a listener

### Form System
- **RJSF** with Ant Design theme
- Custom fields: `OneOfField`, `AnyOfField`
- Custom templates: `ExclusiveObjectFieldTemplate`, `FieldTemplate`, `ArrayFieldTemplate`
- Schema loaded from `/public/schema-forms/{category}/{type}.json`

---

## Config Schema Reference (config-overview.md)

```
config: Global settings
binds: Port bindings
  listeners: Protocol + hostname matchers
    routes: HTTP/HTTPS routes (matches, backends, policies)
    tcpRoutes: TCP routes (name, backends)
backends: Named backend definitions (host, policies)
policies: Standalone policies
frontendPolicies: Global/listener-level policies
llm: LLM config
  models[]: name, provider, params (model, apiKey, etc.), guardrails
  policies: jwtAuth, extAuthz, basicAuth, apiKey, authorization
mcp: MCP config
  targets[]: name + one of {sse, mcp, stdio, openapi}
  port, statefulMode, prefixMode, policies
```

---

## Development Notes

- **Linting**: Run `yarn run lint` from `ui/` directory
- **No double padding**: Pages should NOT have `padding: var(--spacing-xl)` in their Container - `StyledContent` in MainLayout already adds it. The traffic routing page and old pages have this bug (pre-existing).
- **Pre-existing lint errors**: Many files have pre-existing `@typescript-eslint/no-explicit-any` and similar errors. Don't fix them unless necessary.
- **TypeScript**: Config types auto-generated in `ui/src/config.d.ts`, re-exported via `ui/src/api/types.ts`

---

_Last updated: February 26, 2026_
