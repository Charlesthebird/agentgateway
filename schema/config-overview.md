# AgentGateway Config Schema Overview

This document provides a high-level overview of the JSON schema for AgentGateway configuration files. It summarizes the main sections and resource types, along with their relationships. For detailed specifications, refer to the links to the schema file.

## Top-Level Structure

The configuration is an object with the following properties:

- **config**: Global configuration settings ([RawConfig](config.json#L61))
- **binds**: Port bindings to listeners ([LocalBind](config.json#L556))
- **frontendPolicies**: Policies applied at the frontend level ([LocalFrontendPolicies](config.json#L4469))
- **policies**: Additional policies that can be attached to other configurations ([LocalPolicy](config.json#L4828))
- **workloads**: Workload definitions (default empty array)
- **services**: Service definitions (default empty array)
- **backends**: Backend host definitions ([FullLocalBackend](config.json#L5041))
- **llm**: LLM (Large Language Model) configuration ([LocalLLMConfig](config.json#L5055))
- **mcp**: MCP (Model Context Protocol) configuration ([LocalSimpleMcpConfig](config.json#L5326))

## Resource Types and Relationships

### Core Resources

1. **Listeners** ([LocalListener](config.json#L575)): Define how the gateway listens for incoming requests. Each listener is associated with a bind (port) and can have:
   - Hostname (can be wildcard)
   - Protocol (HTTP, HTTPS, TLS, TCP, HBONE)
   - TLS configuration
   - Routes for HTTP/HTTPS
   - TCP routes for TCP
   - Policies

2. **Routes** ([LocalRoute](config.json#L723)): Define how requests are matched and routed. Routes belong to listeners and include:
   - Hostnames
   - Match conditions (headers, path, method)
   - Policies
   - Backends to route to

3. **Backends** ([FullLocalBackend](config.json#L5041)): Define destination hosts. Backends are referenced by routes and have:
   - Name
   - Host address
   - Policies

### Policies

Policies can be attached at multiple levels:

- Frontend policies: Applied globally or at the listener level
- Route policies: Applied to specific routes
- Backend policies: Applied to backends
- Additional policies: Defined separately and referenced

### Specialized Configurations

- **LLM Config**: Configures LLM models and associated policies ([LocalLLMConfig](config.json#L5055))
- **MCP Config**: Configures Model Context Protocol settings ([LocalSimpleMcpConfig](config.json#L5326))

## Relationships Diagram

```
Binds (Ports)
  ↓
Listeners (Protocols, Hostnames)
  ↓
Routes (Matches)
  ↓
Backends (Hosts)
```

Policies can be attached at any level in this hierarchy.

For more details on any section, click the links to navigate to the specific part of the schema.</content>
<parameter name="filePath">/Users/nicholasbucher/Documents/code/agentgateway-fork/schema/config-overview.md
