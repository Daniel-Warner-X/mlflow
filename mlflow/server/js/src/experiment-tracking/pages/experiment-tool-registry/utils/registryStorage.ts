import type { MCPAccessBinding, RegisteredTool } from '../types';
import { getEffectiveDisplayName } from './accessBindingUtils';

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

export const migrateBindings = (
  bindings: MCPAccessBinding[],
  tools: RegisteredTool[] = [],
): MCPAccessBinding[] =>
  bindings.map((binding) =>
    binding.description
      ? binding
      : {
          ...binding,
          description: generateBindingDescription(binding, tools),
        },
  );

export const loadToolsFromStorage = (): RegisteredTool[] => {
  try {
    const stored = localStorage.getItem(TOOLS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tools from localStorage:', error);
  }
  return [];
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
