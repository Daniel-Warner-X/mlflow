import type { MCPAccessBinding, RegisteredTool } from '../types';
import { getEffectiveDisplayName } from './accessBindingUtils';
import { getDemoRegistryTools } from './demoRegistrySeed';

export const TOOLS_STORAGE_KEY = 'mlflow_registered_tools';
export const BINDINGS_STORAGE_KEY = 'mlflow_access_bindings';

export const generateBindingDescription = (
  binding: MCPAccessBinding,
  tools: RegisteredTool[] = [],
): string => {
  const server = tools.find((tool) => tool.internal_name === binding.server_name);
  const displayName = server ? getEffectiveDisplayName(server) : binding.server_name;
  const serverDescription = server?.description || server?.parsed_server_json?.description;

  if (serverDescription) {
    return `Connect to ${displayName} — ${serverDescription}`;
  }
  if (binding.server_alias) {
    return `Approved deployment of ${displayName} via @${binding.server_alias}.`;
  }
  return `Approved endpoint for ${displayName}.`;
};

const migrateBindingFields = (binding: MCPAccessBinding & { labels?: string[] }): MCPAccessBinding => {
  let migrated = binding;

  if (!migrated.tags && migrated.labels?.length) {
    const { labels, ...rest } = migrated;
    migrated = {
      ...rest,
      tags: labels.map((label) => ({ key: label, value: '' })),
    };
  } else if (migrated.labels) {
    const { labels, ...rest } = migrated;
    migrated = rest;
  }

  return migrated;
};

export const migrateBindings = (
  bindings: MCPAccessBinding[],
  tools: RegisteredTool[] = [],
): MCPAccessBinding[] =>
  bindings.map((binding) => {
    const withTags = migrateBindingFields(binding as MCPAccessBinding & { labels?: string[] });
    return withTags.description
      ? withTags
      : {
          ...withTags,
          description: generateBindingDescription(withTags, tools),
        };
  });

export const loadToolsFromStorage = (): RegisteredTool[] => {
  try {
    const stored = localStorage.getItem(TOOLS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tools from localStorage:', error);
  }

  const demoTools = getDemoRegistryTools();
  saveToolsToStorage(demoTools);
  return demoTools;
};

export const saveToolsToStorage = (tools: RegisteredTool[]) => {
  try {
    localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
  } catch (error) {
    console.error('Failed to save tools to localStorage:', error);
  }
};

export const loadRawBindingsFromStorage = (): MCPAccessBinding[] => {
  try {
    const stored = localStorage.getItem(BINDINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load bindings from localStorage:', error);
  }
  return [];
};

export const loadBindingsFromStorage = (tools: RegisteredTool[] = []): MCPAccessBinding[] =>
  migrateBindings(loadRawBindingsFromStorage(), tools);

export const saveBindingsToStorage = (bindings: MCPAccessBinding[]) => {
  try {
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch (error) {
    console.error('Failed to save bindings to localStorage:', error);
  }
};
