# Design History

This file contains a chronological record of key design updates and decisions for the MCP Registry. See `.design/README.md` for format guidelines.

---

## 2026-05-18

### [Decision] Internal name and display name architecture
- Internal name extracted from server.json automatically (immutable, required)
- Display name is optional user-friendly override (mutable)
- Server version also extracted from server.json when present
- Rationale: Server.json already contains required name field (e.g., io.github.anthropic/brave-search), so user doesn't need to re-enter it

### [Decision] Alias scoping behavior
- Aliases are scoped per-server, not globally unique
- Each MCP server can have its own "champion", "production", etc.
- Rationale: Matches prompts behavior and aligns with user mental model

### [Decision] Reserved "latest" alias
- Users cannot assign the "latest" alias (case-insensitive) to any version
- Shows error alert in alias editor modal
- Rationale: Consistent with prompts and other MLflow entities

## 2026-05-14

### [Update] Initial MCP Registry design created
- Added registry list view with filters and search
- Added server details page with version management
- Added endpoints view for direct access bindings
- Deployed demo at https://daniel-warner-x.github.io/mlflow/

### [Decision] Dual-view structure
- Registry view shows all registered MCP servers
- Endpoints view shows direct access bindings to server instances
- Rationale: Separates conceptual registration from runtime bindings

### [Update] Empty states
- Added centered empty states with icons for zero-data scenarios
- Includes call-to-action buttons to create first server/endpoint

### [Decision] localStorage-based demo implementation
- Tool and endpoint data stored in browser localStorage
- Enables static deployment for design previews
- Rationale: Allows sharing live demos without backend infrastructure
