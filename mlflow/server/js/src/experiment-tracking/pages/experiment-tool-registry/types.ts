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

export interface RegisteredTool {
  name: string;
  description?: string;
  server_json?: string;
  latest_version?: string;
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
