# Old-UI to New-UI Migration Plan

## Overview

Migrate the comprehensive Next.js dashboard from old-ui to a new Vite-based React 19 application in ./ui, preserving all core features while adopting the specified tech stack.

## Tech Stack

### Core

- **React 19** with TypeScript
- **Vite** for build tooling
- **React Context Providers** for state management

### UI Components

- **Antd** for basic components
- **Framer Motion** for animations
- **Lucide React** for icons
- **ChartJS** for charts (donut, bars)

### Styling

- **Emotion CSS** for customizing antd styles
- **Custom CSS variables** for theme (colors, spacing)
- **CSS flex layout** for layouts

## Features to Migrate from Old-UI

### Core Features

1. **Dashboard**: Configuration statistics (port binds, listeners, routes, backends, policies, protocols)
2. **Configuration Management**:
   - Listeners (HTTP/HTTPS/TLS/TCP/HBONE protocols)
   - Routes (HTTP and TCP routes with matching conditions)
   - Backends (MCP targets, AI providers, service connections, hosts, dynamic)
   - Policies (JWT auth, MCP auth, ext authz, rate limiting, timeout, retry)
3. **Testing Tools**:
   - Playground (route testing, MCP client, A2A client, HTTP request testing)
   - CEL Playground (CEL expressions with Monaco editor and templates)
4. **Setup Wizard**: 6-step guided setup

### Technical Features

- REST API calls to AgentGateway server (localhost:15000)
- Support for static config and XDS mode
- Theme toggle (light/dark mode)
- Toast notifications
- Real-time data synchronization
- Complex forms with validation
- CRUD operations for all configuration types

## Implementation Steps

### Step 1: Dependencies and Configuration ✅

- Install: antd, framer-motion, lucide-react, chart.js, react-chartjs-2, @emotion/react, @emotion/styled, react-router-dom
- Update vite.config.ts for build optimization
- Configure TypeScript for React 19

### Step 2: Theming and Styling Foundation

- Create CSS custom variables in src/styles/theme.css
- Set up Emotion CSS integration in src/styles/emotion.ts
- Define global styles with CSS flex layouts
- Configure Antd theme customization

### Step 3: State Management with React Context

- Create ServerContext (API state, config data)
- Create LoadingContext (loading indicators)
- Create WizardContext (setup wizard flow)
- Implement context providers in src/contexts/

### Step 4: Routing and Navigation

- Install and configure React Router
- Create main layout with sidebar in src/components/Layout/
- Implement routes for all pages
- Add route-based navigation

### Step 5: Core UI Components

- Build reusable components using Antd with Emotion customization
- Integrate Framer Motion for animations
- Add Lucide React icons
- Create statistics cards, expandable sections, tables, modals

### Step 6: Dashboard Page

- Port dashboard with health checks
- Add statistics cards
- Integrate ChartJS for data visualization
- Implement navigation links

### Step 7: Configuration Management Pages

- Create Listeners page with CRUD operations
- Create Routes page with complex forms
- Create Backends page with various backend types
- Create Policies page with security/traffic/routing policies
- Use Antd forms with validation

### Step 8: Testing Tools

- Implement Playground page (route/MCP/A2A/HTTP testing)
- Recreate CEL Playground with Monaco editor
- Add testing interfaces and result displays

### Step 9: Setup Wizard

- Build 6-step guided setup flow
- Integrate WizardContext for state management
- Add progress indicators and validation
- Implement navigation between steps

### Step 10: API Integration

- Port API functions for server communication
- Support static and XDS modes
- Add error handling and toast notifications
- Implement data fetching patterns

### Step 11: Advanced Features

- Implement theme toggle (light/dark)
- Add loading states and spinners
- Implement real-time updates
- Ensure responsive design with CSS flex
- Add keyboard shortcuts and accessibility features

## Verification Checklist

- [ ] Development server starts successfully (`yarn dev`)
- [ ] All pages are accessible via navigation
- [ ] Configuration CRUD operations work
- [ ] API integration functions correctly
- [ ] Theming and animations work properly
- [ ] Forms validate correctly
- [ ] Playground testing tools function
- [ ] Setup wizard flow works end-to-end
- [ ] Production build succeeds (`yarn build`)
- [ ] No console errors in browser dev tools

## Notes

- Leverage existing schema-generated types from ../schema/config.json and cel.json
- Maintain feature parity with old-ui
- Focus on incremental development
- Test each feature as it's implemented
- Use CSS flex for all layouts (no Grid)
- Customize Antd with Emotion CSS (no Tailwind)

## Progress Tracking

**Current Status**: Step 1 - Dependencies and Configuration

**Last Updated**: February 23, 2026
