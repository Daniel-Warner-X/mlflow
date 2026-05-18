import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Header,
  Spacer,
  WrenchIcon,
  useDesignSystemTheme,
  SegmentedControlGroup,
  SegmentedControlButton,
} from '@databricks/design-system';
import { FormattedMessage } from 'react-intl';
import { ScrollablePageWrapper } from '@mlflow/mlflow/src/common/components/ScrollablePageWrapper';
import { ToolRegistryListFilters } from './components/ToolRegistryListFilters';
import { ToolRegistryListTable } from './components/ToolRegistryListTable';
import { AccessBindingsTable } from './components/AccessBindingsTable';
import { useRegisterToolModal } from './hooks/useRegisterToolModal';
import { useCreateEndpointModal } from './hooks/useCreateEndpointModal';
import { useEditEndpointModal } from './hooks/useEditEndpointModal';
import type { RegisteredTool, ToolVersion, DirectAccessBinding } from './types';

const TOOLS_STORAGE_KEY = 'mlflow_registered_tools';
const BINDINGS_STORAGE_KEY = 'mlflow_access_bindings';

// Helper to load tools from localStorage
const loadToolsFromStorage = (): RegisteredTool[] => {
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

// Helper to save tools to localStorage
const saveToolsToStorage = (tools: RegisteredTool[]) => {
  try {
    localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(tools));
  } catch (error) {
    console.error('Failed to save tools to localStorage:', error);
  }
};

