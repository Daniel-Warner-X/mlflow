import { Tag, Typography, useDesignSystemTheme } from '@databricks/design-system';
import { ModelVersionTableAliasesCell } from '../../../../model-registry/components/aliases/ModelVersionTableAliasesCell';
import type { RegisteredTool, ToolVersion, MCPStatus } from '../types';
import Utils from '../../../../common/utils/Utils';
import { FormattedMessage, useIntl } from 'react-intl';

const getStatusColor = (status: MCPStatus) => {
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

const getStatusBadgeStyles = (status: MCPStatus, theme: any) => {
  if (status === 'active') {
    return {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
    };
  }
  return {};
};

export const ToolVersionMetadata = ({
  toolVersion,
  registeredTool,
  showEditAliasesModal,
  aliasesByVersion,
  isBaseline,
}: {
  registeredTool?: RegisteredTool;
  toolVersion?: ToolVersion;
  showEditAliasesModal?: (versionNumber: string) => void;
  aliasesByVersion: Record<string, string[]>;
  isBaseline?: boolean;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  if (!registeredTool || !toolVersion) {
    return null;
  }

  const versionElement = (
    <FormattedMessage
      defaultMessage="Version {version}"
      values={{ version: toolVersion.version }}
      description="A label for the version number in the MCP server details page"
    />
  );

  const status = toolVersion.status || 'draft';

  return (
    <div
      css={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gridAutoRows: `minmax(${theme.typography.lineHeightLg}, auto)`,
        alignItems: 'flex-start',
        rowGap: theme.spacing.xs,
        columnGap: theme.spacing.sm,
      }}
    >
      <Typography.Text bold>
        <FormattedMessage defaultMessage="Version:" description="A label for the version in the MCP server details page" />
      </Typography.Text>
      <Typography.Text>
        {versionElement}{' '}
        {isBaseline && (
          <FormattedMessage
            defaultMessage="(baseline)"
            description="A label displayed next to baseline version in the MCP server comparison view"
          />
        )}
      </Typography.Text>

      <Typography.Text bold>
        <FormattedMessage
          defaultMessage="Registered at:"
          description="A label for the registration timestamp in the MCP server details page"
        />
      </Typography.Text>
      <Typography.Text>{Utils.formatTimestamp(toolVersion.creation_timestamp, intl)}</Typography.Text>

      <Typography.Text bold>
        <FormattedMessage defaultMessage="Aliases:" description="A label for the aliases list in the MCP server details page" />
      </Typography.Text>
      <div>
        <ModelVersionTableAliasesCell
          css={{ maxWidth: 'none' }}
          modelName={registeredTool.internal_name}
          version={toolVersion.version}
          aliases={aliasesByVersion[toolVersion.version] || []}
          onAddEdit={() => {
            showEditAliasesModal?.(toolVersion.version);
          }}
        />
      </div>

      <Typography.Text bold>
        <FormattedMessage defaultMessage="Status:" description="A label for the status in the MCP server details page" />
      </Typography.Text>
      <div>
        <Tag componentId="mlflow.tool-registry.version.status" color={getStatusColor(status)} css={getStatusBadgeStyles(status, theme)}>
          {status}
        </Tag>
      </div>

      {toolVersion.description && (
        <>
          <Typography.Text bold>
            <FormattedMessage
              defaultMessage="Description:"
              description="A label for the description in the MCP server details page"
            />
          </Typography.Text>
          <Typography.Text>{toolVersion.description}</Typography.Text>
        </>
      )}
    </div>
  );
};
