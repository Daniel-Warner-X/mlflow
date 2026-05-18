import {
  Button,
  Modal,
  Spacer,
  TrashIcon,
  Typography,
  useDesignSystemTheme,
  PlayIcon,
} from '@databricks/design-system';
import { useState } from 'react';
import type { RegisteredTool, ToolVersion } from '../types';
import { FormattedMessage, useIntl } from 'react-intl';
import Utils from '../../../../common/utils/Utils';
import { ShowArtifactCodeSnippet } from '../../../components/artifact-view-components/ShowArtifactCodeSnippet';
import { DirectAccessBindingsList } from './DirectAccessBindingsList';

export const ToolContentPreview = ({
  toolVersion,
  onDeletedVersion,
  aliasesByVersion,
  registeredTool,
  onUpdatedContent,
  showEditAliasesModal,
  showEditToolVersionMetadataModal,
  allTools,
  onEditBinding,
}: {
  toolVersion?: ToolVersion;
  onDeletedVersion?: (version: string) => void;
  aliasesByVersion: Record<string, string[]>;
  registeredTool?: RegisteredTool;
  onUpdatedContent?: () => void;
  showEditAliasesModal?: (versionNumber: string) => void;
  showEditToolVersionMetadataModal?: (toolName: string, toolVersion: ToolVersion) => void;
  allTools?: RegisteredTool[];
  onEditBinding?: (binding: import('../types').DirectAccessBinding) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsageExample, setShowUsageExample] = useState(false);

  const aliases = toolVersion ? aliasesByVersion[toolVersion.version] || [] : [];

  const handleDelete = () => {
    if (toolVersion) {
      onDeletedVersion?.(toolVersion.version);
      setShowDeleteModal(false);
    }
  };

  if (!toolVersion) {
    return (
      <div css={{ flex: 1, padding: theme.spacing.md }}>
        <Typography.Text color="secondary">
          <FormattedMessage
            defaultMessage="Select a version to view details"
            description="Message when no version is selected"
          />
        </Typography.Text>
      </div>
    );
  }

  return (
    <div
      css={{
        flex: 1,
        padding: theme.spacing.md,
        paddingTop: 0,
        borderRadius: theme.borders.borderRadiusSm,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography.Title withoutMargins level={3}>
          <FormattedMessage
            defaultMessage="Viewing version {version}"
            description="Title of the MCP server details page for a given version"
            values={{ version: toolVersion.version }}
          />
        </Typography.Title>
        <div css={{ display: 'flex', gap: theme.spacing.sm }}>
          <Button
            componentId="mlflow.tool-registry.details.delete_version"
            icon={<TrashIcon />}
            type="primary"
            danger
            onClick={() => setShowDeleteModal(true)}
          >
            <FormattedMessage
              defaultMessage="Delete version"
              description="A label for a button to delete MCP server version"
            />
          </Button>
          <Button
            componentId="mlflow.tool-registry.details.use"
            icon={<PlayIcon />}
            onClick={() => setShowUsageExample(true)}
          >
            <FormattedMessage
              defaultMessage="Use"
              description="A label for a button to display the usage example of the MCP server"
            />
          </Button>
        </div>
      </div>
      <Spacer size="md" />

      <div
        css={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gridAutoRows: `minmax(${theme.typography.lineHeightLg}, auto)`,
          alignItems: 'flex-start',
          rowGap: theme.spacing.xs,
          columnGap: theme.spacing.sm,
        }}
      >
        {/* Internal Name (read-only) */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Name:" description="Label for internal name from server.json" />
        </Typography.Text>
        <Typography.Text css={{ fontFamily: 'monospace', fontSize: theme.typography.fontSizeSm }}>
          {registeredTool?.internal_name}
        </Typography.Text>

        {/* Display Name (editable) */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Title:" description="Label for display name" />
        </Typography.Text>
        <div>
          {registeredTool?.display_name ? (
            <div css={{ display: 'flex', gap: theme.spacing.xs, alignItems: 'center' }}>
              <Typography.Text>{registeredTool.display_name}</Typography.Text>
              <Typography.Link
                componentId="mlflow.tool-registry.details.edit_display_name"
                onClick={() => {
                  // TODO: Implement edit display name modal
                  console.log('Edit display name');
                }}
              >
                <FormattedMessage defaultMessage="Edit" description="Link to edit display name" />
              </Typography.Link>
            </div>
          ) : (
            <Typography.Link
              componentId="mlflow.tool-registry.details.add_display_name"
              onClick={() => {
                // TODO: Implement add display name modal
                console.log('Add display name');
              }}
            >
              <FormattedMessage defaultMessage="Add" description="Link to add display name" />
            </Typography.Link>
          )}
        </div>

        {/* Server Version (from server.json) */}
        {registeredTool?.server_version && (
          <>
            <Typography.Text bold>
              <FormattedMessage defaultMessage="Server version:" description="Label for server version from server.json" />
            </Typography.Text>
            <Typography.Text css={{ fontFamily: 'monospace', fontSize: theme.typography.fontSizeSm }}>
              {registeredTool.server_version}
            </Typography.Text>
          </>
        )}

        {/* Registered at */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Registered at:" description="Label for registration timestamp" />
        </Typography.Text>
        <Typography.Text>{Utils.formatTimestamp(toolVersion.creation_timestamp, intl)}</Typography.Text>

        {/* Aliases */}
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Aliases:" description="Label for aliases" />
        </Typography.Text>
        <div>
          {aliases.length > 0 ? (
            <div css={{ display: 'flex', gap: theme.spacing.xs, flexWrap: 'wrap', alignItems: 'center' }}>
              {aliases.map((alias) => (
                <span
                  key={alias}
                  css={{
                    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderRadius: theme.borders.borderRadiusMd,
                    fontSize: theme.typography.fontSizeSm,
                  }}
                >
                  @ {alias}
                </span>
              ))}
              <Typography.Link
                componentId="mlflow.tool-registry.details.edit_alias"
                onClick={() => {
                  if (toolVersion && showEditAliasesModal) {
                    showEditAliasesModal(toolVersion.version);
                  }
                }}
              >
                <FormattedMessage defaultMessage="Edit" description="Link to edit aliases" />
              </Typography.Link>
            </div>
          ) : (
            <Typography.Link
              componentId="mlflow.tool-registry.details.add_alias"
              onClick={() => {
                if (toolVersion && showEditAliasesModal) {
                  showEditAliasesModal(toolVersion.version);
                }
              }}
            >
              <FormattedMessage defaultMessage="Add" description="Link to add aliases" />
            </Typography.Link>
          )}
        </div>
      </div>

      <Spacer size="md" />

      <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>

        {/* Server Configuration */}
        <div>
          <div css={{ fontWeight: 600, marginBottom: theme.spacing.md }}>
            <FormattedMessage
              defaultMessage="Server configuration:"
              description="Label for server configuration"
            />
          </div>
          {registeredTool?.parsed_server_json ? (
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {/* Title (from server.json) */}
              {registeredTool.parsed_server_json.title && (
                <div>
                  <div css={{ fontWeight: 500, fontSize: theme.typography.fontSizeSm, marginBottom: 2 }}>
                    <FormattedMessage defaultMessage="Title:" description="Label for server title" />
                  </div>
                  <div css={{ fontSize: theme.typography.fontSizeSm }}>{registeredTool.parsed_server_json.title}</div>
                </div>
              )}

              {/* Description (from server.json) */}
              {registeredTool.parsed_server_json.description && (
                <div>
                  <div css={{ fontWeight: 500, fontSize: theme.typography.fontSizeSm, marginBottom: 2 }}>
                    <FormattedMessage defaultMessage="Description:" description="Label for server description" />
                  </div>
                  <div css={{ fontSize: theme.typography.fontSizeSm }}>
                    {registeredTool.parsed_server_json.description}
                  </div>
                </div>
              )}

              {/* Package Configuration */}
              {registeredTool.parsed_server_json.packages && registeredTool.parsed_server_json.packages.length > 0 && (
                <div>
                  <div css={{ fontWeight: 500, fontSize: theme.typography.fontSizeSm, marginBottom: theme.spacing.xs }}>
                    <FormattedMessage defaultMessage="Package:" description="Label for package configuration" />
                  </div>
                  {(() => {
                    const pkg = registeredTool.parsed_server_json.packages![0];
                    return (
                      <div
                        css={{
                          backgroundColor: theme.colors.backgroundSecondary,
                          padding: theme.spacing.sm,
                          borderRadius: theme.borders.borderRadiusMd,
                          fontSize: theme.typography.fontSizeSm,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        {pkg.runtimeHint && (
                          <div>
                            <span css={{ fontWeight: 500 }}>Runtime: </span>
                            <span css={{ fontFamily: 'monospace' }}>{pkg.runtimeHint}</span>
                          </div>
                        )}
                        {pkg.identifier && (
                          <div>
                            <span css={{ fontWeight: 500 }}>Package: </span>
                            <span css={{ fontFamily: 'monospace' }}>{pkg.identifier}</span>
                          </div>
                        )}
                        {pkg.version && (
                          <div>
                            <span css={{ fontWeight: 500 }}>Version: </span>
                            <span css={{ fontFamily: 'monospace' }}>{pkg.version}</span>
                          </div>
                        )}
                        {pkg.registryType && (
                          <div>
                            <span css={{ fontWeight: 500 }}>Registry: </span>
                            <span css={{ fontFamily: 'monospace' }}>{pkg.registryType}</span>
                          </div>
                        )}
                        {pkg.environmentVariables && pkg.environmentVariables.length > 0 && (
                          <div>
                            <span css={{ fontWeight: 500 }}>Environment variables: </span>
                            <span css={{ fontFamily: 'monospace' }}>
                              {pkg.environmentVariables.map((envVar) => Object.keys(envVar)[0]).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {registeredTool.parsed_server_json.packages.length > 1 && (
                    <div css={{ fontSize: theme.typography.fontSizeSm, color: theme.colors.textSecondary, marginTop: 4 }}>
                      <FormattedMessage
                        defaultMessage="and {count} more"
                        description="Indicator for additional packages"
                        values={{ count: registeredTool.parsed_server_json.packages.length - 1 }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Website URL */}
              {registeredTool.parsed_server_json.websiteUrl && (
                <div>
                  <div css={{ fontWeight: 500, fontSize: theme.typography.fontSizeSm, marginBottom: 2 }}>
                    <FormattedMessage defaultMessage="Website:" description="Label for website URL" />
                  </div>
                  <Typography.Link
                    componentId="mlflow.tool-registry.details.website_link"
                    href={registeredTool.parsed_server_json.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {registeredTool.parsed_server_json.websiteUrl}
                  </Typography.Link>
                </div>
              )}

              {/* Repository */}
              {registeredTool.parsed_server_json.repository?.url && (
                <div>
                  <div css={{ fontWeight: 500, fontSize: theme.typography.fontSizeSm, marginBottom: 2 }}>
                    <FormattedMessage defaultMessage="Repository:" description="Label for repository URL" />
                  </div>
                  <Typography.Link
                    componentId="mlflow.tool-registry.details.repository_link"
                    href={registeredTool.parsed_server_json.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {registeredTool.parsed_server_json.repository.url}
                  </Typography.Link>
                </div>
              )}

              {/* View full configuration toggle */}
              <details css={{ marginTop: theme.spacing.xs }}>
                <summary
                  css={{
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSizeSm,
                    color: theme.colors.actionDefaultTextDefault,
                    '&:hover': {
                      color: theme.colors.actionDefaultTextHover,
                    },
                  }}
                >
                  <FormattedMessage
                    defaultMessage="View full configuration"
                    description="Toggle to view raw server.json"
                  />
                </summary>
                <pre
                  css={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: theme.spacing.sm,
                    borderRadius: theme.borders.borderRadiusMd,
                    overflow: 'auto',
                    maxHeight: 400,
                    fontSize: theme.typography.fontSizeSm,
                    fontFamily: 'monospace',
                    margin: `${theme.spacing.xs}px 0 0 0`,
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(toolVersion.server_json!), null, 2);
                    } catch {
                      return toolVersion.server_json;
                    }
                  })()}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              {toolVersion.server_json ? (
                <pre
                  css={{
                    backgroundColor: theme.colors.backgroundSecondary,
                    padding: theme.spacing.sm,
                    borderRadius: theme.borders.borderRadiusMd,
                    overflow: 'auto',
                    maxHeight: 400,
                    fontSize: theme.typography.fontSizeSm,
                    fontFamily: 'monospace',
                    margin: 0,
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(toolVersion.server_json), null, 2);
                    } catch {
                      return toolVersion.server_json;
                    }
                  })()}
                </pre>
              ) : (
                <span css={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizeSm }}>
                  <FormattedMessage
                    defaultMessage="No server configuration provided"
                    description="Placeholder for empty server configuration"
                  />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {toolVersion.description && (
          <div>
            <div css={{ fontWeight: 600, marginBottom: theme.spacing.xs }}>
              <FormattedMessage defaultMessage="Description:" description="Label for description" />
            </div>
            <div>
              {toolVersion.description}
            </div>
          </div>
        )}

        {/* Direct Access Bindings */}
        {registeredTool && allTools && (
          <div css={{ marginTop: theme.spacing.lg }}>
            <DirectAccessBindingsList
              serverName={registeredTool.name}
              tools={allTools}
              onEditBinding={onEditBinding}
            />
          </div>
        )}
      </div>

      {/* Usage example modal */}
      <Modal
        componentId="mlflow.tool-registry.details.usage_example_modal"
        title={
          <FormattedMessage
            defaultMessage="Usage example"
            description="A title of the modal showing the usage example of the MCP server"
          />
        }
        visible={showUsageExample}
        onCancel={() => setShowUsageExample(false)}
        cancelText={
          <FormattedMessage
            defaultMessage="Dismiss"
            description="A label for the button to dismiss the usage example modal"
          />
        }
      >
        <ShowArtifactCodeSnippet code={buildMCPUsageExample(registeredTool, toolVersion)} />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        componentId="mlflow.tool-registry.details.delete_version_modal"
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onOk={handleDelete}
        title={
          <FormattedMessage
            defaultMessage="Delete version {version}"
            description="Title for delete version modal"
            values={{ version: toolVersion.version }}
          />
        }
        okText={
          <FormattedMessage defaultMessage="Delete" description="Button text to confirm deletion" />
        }
        okButtonProps={{ danger: true }}
        cancelText={
          <FormattedMessage defaultMessage="Cancel" description="Button text to cancel deletion" />
        }
      >
        <Typography.Paragraph>
          <FormattedMessage
            defaultMessage="Are you sure you want to delete version {version}? This action cannot be undone."
            description="Confirmation message for deleting a version"
            values={{ version: toolVersion.version }}
          />
        </Typography.Paragraph>
      </Modal>
    </div>
  );
};

const buildMCPUsageExample = (tool: RegisteredTool | undefined, version: ToolVersion | undefined) => {
  const serverName = tool?.name || 'my-mcp-server';
  const versionNumber = version?.version || '1';

  // Check if this is a container-based server
  let serverJson;
  try {
    serverJson = version?.server_json ? JSON.parse(version.server_json) : null;
  } catch {
    serverJson = null;
  }

  const isContainerized = serverJson?.command === 'docker' ||
                          serverJson?.args?.[0] === 'run' ||
                          serverJson?.image;

  if (isContainerized) {
    return `from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import mlflow

# Load MCP server configuration from MLflow registry
server_config = mlflow.genai.load_mcp_server("mcp:/${serverName}/${versionNumber}")

# For containerized MCP servers, the config specifies the container image
# Example server_config:
# {
#   "command": "docker",
#   "args": ["run", "--rm", "registry.example.com/mcp-server:v1.2.3"],
#   "env": {...}
# }

# Create MCP client session for containerized server
server_params = StdioServerParameters(
    command=server_config["command"],
    args=server_config.get("args", []),
    env=server_config.get("env", {}),
)

async def use_mcp_server():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the session
            await session.initialize()

            # List available tools from the containerized server
            tools = await session.list_tools()
            print(f"Available tools: {[tool.name for tool in tools.tools]}")

            # Call a tool provided by the container
            result = await session.call_tool("tool_name", arguments={
                "arg1": "value1",
                "arg2": "value2",
            })

            return result

# Run the MCP server interaction
import asyncio
result = asyncio.run(use_mcp_server())
print(result)`;
  }

  return `from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import mlflow

# Load MCP server configuration from MLflow registry
server_config = mlflow.genai.load_mcp_server("mcp:/${serverName}/${versionNumber}")

# For NPM-based MCP servers, the config typically looks like:
# {
#   "command": "npx",
#   "args": ["-y", "@modelcontextprotocol/server-name"],
#   "env": {...}
# }

# Create MCP client session
server_params = StdioServerParameters(
    command=server_config["command"],
    args=server_config.get("args", []),
    env=server_config.get("env", {}),
)

async def use_mcp_server():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the session
            await session.initialize()

            # List available tools
            tools = await session.list_tools()
            print(f"Available tools: {[tool.name for tool in tools.tools]}")

            # Call a tool
            result = await session.call_tool("tool_name", arguments={
                "arg1": "value1",
                "arg2": "value2",
            })

            return result

# Run the MCP server interaction
import asyncio
result = asyncio.run(use_mcp_server())
print(result)`;
};
