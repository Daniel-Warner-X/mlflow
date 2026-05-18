export interface ToolAlias {
  alias: string;
  version: string;
}

export interface ToolVersion {
  version: string;
  description?: string;
  server_json?: string;
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
  icons?: Array<{
    src?: string;
    mimeType?: string;
  }>;
}

export interface RegisteredTool {
  internal_name: string; // From server.json name field, immutable
  display_name?: string; // Optional, mutable, user-friendly override
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

export interface DirectAccessBinding {
  id: string;
  endpoint: string;
  server_name: string;
  version?: string;
  alias?: string;
  credential_ref?: string;
  status: 'active' | 'deprecated' | 'health-check';
  created_timestamp: number;
  last_updated_timestamp: number;
  metadata?: Array<{ key: string; value: string }>;
  health_check?: {
    interval_seconds: number;
    timeout_seconds: number;
    endpoint_path: string;
  };
}
