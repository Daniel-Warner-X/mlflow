import demoServerDefinitions from '../data/demo-mcp-servers.json';
import type { ParsedServerJson, RegisteredTool, ToolVersion } from '../types';

type RegistryServerJson = {
  name: string;
  title?: string;
  description?: string;
  version?: string;
  websiteUrl?: string;
  repository?: {
    url?: string;
    source?: string;
  };
  packages?: ParsedServerJson['packages'];
  icons?: ParsedServerJson['icons'];
};

const parseServerJsonFields = (serverData: RegistryServerJson): ParsedServerJson => ({
  title: serverData.title,
  description: serverData.description,
  version: serverData.version,
  websiteUrl: serverData.websiteUrl,
  repository: serverData.repository
    ? {
        url: serverData.repository.url,
        source: serverData.repository.source,
      }
    : undefined,
  packages: serverData.packages,
  icons: serverData.icons,
});

export const registeredToolFromServerJson = (serverData: RegistryServerJson, index: number): RegisteredTool => {
  const serverJson = JSON.stringify(serverData, null, 2);
  const parsedServerJson = parseServerJsonFields(serverData);
  const timestamp = Date.now() - index * 60_000;

  const version: ToolVersion = {
    version: '1',
    description: serverData.description,
    server_json: serverJson,
    status: 'active',
    source: serverData.repository?.url,
    tags: { catalog: 'official-mcp-registry' },
    creation_timestamp: timestamp,
    last_updated_timestamp: timestamp,
  };

  return {
    internal_name: serverData.name,
    description: serverData.description,
    server_version: serverData.version,
    server_json: serverJson,
    parsed_server_json: parsedServerJson,
    latest_version: '1',
    last_updated_timestamp: timestamp,
    tags: [],
    aliases: [],
    versions: [version],
  };
};

export const getDemoRegistryTools = (): RegisteredTool[] =>
  (demoServerDefinitions as RegistryServerJson[]).map(registeredToolFromServerJson);
