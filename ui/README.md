# 🌐 AgentGateway UI

Modern React-based web UI for AgentGateway configuration and management, migrated from the Next.js-based old-ui.

## 🚀 Tech Stack

**Core:** React 19 + TypeScript · Vite · React Context · React Router

**UI & Styling:** Ant Design · Emotion CSS · Framer Motion · Lucide Icons · Chart.js · CSS Flexbox

**Data:** SWR · React Hot Toast

## 📁 Project Structure

```
ui/src/
├── components/       # Reusable UI components & Layout
├── contexts/         # React Context providers (Theme, Server, Loading, Wizard)
├── pages/            # Page components
│   ├── Dashboard/    # Main dashboard (OLD section)
│   ├── Listeners/    # Listener configuration (OLD section)
│   ├── Routes/       # Route configuration (OLD section)
│   ├── Backends/     # Backend configuration (OLD section)
│   ├── Policies/     # Policy configuration (OLD section)
│   ├── Playground/   # Testing tools (OLD section)
│   ├── LLM/          # LLM pages (Overview, Models, Logs, Metrics, Playground)
│   ├── MCP/          # MCP pages (Overview, Servers, Logs, Metrics, Playground)
│   ├── Traffic/      # Traffic pages (Overview, Routing, Logs, Metrics)
│   ├── CELPlayground/# CEL expression editor
│   └── SetupWizard/  # Guided setup wizard
├── styles/           # Global styles, theme vars, Emotion & Antd config
├── api/              # API client functions
├── config.d.ts       # Generated types from config schema
└── cel.d.ts          # Generated types from CEL schema
```

## ⚡ Quick Start

```bash
# Install dependencies
yarn install

# Development (auto-generates schemas)
yarn dev              # http://localhost:3000

# Production build
yarn build
yarn preview

# Generate TypeScript types
yarn generate-config-schema   # → src/config.d.ts
yarn generate-cel-schema       # → src/cel.d.ts
yarn generate:schemas          # → RJSF schemas to public/schema-forms/
```

## 🧭 Navigation Structure

**OLD Section** (Original Features)

- 🏠 Dashboard · 🔌 Listeners · 🛣️ Routes · 🔧 Backends · 📋 Policies · 🎮 Playground

**🤖 LLM Section**

- Overview · Models · Logs · Metrics · Playground

**🔗 MCP Section** (Model Context Protocol)

- Overview · Servers · Logs · Metrics · Playground

**🚦 Traffic Section**

- Overview · Routing · Logs · Metrics

**⚡ CEL Playground** (Standalone)

- CEL expression editor and testing

## 📊 Status

**✅ Implemented:** Project setup · Theming (light/dark) · Styling foundation · State management (Context providers) · Routing · Base layout · Toast notifications

**🚧 In Progress:** Core UI components · Dashboard page

**📋 Planned:** Testing tools · CEL Playground · Setup wizard · API integration · Data visualization · Real-time updates

## 📝 Dynamic Form Generation

**Automated schema-driven configuration forms** with zero manual maintenance:

### How It Works

1. **Schema Generation** (`ui/scripts/generate-form-schemas.cjs`)
   - Parses `schema/config.json` · Auto-discovers types · Resolves `$ref` references
   - Categorizes into Policies, Listeners, Routes, Backends
   - Enhances with user-friendly titles/descriptions · Outputs RJSF schemas

2. **Custom Templates** (`src/components/FormTemplates/`)
   - `CollapsibleObjectFieldTemplate`: Auto-collapses optional fields
   - `FieldTemplate`: Ant Design styling with tooltips
   - `ArrayFieldTemplate`: Card-based arrays with add/remove

3. **SchemaForm Component** (`src/components/SchemaForm/`)
   - Dynamically loads schemas · Renders with RJSF · Validates with AJV

### Form Features

✨ Auto-organized layout: Required fields first, optional fields collapsed  
📖 Inline help with tooltips and default values  
✅ Field-level validation with error messages  
🎨 Ant Design widgets (Select, InputNumber, etc.)

### Zero Maintenance

🔄 **Automatic type discovery** via pattern matching  
➕ **New types auto-appear** in UI when added to schema  
🔄 **Schema changes sync** automatically to forms  
📝 **No hardcoded lists** to maintain

## ⚙️ Configuration

**Server:** Connects to AgentGateway (default: `http://localhost:15000`)  
**Modes:** Static (file editing) · XDS (dynamic config via XDS API)  
**Theme:** Light/dark mode · Persists in localStorage · Custom variables in `src/styles/theme.css`

## 💻 Development Guide

### Styling

- 🎨 **Emotion CSS** for component styles
- 🎨 **CSS custom variables** from `theme.css` for theming
- 🧩 **Ant Design** components as base, customize with Emotion
- 📐 **CSS Flexbox** for all layouts (no Grid)
- 🔧 Utilities in `src/styles/emotion.ts` and `src/styles/global.css`

### State Management

- 🌍 **React Context** for global state (theme, server, loading, wizard)
- 📡 **SWR** for server data fetching and caching
- 🔄 **useState** for component-specific state

### Code Organization

- 📁 Feature folders in `pages/` · Shared components in `components/`
- 🔬 Small, focused components · Full TypeScript type safety
- 📝 Leverage generated schema types

## 🔄 Migration from old-ui

See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for detailed migration plan and progress tracking.

## 📄 License

See the root [LICENSE](../LICENSE) file for details.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
