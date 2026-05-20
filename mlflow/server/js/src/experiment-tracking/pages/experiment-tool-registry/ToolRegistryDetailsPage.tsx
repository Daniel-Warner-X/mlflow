import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from '../../../common/utils/RoutingUtils';
import { ScrollablePageWrapper } from '../../../common/components/ScrollablePageWrapper';
import {
  Breadcrumb,
  Button,
  ColumnsIcon,
  DropdownMenu,
  Header,
  OverflowIcon,
  SegmentedControlButton,
  SegmentedControlGroup,
  Spacer,
  useDesignSystemTheme,
  GenericSkeleton,
  TableSkeleton,
  ZoomMarqueeSelection,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import Routes from '../../routes';
import type { RegisteredTool, ToolVersion } from './types';
import Utils from '../../../common/utils/Utils';
import { ExperimentPageTabName } from '../../constants';
import { useRegisterToolModal } from './hooks/useRegisterToolModal';
import { ToolVersionsTable } from './components/ToolVersionsTable';
import { ToolContentPreview } from './components/ToolContentPreview';
import { ToolContentCompare } from './components/ToolContentCompare';
import { useEditAliasesModal } from '../../../common/hooks/useEditAliasesModal';
import { useUpdateToolVersionMetadataModal } from './hooks/useUpdateToolVersionMetadataModal';
import { DirectAccessBindingsList } from './components/DirectAccessBindingsList';
import { useEditEndpointModal } from './hooks/useEditEndpointModal';
import { useUpdateVersionStatusModal } from './hooks/useUpdateVersionStatusModal';
import { useToolDetailsPageViewState, ToolVersionsTableMode } from './hooks/useToolDetailsPageViewState';

const TOOLS_STORAGE_KEY = 'mlflow_registered_tools';

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

const ToolRegistryDetailsPage = ({ experimentId }: { experimentId?: string } = {}) => {
  const { toolName } = useParams<{ toolName: string }>();
  const { theme } = useDesignSystemTheme();
  const navigate = useNavigate();
  const intl = useIntl();
  const [tool, setTool] = useState<RegisteredTool | null>(null);
  const [allTools, setAllTools] = useState<RegisteredTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>();

  const decodedToolName = toolName ? decodeURIComponent(toolName) : '';

  const toolDetailsData = useMemo(() => {
    if (!tool) return undefined;
    return { tool, versions: tool.versions || [] };
  }, [tool]);

  const {
    viewState,
    setPreviewMode,
    setCompareMode,
    switchSides,
    setComparedVersion,
  } = useToolDetailsPageViewState(toolDetailsData, selectedVersion, setSelectedVersion);

  const { mode } = viewState;

  useEffect(() => {
    if (!toolName) {
      setIsLoading(false);
      return;
    }

    // Load all tools from localStorage
    const tools = loadToolsFromStorage();

    // Migrate tools from old structure (name -> internal_name)
    const migratedTools = tools.map((t: any) => {
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
    if (migratedTools.some((t: any, i: number) => t !== tools[i])) {
      saveToolsToStorage(migratedTools);
    }

    setAllTools(migratedTools);
    let foundTool = migratedTools.find((t) => t.internal_name === decodedToolName);

    // Migrate versions without status field
    if (foundTool?.versions) {
      const hasVersionsWithoutStatus = foundTool.versions.some((v: any) => !v.status);
      if (hasVersionsWithoutStatus) {
        foundTool = {
          ...foundTool,
          versions: foundTool.versions.map((v: any) => ({
            ...v,
            status: v.status || 'draft',
          })),
        };

        // Save the migrated tool back to localStorage
        const toolIndex = migratedTools.findIndex((t) => t.internal_name === decodedToolName);
        if (toolIndex >= 0) {
          migratedTools[toolIndex] = foundTool;
          saveToolsToStorage(migratedTools);
        }
      }
    }

    // Migrate old tools without versions array
    if (foundTool && (!foundTool.versions || foundTool.versions.length === 0)) {
      const migratedVersion: ToolVersion = {
        version: foundTool.latest_version || '1',
        description: foundTool.description,
        server_json: foundTool.server_json,
        status: 'draft',
        creation_timestamp: foundTool.last_updated_timestamp || Date.now(),
        last_updated_timestamp: foundTool.last_updated_timestamp || Date.now(),
      };

      foundTool = {
        ...foundTool,
        versions: [migratedVersion],
        aliases: foundTool.aliases || [],
      };

      // Save the migrated tool back to localStorage
      const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);
      if (toolIndex >= 0) {
        tools[toolIndex] = foundTool;
        saveToolsToStorage(tools);
      }
    }

    setTool(foundTool || null);

    // Set selected version to latest version
    if (foundTool?.versions && foundTool.versions.length > 0) {
      setSelectedVersion(foundTool.versions[0].version);
    }

    setIsLoading(false);
  }, [toolName, decodedToolName]);

  const refetch = () => {
    const tools = loadToolsFromStorage();
    const foundTool = tools.find((t) => t.internal_name === decodedToolName);
    setTool(foundTool || null);
  };

  const handleUpdateTool = (updatedTool: RegisteredTool) => {
    const tools = loadToolsFromStorage();
    const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);

    if (toolIndex >= 0) {
      tools[toolIndex] = updatedTool;
      saveToolsToStorage(tools);
      setTool(updatedTool);
    }
  };

  const { RegisterToolModal, openModal: openCreateVersionModal } = useRegisterToolModal({
    experimentId,
    onSuccess: ({ internalName, displayName, serverVersion, serverJson, parsedServerJson }) => {
      const tools = loadToolsFromStorage();
      const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);

      if (toolIndex >= 0) {
        const existingTool = tools[toolIndex];
        const currentVersion = parseInt(existingTool.latest_version || '1', 10);
        const newVersion = (currentVersion + 1).toString();
        const timestamp = Date.now();

        const newToolVersion: ToolVersion = {
          version: newVersion,
          server_json: serverJson || undefined,
          status: 'draft',
          creation_timestamp: timestamp,
          last_updated_timestamp: timestamp,
        };

        const updatedTool: RegisteredTool = {
          ...existingTool,
          display_name: displayName,
          server_version: serverVersion,
          parsed_server_json: parsedServerJson,
          latest_version: newVersion,
          last_updated_timestamp: timestamp,
          versions: [newToolVersion, ...(existingTool.versions || [])],
        };

        tools[toolIndex] = updatedTool;
        saveToolsToStorage(tools);
        setTool(updatedTool);
        setSelectedVersion(newVersion);
      }
    },
  });

  const handleDelete = () => {
    if (!tool) return;

    const tools = loadToolsFromStorage();
    const updatedTools = tools.filter((t) => t.internal_name !== tool.internal_name);
    saveToolsToStorage(updatedTools);

    // Navigate back to MCP Registry
    navigate(
      experimentId
        ? Routes.getExperimentPageTabRoute(experimentId, ExperimentPageTabName.ToolRegistry)
        : Routes.toolsPageRoute,
    );
  };

  const handleDeleteVersion = (version: string) => {
    if (!tool) return;

    const tools = loadToolsFromStorage();
    const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);

    if (toolIndex >= 0) {
      const updatedVersions = (tool.versions || []).filter((v) => v.version !== version);

      if (updatedVersions.length === 0) {
        // If no versions left, delete the entire tool
        handleDelete();
        return;
      }

      const updatedTool: RegisteredTool = {
        ...tool,
        versions: updatedVersions,
        latest_version: updatedVersions[0]?.version,
        last_updated_timestamp: Date.now(),
      };

      tools[toolIndex] = updatedTool;
      saveToolsToStorage(tools);
      setTool(updatedTool);

      // Update selected version if the deleted one was selected
      if (selectedVersion === version && updatedVersions.length > 0) {
        setSelectedVersion(updatedVersions[0].version);
      }
    }
  };

  const selectedVersionEntity = tool?.versions?.find((v) => v.version === selectedVersion);
  const comparedVersionEntity = tool?.versions?.find((v) => v.version === viewState.comparedVersion);

  const aliasesByVersion = useMemo(() => {
    const result: Record<string, string[]> = {};
    tool?.aliases?.forEach(({ alias, version }) => {
      if (!result[version]) {
        result[version] = [];
      }
      result[version].push(alias);
    });
    return result;
  }, [tool]);

  const getAliasesModalTitle = (version: string) => (
    <FormattedMessage
      defaultMessage="Add/edit alias for MCP server version {version}"
      description="Title for the edit aliases modal on the MCP server details page"
      values={{ version }}
    />
  );

  const { EditAliasesModal, showEditAliasesModal } = useEditAliasesModal({
    aliases: tool?.aliases ?? [],
    onSuccess: refetch,
    getTitle: getAliasesModalTitle,
    onSave: async (currentlyEditedVersion: string, existingAliases: string[], draftAliases: string[]) => {
      if (!tool) return;

      const tools = loadToolsFromStorage();
      const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);

      if (toolIndex >= 0) {
        // Remove old aliases for this version
        const otherAliases = (tool.aliases || []).filter((a) => a.version !== currentlyEditedVersion);

        // Add new aliases for this version
        const newAliases = draftAliases.map((alias) => ({
          alias,
          version: currentlyEditedVersion,
        }));

        const updatedTool: RegisteredTool = {
          ...tool,
          aliases: [...otherAliases, ...newAliases],
        };

        tools[toolIndex] = updatedTool;
        saveToolsToStorage(tools);
        setTool(updatedTool);
      }
    },
    description: (
      <FormattedMessage
        defaultMessage="Aliases allow you to assign a mutable, named reference to a particular MCP server version."
        description="Description for the edit aliases modal on the MCP server details page"
      />
    ),
  });

  const { EditToolVersionMetadataModal, showEditToolVersionMetadataModal } = useUpdateToolVersionMetadataModal({
    onSuccess: ({ toolName, toolVersion, newMetadata }) => {
      const tools = loadToolsFromStorage();
      const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);

      if (toolIndex >= 0) {
        const updatedVersions = (tool?.versions || []).map((v) => {
          if (v.version === toolVersion) {
            return {
              ...v,
              metadata: newMetadata,
            };
          }
          return v;
        });

        const updatedTool: RegisteredTool = {
          ...(tool || tools[toolIndex]),
          versions: updatedVersions,
        };

        tools[toolIndex] = updatedTool;
        saveToolsToStorage(tools);
        setTool(updatedTool);
      }
    },
  });

  const { EditEndpointModal, openEditModal: openEditEndpointModal } = useEditEndpointModal({
    tools: allTools,
    onSuccess: () => {
      // Trigger a re-render to refresh the bindings list
      refetch();
    },
  });

  const { UpdateVersionStatusModal, openUpdateVersionStatusModal } = useUpdateVersionStatusModal({
    onSuccess: ({ toolName, version, newStatus }) => {
      const tools = loadToolsFromStorage();
      const toolIndex = tools.findIndex((t) => t.internal_name === decodedToolName);

      if (toolIndex >= 0) {
        const updatedVersions = (tool?.versions || []).map((v) => {
          if (v.version === version) {
            return {
              ...v,
              status: newStatus,
            };
          }
          return v;
        });

        const updatedTool: RegisteredTool = {
          ...(tool || tools[toolIndex]),
          versions: updatedVersions,
        };

        tools[toolIndex] = updatedTool;
        saveToolsToStorage(tools);
        setTool(updatedTool);
      }
    },
  });

  const breadcrumbs = !experimentId ? (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Link componentId="mlflow.tool-registry.details.breadcrumb_link" to={Routes.toolsPageRoute}>
          <FormattedMessage defaultMessage="MCP Registry" description="Breadcrumb label for MCP Registry" />
        </Link>
      </Breadcrumb.Item>
    </Breadcrumb>
  ) : undefined;

  if (isLoading) {
    return (
      <ScrollablePageWrapper>
        <Spacer shrinks={false} />
        <Header
          breadcrumbs={breadcrumbs}
          title={<GenericSkeleton css={{ height: theme.general.heightBase, width: 200 }} />}
          buttons={<GenericSkeleton css={{ height: theme.general.heightBase, width: 120 }} />}
        />
        <Spacer shrinks={false} />
        <TableSkeleton lines={4} />
      </ScrollablePageWrapper>
    );
  }

  if (!tool) {
    return (
      <ScrollablePageWrapper>
        <Spacer shrinks={false} />
        <Header breadcrumbs={breadcrumbs} title={decodedToolName || 'Not Found'} />
        <Spacer shrinks={false} />
        <div>
          <FormattedMessage
            defaultMessage="MCP server not found"
            description="Error message when MCP server is not found"
          />
        </div>
      </ScrollablePageWrapper>
    );
  }

  const isEmptyVersions = !isLoading && !tool?.versions?.length;
  const showPreviewPane = !isLoading && !isEmptyVersions;

  return (
    <ScrollablePageWrapper css={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Spacer shrinks={false} />
      <Header
        breadcrumbs={breadcrumbs}
        title={tool.display_name || tool.internal_name}
        buttons={
          <>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  componentId="mlflow.tool-registry.details.actions"
                  icon={<OverflowIcon />}
                  aria-label="More actions"
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item componentId="mlflow.tool-registry.details.actions.delete" onClick={handleDelete}>
                  <FormattedMessage
                    defaultMessage="Delete"
                    description="Label for the delete MCP server action on the MCP server details page"
                  />
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <Button componentId="mlflow.tool-registry.details.create" type="primary" onClick={openCreateVersionModal}>
              <FormattedMessage
                defaultMessage="Create MCP server version"
                description="Label for the create MCP server version button"
              />
            </Button>
          </>
        }
      />
      <Spacer shrinks={false} />
      {!isEmptyVersions && (
        <>
          <div css={{ display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <SegmentedControlGroup
              name="tool-version-mode"
              componentId="mlflow.tool-registry.details.mode"
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value as ToolVersionsTableMode;
                if (newMode === ToolVersionsTableMode.PREVIEW) {
                  setPreviewMode();
                } else {
                  setCompareMode();
                }
              }}
            >
              <SegmentedControlButton value={ToolVersionsTableMode.PREVIEW}>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <ZoomMarqueeSelection />
                  <FormattedMessage
                    defaultMessage="Preview"
                    description="Label for the preview mode on the MCP server details page"
                  />
                </div>
              </SegmentedControlButton>
              <SegmentedControlButton value={ToolVersionsTableMode.COMPARE}>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <ColumnsIcon />{' '}
                  <FormattedMessage
                    defaultMessage="Compare"
                    description="Label for the compare mode on the MCP server details page"
                  />
                </div>
              </SegmentedControlButton>
            </SegmentedControlGroup>
          </div>
        </>
      )}
      <div css={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div css={{ flex: showPreviewPane ? '0 0 320px' : 1, display: 'flex', flexDirection: 'column' }}>
          <ToolVersionsTable
            isLoading={isLoading}
            registeredTool={tool}
            toolVersions={tool?.versions}
            selectedVersion={selectedVersion}
            comparedVersion={viewState.comparedVersion}
            onUpdateSelectedVersion={setSelectedVersion}
            onUpdateComparedVersion={setComparedVersion}
            mode={mode}
            aliasesByVersion={aliasesByVersion}
            showEditAliasesModal={showEditAliasesModal}
          />
        </div>
        {showPreviewPane && (
          <div css={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div css={{ borderLeft: `1px solid ${theme.colors.border}`, flex: 1, overflow: 'hidden', display: 'flex' }}>
              {mode === ToolVersionsTableMode.PREVIEW ? (
                <ToolContentPreview
                  toolVersion={selectedVersionEntity}
                  onDeletedVersion={handleDeleteVersion}
                  aliasesByVersion={aliasesByVersion}
                  registeredTool={tool}
                  onUpdatedContent={refetch}
                  onUpdateTool={handleUpdateTool}
                  showEditAliasesModal={showEditAliasesModal}
                  showEditToolVersionMetadataModal={showEditToolVersionMetadataModal}
                  showUpdateStatusModal={(version) => openUpdateVersionStatusModal(decodedToolName, version)}
                  allTools={allTools}
                  onEditBinding={openEditEndpointModal}
                />
              ) : (
                <ToolContentCompare
                  baselineVersion={selectedVersionEntity}
                  comparedVersion={comparedVersionEntity}
                  onSwitchSides={switchSides}
                  registeredTool={tool}
                  aliasesByVersion={aliasesByVersion}
                  showEditAliasesModal={showEditAliasesModal}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <Spacer shrinks={false} />
      {EditAliasesModal}
      {EditToolVersionMetadataModal}
      {RegisterToolModal}
      {EditEndpointModal}
      {UpdateVersionStatusModal}
    </ScrollablePageWrapper>
  );
};

export default ToolRegistryDetailsPage;
