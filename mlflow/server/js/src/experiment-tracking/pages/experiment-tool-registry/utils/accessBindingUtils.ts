import type { MCPAccessBinding, MCPStatus, RegisteredTool, ToolVersion } from '../types';

export interface ServerRemote {
  type?: string;
  url?: string;
  headers?: Array<Record<string, unknown>>;
  variables?: Record<string, unknown>;
}

export const getEffectiveDisplayName = (tool: RegisteredTool): string =>
  tool.display_name || tool.parsed_server_json?.title || tool.internal_name;

export const resolveBindingVersion = (binding: MCPAccessBinding, tool?: RegisteredTool): string | undefined => {
  if (binding.server_version) {
    return binding.server_version;
  }
  if (binding.server_alias && tool?.aliases) {
    const alias = tool.aliases.find((a) => a.alias === binding.server_alias);
    return alias?.version;
  }
  if (tool?.latest_version) {
    return tool.latest_version;
  }
  return tool?.versions?.[0]?.version;
};

export const getBindingVersionLabel = (binding: MCPAccessBinding): string => {
  if (binding.server_alias) {
    return `@ ${binding.server_alias}`;
  }
  if (binding.server_version) {
    return `v${binding.server_version}`;
  }
  return 'Latest';
};

export const getVersionStatusColor = (status: MCPStatus) => {
  switch (status) {
    case 'active':
      return 'lime';
    case 'deprecated':
      return 'lemon';
    case 'deleted':
      return 'coral';
    case 'draft':
    default:
      return 'charcoal';
  }
};

export const getVersionStatusBadgeStyles = (status: MCPStatus) => {
  if (status === 'active') {
    return {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
    };
  }
  return {};
};

export const parseRemotesFromVersion = (version?: ToolVersion): ServerRemote[] => {
  if (!version?.server_json) {
    return [];
  }
  try {
    const parsed = JSON.parse(version.server_json);
    const serverData = parsed?.server || parsed;
    return Array.isArray(serverData?.remotes) ? serverData.remotes : [];
  } catch {
    return [];
  }
};

export const getTransportLabel = (transportType: MCPAccessBinding['transport_type']): string =>
  transportType === 'streamable-http' ? 'Streamable HTTP' : 'SSE';

export const buildMcpClientConfig = (
  binding: MCPAccessBinding,
  serverName: string,
  remotes: ServerRemote[] = [],
): string => {
  const clientType = binding.transport_type === 'sse' ? 'sse' : 'http';
  const serverConfig: Record<string, unknown> = {
    url: binding.endpoint_url,
    type: clientType,
  };

  const matchingRemote =
    remotes.find((remote) => remote.type === binding.transport_type) ||
    remotes.find((remote) => remote.type === 'streamable-http' || remote.type === 'sse') ||
    remotes[0];

  if (matchingRemote?.headers?.length) {
    const headers = matchingRemote.headers.filter((header) => header && Object.keys(header).length > 0);
    if (headers.length > 0) {
      serverConfig['headers'] = headers;
    }
  }

  return JSON.stringify(
    {
      mcpServers: {
        [serverName]: serverConfig,
      },
    },
    null,
    2,
  );
};
