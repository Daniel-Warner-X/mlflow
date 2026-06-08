import { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Header,
  PencilIcon,
  Spacer,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { ScrollablePageWrapper } from '../../../common/components/ScrollablePageWrapper';
import { Link, useParams } from '../../../common/utils/RoutingUtils';
import Utils from '../../../common/utils/Utils';
import Routes from '../../routes';
import { McpClientConfigSnippet } from './components/McpClientConfigSnippet';
import { useEditEndpointModal } from './hooks/useEditEndpointModal';
import type { MCPAccessBinding, RegisteredTool } from './types';
import {
  buildMcpClientConfig,
  getBindingVersionLabel,
  getEffectiveDisplayName,
  getTransportLabel,
  parseRemotesFromVersion,
  resolveBindingVersion,
} from './utils/accessBindingUtils';
import { loadBindingsFromStorage, loadToolsFromStorage } from './utils/registryStorage';

const AccessBindingDetailsPage = () => {
  const { bindingId } = useParams<{ bindingId: string }>();
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [binding, setBinding] = useState<MCPAccessBinding | null>(null);
  const [tools, setTools] = useState<RegisteredTool[]>([]);

  const reloadData = () => {
    const loadedTools = loadToolsFromStorage();
    const bindings = loadBindingsFromStorage(loadedTools);
    const foundBinding = bindings.find((b) => b.binding_id === bindingId) ?? null;
    setBinding(foundBinding);
    setTools(loadedTools);
  };

  useEffect(() => {
    reloadData();
  }, [bindingId]);

  const server = useMemo(
    () => tools.find((tool) => tool.internal_name === binding?.server_name),
    [tools, binding?.server_name],
  );

  const resolvedVersion = binding && server ? resolveBindingVersion(binding, server) : undefined;
  const resolvedVersionEntity = server?.versions?.find((version) => version.version === resolvedVersion);
  const remotes = parseRemotesFromVersion(resolvedVersionEntity);
  const mcpConfig = binding && server ? buildMcpClientConfig(binding, server.internal_name, remotes) : '';

  const { EditEndpointModal, openEditModal } = useEditEndpointModal({
    tools,
    onSuccess: reloadData,
  });

  const breadcrumbs = (
    <Breadcrumb>
      <Breadcrumb.Item>
        <Link componentId="mlflow.access-binding.details.breadcrumb_registry" to={Routes.toolsPageRoute}>
          <FormattedMessage defaultMessage="MCP Registry" description="Breadcrumb label for MCP Registry" />
        </Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>
        <FormattedMessage defaultMessage="Access binding" description="Breadcrumb label for access binding details" />
      </Breadcrumb.Item>
    </Breadcrumb>
  );

  if (!binding) {
    return (
      <ScrollablePageWrapper>
        <Spacer shrinks={false} />
        <Header breadcrumbs={breadcrumbs} title={bindingId || 'Not Found'} />
        <Spacer shrinks={false} />
        <Typography.Text>
          <FormattedMessage
            defaultMessage="Access binding not found"
            description="Error message when access binding is not found"
          />
        </Typography.Text>
      </ScrollablePageWrapper>
    );
  }

  const displayName = server ? getEffectiveDisplayName(server) : binding.server_name;
  const metadataGridStyles = {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    gridAutoRows: `minmax(${theme.typography.lineHeightLg}, auto)`,
    alignItems: 'flex-start' as const,
    rowGap: theme.spacing.sm,
    columnGap: theme.spacing.md,
  };

  return (
    <ScrollablePageWrapper>
      <Spacer shrinks={false} />
      <Header
        breadcrumbs={breadcrumbs}
        title={
          <div css={{ minWidth: 0 }}>
            <div>{displayName}</div>
            {binding.description && (
              <Typography.Text color="secondary" css={{ display: 'block', marginTop: theme.spacing.xs }}>
                {binding.description}
              </Typography.Text>
            )}
          </div>
        }
        buttons={
          <Button
            componentId="mlflow.access-binding.details.edit"
            icon={<PencilIcon />}
            onClick={() => openEditModal(binding)}
          >
            <FormattedMessage defaultMessage="Edit binding" description="Button to edit access binding" />
          </Button>
        }
      />
      <Spacer shrinks={false} />

      <Typography.Title level={3} withoutMargins css={{ marginBottom: theme.spacing.md }}>
        <FormattedMessage
          defaultMessage="Client configuration"
          description="Section title for mcp.json client configuration on access binding details page"
        />
      </Typography.Title>
      <Typography.Paragraph color="secondary" css={{ marginBottom: theme.spacing.sm }}>
        <FormattedMessage
          defaultMessage="Copy this configuration into your mcp.json to connect to this approved deployment."
          description="Helper text for mcp.json configuration section"
        />
      </Typography.Paragraph>
      <McpClientConfigSnippet code={mcpConfig} />

      <Spacer size="lg" />

      <div css={metadataGridStyles}>
        <Typography.Text bold>
          <FormattedMessage defaultMessage="Endpoint URL:" description="Label for endpoint URL" />
        </Typography.Text>
        <Typography.Text css={{ fontFamily: 'monospace', fontSize: theme.typography.fontSizeSm, wordBreak: 'break-all' }}>
          {binding.endpoint_url}
        </Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Transport:" description="Label for transport type" />
        </Typography.Text>
        <Typography.Text>{getTransportLabel(binding.transport_type)}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="MCP server:" description="Label for parent MCP server" />
        </Typography.Text>
        <Link
          componentId="mlflow.access-binding.details.server_link"
          to={Routes.getToolDetailsPageRoute(encodeURIComponent(binding.server_name))}
        >
          {binding.server_name}
        </Link>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Version:" description="Label for resolved version" />
        </Typography.Text>
        <Typography.Text>
          {resolvedVersion ? (
            <Link
              componentId="mlflow.access-binding.details.version_link"
              to={Routes.getToolDetailsPageRoute(encodeURIComponent(binding.server_name))}
            >
              v{resolvedVersion}
            </Link>
          ) : (
            getBindingVersionLabel(binding)
          )}
        </Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Workspace:" description="Label for workspace" />
        </Typography.Text>
        <Typography.Text>{binding.workspace}</Typography.Text>

        <Typography.Text bold>
          <FormattedMessage defaultMessage="Last updated:" description="Label for last updated timestamp" />
        </Typography.Text>
        <Typography.Text>{Utils.formatTimestamp(binding.last_updated_timestamp, intl)}</Typography.Text>
      </div>

      {remotes.length > 0 && (
        <>
          <Spacer size="lg" />
          <Typography.Title level={3} withoutMargins css={{ marginBottom: theme.spacing.md }}>
            <FormattedMessage
              defaultMessage="Server remotes"
              description="Section title for remotes from server.json on access binding details page"
            />
          </Typography.Title>
          <Typography.Paragraph color="secondary" css={{ marginBottom: theme.spacing.sm }}>
            <FormattedMessage
              defaultMessage="Remote connection definitions from the resolved server version."
              description="Helper text for server remotes section"
            />
          </Typography.Paragraph>
          <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {remotes.map((remote, index) => (
              <div
                key={`${remote.type}-${remote.url}-${index}`}
                css={{
                  padding: theme.spacing.sm,
                  border: `1px solid ${theme.colors.borderDecorative}`,
                  borderRadius: theme.borders.borderRadiusMd,
                  background: theme.colors.backgroundSecondary,
                }}
              >
                <div css={metadataGridStyles}>
                  {remote.type && (
                    <>
                      <Typography.Text bold>
                        <FormattedMessage defaultMessage="Type:" description="Label for remote type" />
                      </Typography.Text>
                      <Typography.Text>{remote.type}</Typography.Text>
                    </>
                  )}
                  {remote.url && (
                    <>
                      <Typography.Text bold>
                        <FormattedMessage defaultMessage="URL:" description="Label for remote URL" />
                      </Typography.Text>
                      <Typography.Text css={{ fontFamily: 'monospace', fontSize: theme.typography.fontSizeSm, wordBreak: 'break-all' }}>
                        {remote.url}
                      </Typography.Text>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {EditEndpointModal}
    </ScrollablePageWrapper>
  );
};

export default AccessBindingDetailsPage;
