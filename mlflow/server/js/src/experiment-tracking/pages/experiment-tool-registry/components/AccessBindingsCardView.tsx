import { Typography, useDesignSystemTheme, Empty, SearchIcon, Tag, CopyIcon, PencilIcon, Tooltip } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPAccessBinding, RegisteredTool } from '../types';
import Utils from '../../../../common/utils/Utils';
import { ToolIcon } from './ToolIcon';

interface AccessBindingsCardViewProps {
  bindings: MCPAccessBinding[];
  tools: RegisteredTool[];
  isLoading: boolean;
  isFiltered: boolean;
  onEditBinding?: (binding: MCPAccessBinding) => void;
  componentId: string;
}

export const AccessBindingsCardView = ({
  bindings,
  tools,
  isLoading,
  isFiltered,
  onEditBinding,
  componentId,
}: AccessBindingsCardViewProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  if (!isLoading && bindings.length === 0) {
    if (isFiltered) {
      return (
        <div
          css={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 400,
            width: '100%',
            '& > div': {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            },
          }}
        >
          <Empty
            description={
              <FormattedMessage
                defaultMessage="No access bindings match your search"
                description="Message when no access bindings match the search filter"
              />
            }
            image={<SearchIcon />}
          />
        </div>
      );
    }

    return (
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 400,
          width: '100%',
          '& > div': {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        <Empty
          description={
            <FormattedMessage
              defaultMessage="No access bindings created. Create access bindings to connect to MCP servers."
              description="Empty state message for access bindings"
            />
          }
        />
      </div>
    );
  }

  return (
    <div
      css={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: theme.spacing.md,
        padding: `${theme.spacing.sm}px 0`,
      }}
    >
      {bindings.map((binding) => {
        const server = tools.find((t) => t.internal_name === binding.server_name);

        const containerStyles = {
          overflow: 'hidden',
          border: `1px solid ${theme.colors.borderDecorative}`,
          borderRadius: theme.borders.borderRadiusMd,
          background: theme.colors.backgroundPrimary,
          padding: theme.spacing.sm + theme.spacing.xs,
          display: 'flex',
          gap: theme.spacing.sm,
          boxSizing: 'border-box' as const,
          boxShadow: theme.shadows.sm,
          transition: 'background 150ms ease',
          '&:hover': {
            background: theme.colors.actionDefaultBackgroundHover,
          },
        };

        const actionButtonStyles = {
          cursor: 'pointer',
          padding: theme.spacing.xs,
          borderRadius: theme.borders.borderRadiusSm,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 150ms ease',
          color: theme.colors.textSecondary,
          '&:hover': {
            background: theme.colors.actionDefaultBackgroundPress,
            color: theme.colors.textPrimary,
          },
        };

        const iconWrapperStyles = {
          borderRadius: theme.borders.borderRadiusSm,
          background: theme.colors.actionDefaultBackgroundHover,
          padding: theme.spacing.xs,
          color: theme.colors.blue500,
          flexShrink: 0,
          height: 'min-content',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        };

        const getVersionAliasLabel = () => {
          if (binding.server_alias) {
            return `@ ${binding.server_alias}`;
          }
          if (binding.server_version) {
            return `v${binding.server_version}`;
          }
          return 'Latest';
        };

        const getTransportLabel = () => {
          return binding.transport_type === 'streamable-http' ? 'Streamable HTTP' : 'SSE';
        };

        const handleCopy = (e: React.MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(binding.endpoint_url);
        };

        const handleEdit = (e: React.MouseEvent) => {
          e.stopPropagation();
          onEditBinding?.(binding);
        };

        return (
          <div
            key={binding.binding_id}
            css={containerStyles}
          >
            <div css={iconWrapperStyles}>
              <ToolIcon parsedServerJson={server?.parsed_server_json} size={20} />
            </div>
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, flex: 1, minWidth: 0 }}>
              <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography.Text bold size="md">
                  {binding.server_name}
                </Typography.Text>
                <div css={{ display: 'flex', gap: theme.spacing.xs, marginLeft: theme.spacing.sm }}>
                  <Tooltip content="Copy endpoint URL">
                    <div css={actionButtonStyles} onClick={handleCopy}>
                      <CopyIcon />
                    </div>
                  </Tooltip>
                  <Tooltip content="Edit binding">
                    <div css={actionButtonStyles} onClick={handleEdit}>
                      <PencilIcon />
                    </div>
                  </Tooltip>
                </div>
              </div>
              <Typography.Text
                color="secondary"
                size="sm"
                css={{
                  fontFamily: 'monospace',
                  fontSize: '0.85em',
                  wordBreak: 'break-all',
                }}
              >
                {binding.endpoint_url}
              </Typography.Text>

              <div css={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
                <Tag componentId={`${componentId}.card.version-tag`} color="charcoal">
                  {getVersionAliasLabel()}
                </Tag>
                <Tag componentId={`${componentId}.card.transport-tag`} color="charcoal">
                  {getTransportLabel()}
                </Tag>
              </div>

              {binding.last_updated_timestamp && (
                <Typography.Text color="secondary" size="sm">
                  {Utils.formatTimestamp(binding.last_updated_timestamp, intl)}
                </Typography.Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
