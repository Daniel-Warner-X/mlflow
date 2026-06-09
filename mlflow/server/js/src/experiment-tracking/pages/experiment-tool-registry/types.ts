import type { KeyValueEntity } from '../../../common/types';

export interface ToolAlias {
  alias: string;
  version: string;
}

export type MCPStatus = 'draft' | 'active' | 'deprecated' | 'deleted';

export interface MCPTool {
  name: string;
  description?: string;
}

export interface ToolVersion {
  version: string;
  description?: string;
  server_json?: string;
  status: MCPStatus;
  tools?: MCPTool[];
  tags?: Record<string, string>;
  source?: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
  metadata?: Array<{ key: string; value: string }>;
}

export interface ServerPackage {
  runtimeHint?: string; // e.g., "npx", "python", "node"
  identifier?: string; // e.g., "@modelcontextprotocol/server-brave-search"
  version?: string;
  registryType?: string; // e.g., "npm", "pypi"
  environmentVariables?: Array<{ [key: string]: any }>;
  runtimeArguments?: Array<{ [key: string]: any }>;
  packageArguments?: Array<{ [key: string]: any }>;
}

export interface ServerIcon {
  src?: string;
  mimeType?: string;
}

export interface ParsedServerJson {
  title?: string;
  description?: string;
  version?: string;
  websiteUrl?: string;
  repository?: {
    url?: string;
    source?: string;
  };
  packages?: ServerPackage[];
  icons?: ServerIcon[];
}

export interface RegisteredTool {
  internal_name: string; // From server.json name field, immutable
  display_name?: string; // Optional mutable override; falls back to server.json title when unset
  icons?: ServerIcon[]; // Optional mutable override; falls back to server.json icons when unset
  server_version?: string; // From server.json version field
  description?: string;
  server_json?: string; // Raw JSON string
  parsed_server_json?: ParsedServerJson; // Parsed fields from server.json
  latest_version?: string; // Our registry version tracking (1, 2, 3...)
  last_updated_timestamp?: number;
  tags?: Array<{ key: string; value: string }>;
  aliases?: ToolAlias[];
  versions?: ToolVersion[];
}

export interface ToolsTableMetadata {
  onEditTags?: (tool: RegisteredTool) => void;
  experimentId?: string;
}

export interface RegisteredToolDetailsResponse {
  tool?: RegisteredTool;
  versions: ToolVersion[];
}

export interface MCPAccessBinding {
  binding_id: string; // Auto-incrementing MLflow-managed identifier
  server_name: string; // Parent MCPServer name (FK)
  endpoint_url: string; // Required approved direct endpoint URL
  description?: string; // Optional human-readable description of this deployment
  tags?: KeyValueEntity[]; // Optional tags added after creation on the binding details page
  transport_type: 'streamable-http' | 'sse'; // Connection protocol
  server_version?: string; // Concrete version string (mutually exclusive with server_alias)
  server_alias?: string; // Alias name (mutually exclusive with server_version)
  workspace: string; // Workspace scope
  created_by: string;
  last_updated_by: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
}
