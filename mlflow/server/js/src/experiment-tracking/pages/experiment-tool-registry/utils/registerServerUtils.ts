import type { MCPTool, RegisteredTool, ServerIcon, ToolVersion } from '../types';

export const parseTagsInput = (input: string): Record<string, string> | undefined => {
  if (!input.trim()) {
    return undefined;
  }

  const tags: Record<string, string> = {};
  input.split(',').forEach((pair) => {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }
    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key && value) {
      tags[key] = value;
    }
  });

  return Object.keys(tags).length > 0 ? tags : undefined;
};

export const parseToolsInput = (input: string): MCPTool[] | undefined => {
  if (!input.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    const tools = parsed
      .filter((tool): tool is MCPTool => typeof tool?.name === 'string' && tool.name.trim().length > 0)
      .map((tool) => ({
        name: tool.name.trim(),
        description: typeof tool.description === 'string' ? tool.description : undefined,
      }));
    return tools.length > 0 ? tools : undefined;
  } catch {
    return undefined;
  }
};

export const parseSvgIconInput = (input: string): ServerIcon[] | undefined | null => {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('data:image/svg+xml')) {
    return [{ src: trimmed, mimeType: 'image/svg+xml' }];
  }

  if (!/<svg[\s>]/i.test(trimmed)) {
    return null;
  }

  return [{ src: `data:image/svg+xml,${encodeURIComponent(trimmed)}`, mimeType: 'image/svg+xml' }];
};

export const formatTagsForInput = (tags?: Record<string, string>): string => {
  if (!tags) {
    return '';
  }

  return Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
};

export const formatToolsForInput = (tools?: MCPTool[]): string => {
  if (!tools?.length) {
    return '';
  }

  return JSON.stringify(tools, null, 2);
};

export const formatIconSrcForInput = (icons?: ServerIcon[]): string => {
  const src = icons?.[0]?.src;
  if (!src) {
    return '';
  }

  if (!src.startsWith('data:image/svg+xml')) {
    return '';
  }

  const commaIndex = src.indexOf(',');
  if (commaIndex === -1) {
    return '';
  }

  const payload = src.slice(commaIndex + 1);
  try {
    if (src.includes(';base64,')) {
      return atob(payload);
    }
    return decodeURIComponent(payload);
  } catch {
    return '';
  }
};

export const buildRegisterToolFormValues = (tool: RegisteredTool, version?: ToolVersion) => {
  const sourceVersion = version ?? tool.versions?.[0];
  const serverJson = sourceVersion?.server_json ?? tool.server_json ?? '';

  let formattedServerJson = serverJson;
  if (serverJson) {
    try {
      formattedServerJson = JSON.stringify(JSON.parse(serverJson), null, 2);
    } catch {
      formattedServerJson = serverJson;
    }
  }

  return {
    serverJson: formattedServerJson,
    displayName: tool.display_name ?? '',
    status: sourceVersion?.status ?? 'draft',
    source: sourceVersion?.source ?? '',
    tags: formatTagsForInput(sourceVersion?.tags),
    tools: formatToolsForInput(sourceVersion?.tools),
    iconSvg: formatIconSrcForInput(tool.icons),
  };
};