// Helper to load bindings from localStorage
const loadBindingsFromStorage = (): DirectAccessBinding[] => {
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

// Helper to save bindings to localStorage
const saveBindingsToStorage = (bindings: DirectAccessBinding[]) => {
  try {
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch (error) {
    console.error('Failed to save bindings to localStorage:', error);
  }
};

enum ViewMode {
  REGISTRY = 'registry',
  ACCESS_BINDINGS = 'access-bindings',
}

const ToolRegistryPage = ({ experimentId }: { experimentId?: string } = {}) => {
  const { theme } = useDesignSystemTheme();
  const [searchFilter, setSearchFilter] = useState('');
  const [tools, setTools] = useState<RegisteredTool[]>([]);
  const [bindings, setBindings] = useState<DirectAccessBinding[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.REGISTRY);
  const componentId = experimentId ? 'mlflow.tool-registry.experiment.list' : 'mlflow.tool-registry.global.list';

  // Load tools and bindings from localStorage on mount
  useEffect(() => {
    const loadedTools = loadToolsFromStorage();
    const loadedBindings = loadBindingsFromStorage();

    // Migrate tools from old structure (name -> internal_name)
    const migratedTools = loadedTools.map((t: any) => {
      if (t.name && !t.internal_name) {
        return {
          ...t,
          internal_name: t.name,
          display_name: undefined,
          server_version: undefined,
        };
      }
      return t;
    });

    // Save migrated tools if any were updated
    if (migratedTools.some((t: any, i: number) => t !== loadedTools[i])) {
      saveToolsToStorage(migratedTools);
      setTools(migratedTools);
    } else {
      setTools(loadedTools);
    }

    setBindings(loadedBindings);
  }, []);

  // Save tools to localStorage whenever they change
  useEffect(() => {
    if (tools.length > 0) {
      saveToolsToStorage(tools);
    }
  }, [tools]);

  // Save bindings to localStorage whenever they change
  useEffect(() => {
    if (bindings.length > 0) {
      saveBindingsToStorage(bindings);
    }
  }, [bindings]);

  // Mock loading state - in a real implementation, this would come from a query hook
  const isLoading = false;
  const error = undefined;
  const hasNextPage = false;
  const hasPreviousPage = false;

  const handleNextPage = () => {
    // Pagination logic would go here
  };

  const handlePreviousPage = () => {
    // Pagination logic would go here
  };

  const { RegisterToolModal, openModal: openRegisterToolModal } = useRegisterToolModal({
    experimentId,
    onSuccess: ({ internalName, displayName, serverVersion, description, serverJson, parsedServerJson }) => {
      setTools((prevTools) => {
        // Check if a tool with this internal_name already exists
        const existingToolIndex = prevTools.findIndex((tool) => tool.internal_name === internalName);
        const timestamp = Date.now();

        if (existingToolIndex >= 0) {
          // Update existing tool - create new version
          const existingTool = prevTools[existingToolIndex];
          const currentVersion = parseInt(existingTool.latest_version || '1', 10);
          const newVersion = (currentVersion + 1).toString();

          const newToolVersion: ToolVersion = {
            version: newVersion,
            description: description || undefined,
            server_json: serverJson || undefined,
            creation_timestamp: timestamp,
            last_updated_timestamp: timestamp,
          };

          const updatedTool: RegisteredTool = {
            ...existingTool,
            display_name: displayName,
            server_version: serverVersion,
            description: description || existingTool.description,
            server_json: serverJson || existingTool.server_json,
            parsed_server_json: parsedServerJson,
            latest_version: newVersion,
            last_updated_timestamp: timestamp,
            versions: [newToolVersion, ...(existingTool.versions || [])],
          };

          // Move updated tool to the top of the list
          const newTools = [...prevTools];
          newTools.splice(existingToolIndex, 1);
          return [updatedTool, ...newTools];
        } else {
          // Add new tool with initial version
          const initialVersion: ToolVersion = {
            version: '1',
            description: description || undefined,
            server_json: serverJson || undefined,
            creation_timestamp: timestamp,
            last_updated_timestamp: timestamp,
          };

          const newTool: RegisteredTool = {
            internal_name: internalName,
            display_name: displayName,
            server_version: serverVersion,
            description: description || undefined,
            server_json: serverJson || undefined,
            parsed_server_json: parsedServerJson,
            latest_version: '1',
            last_updated_timestamp: timestamp,
            tags: [],
            aliases: [],
            versions: [initialVersion],
          };
          return [newTool, ...prevTools];
        }
      });
    },
  });

  // Filter tools based on search
  const filteredTools = useMemo(() => {
    if (!searchFilter) {
      return tools;
    }
    const lowerSearch = searchFilter.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.internal_name.toLowerCase().includes(lowerSearch) ||
        (tool.display_name && tool.display_name.toLowerCase().includes(lowerSearch)) ||
        (tool.description && tool.description.toLowerCase().includes(lowerSearch)),
    );
  }, [tools, searchFilter]);

  // Filter bindings based on search
  const filteredBindings = useMemo(() => {
    if (!searchFilter) {
      return bindings;
    }
    const lowerSearch = searchFilter.toLowerCase();
    return bindings.filter(
      (binding) =>
        binding.endpoint.toLowerCase().includes(lowerSearch) ||
        binding.server_name.toLowerCase().includes(lowerSearch) ||
        (binding.alias && binding.alias.toLowerCase().includes(lowerSearch)),
    );
  }, [bindings, searchFilter]);

  const { CreateEndpointModal, openModal: openCreateEndpointModal } = useCreateEndpointModal({
    tools,
    onSuccess: () => {
      // Reload bindings from storage
      const loadedBindings = loadBindingsFromStorage();
      setBindings(loadedBindings);
    },
  });

  const { EditEndpointModal, openEditModal: openEditEndpointModal } = useEditEndpointModal({
    tools,
    onSuccess: () => {
      // Reload bindings from storage
      const loadedBindings = loadBindingsFromStorage();
      setBindings(loadedBindings);
    },
  });

  const handleCreateBinding = () => {
    openCreateEndpointModal();
  };

  const handleEditBinding = (binding: DirectAccessBinding) => {
    openEditEndpointModal(binding);
  };

  const isEmptyState = !isLoading && !error && !tools?.length && !searchFilter;
  const showCreationButtons = !isEmptyState;

  const createButton = showCreationButtons && (
    <Button
      componentId={`${componentId}.create`}
      data-testid="create-mcp-server-button"
      type="primary"
      onClick={openRegisterToolModal}
    >
      <FormattedMessage
        defaultMessage="Create MCP server"
        description="Label for the create MCP server button on the MCP registry page"
      />
    </Button>
  );

  const Wrapper = experimentId ? 'div' : ScrollablePageWrapper;

  return (
    <Wrapper css={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
      {!experimentId && (
        <>
          <Spacer shrinks={false} />
          <Header
            title={
              <span css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <span
                  css={{
                    display: 'flex',
                    borderRadius: theme.borders.borderRadiusSm,
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: theme.spacing.sm,
                  }}
                >
                  <WrenchIcon />
                </span>
                <FormattedMessage defaultMessage="MCP Registry" description="Header title for the MCP registry page" />
              </span>
            }
            buttons={createButton}
          />
          <Spacer shrinks={false} />
        </>
      )}
      <div css={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div css={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <SegmentedControlGroup
            name="mcp-registry-view-mode"
            componentId={`${componentId}.view_mode`}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
          >
            <SegmentedControlButton value={ViewMode.REGISTRY}>
              <FormattedMessage defaultMessage="Registry" description="Tab label for MCP server registry view" />
            </SegmentedControlButton>
            <SegmentedControlButton value={ViewMode.ACCESS_BINDINGS}>
              <FormattedMessage
                defaultMessage="Endpoints"
                description="Tab label for MCP server endpoints view"
              />
            </SegmentedControlButton>
          </SegmentedControlGroup>
        </div>
        <div css={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm }}>
          <div css={{ flex: 1 }}>
            <ToolRegistryListFilters
              searchFilter={searchFilter}
              onSearchFilterChange={setSearchFilter}
              componentId={`${componentId}.search`}
            />
          </div>
          {experimentId && createButton}
        </div>
        <Spacer />
        {viewMode === ViewMode.REGISTRY ? (
          <ToolRegistryListTable
            tools={filteredTools}
            error={error}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isLoading={isLoading}
            isFiltered={Boolean(searchFilter)}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            experimentId={experimentId}
            onCreateTool={openRegisterToolModal}
            componentId={componentId}
          />
        ) : (
          <AccessBindingsTable
            bindings={filteredBindings}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isLoading={isLoading}
            isFiltered={Boolean(searchFilter)}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onCreateBinding={handleCreateBinding}
            onEditBinding={handleEditBinding}
            componentId={`${componentId}.bindings`}
          />
        )}
      </div>
      {RegisterToolModal}
      {CreateEndpointModal}
      {EditEndpointModal}
    </Wrapper>
  );
};

export default ToolRegistryPage;
