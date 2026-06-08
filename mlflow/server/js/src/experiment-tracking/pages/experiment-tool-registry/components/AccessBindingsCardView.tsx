import { Typography, useDesignSystemTheme, Empty, SearchIcon, Button, PlusIcon, ConnectIcon } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPAccessBinding, RegisteredTool } from '../types';
import Utils from '../../../../common/utils/Utils';
import { Link } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';
import { getBindingVersionLabel, getEffectiveDisplayName } from '../utils/accessBindingUtils';

interface AccessBindingsCardViewProps {
  bindings: MCPAccessBinding[];
  tools: RegisteredTool[];
  isLoading: boolean;
  isFiltered: boolean;
  componentId: string;
  onCreateServer?: () => void;
  onCreateBinding?: () => void;
  onViewServers?: () => void;
}

export const AccessBindingsCardView = ({
  bindings,
  tools,
  isLoading,
  isFiltered,
  componentId,
  onCreateServer,
  onCreateBinding,
  onViewServers,
}: AccessBindingsCardViewProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const hasServers = tools.length > 0;

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
          title={
            hasServers ? (
              <FormattedMessage
                defaultMessage="Create access binding"
                description="A header for the empty state in the access bindings card view"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Create MCP server"
                description="A header for the empty state when no MCP servers exist yet"
              />
            )
          }
          description={
            hasServers ? (
              <FormattedMessage
                defaultMessage="Create access bindings to connect to your registered MCP servers."
                description="Empty state message for access bindings when servers exist"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Register an MCP server before creating access bindings."
                description="Empty state message for access bindings when no servers exist"
              />
            )
          }
          button={
            hasServers ? (
              <div css={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  componentId={`${componentId}.empty.create_binding`}
                  data-testid="create-access-binding-empty-state-button"
                  onClick={onCreateBinding}
                  type="primary"
                  icon={<PlusIcon />}
                >
                  <FormattedMessage
                    defaultMessage="Create access binding"
                    description="Access bindings empty state primary CTA when servers exist"
                  />
                </Button>
                <Button
                  componentId={`${componentId}.empty.view_servers`}
                  onClick={onViewServers}
                  type="tertiary"
                >
                  <FormattedMessage
                    defaultMessage="View MCP servers"
                    description="Access bindings empty state secondary CTA to switch to servers tab"
                  />
                </Button>
              </div>
            ) : (
              <Button
                componentId={`${componentId}.empty.create_server`}
                data-testid="create-mcp-server-empty-state-button"
                onClick={onCreateServer}
                type="primary"
                icon={<PlusIcon />}
              >
                <FormattedMessage
                  defaultMessage="Create MCP server"
                  description="Access bindings empty state CTA when no servers exist"
                />
              </Button>
            )
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
        const serverDisplayName = server ? getEffectiveDisplayName(server) : binding.server_name;

        return (
          <Link
            key={binding.binding_id}
            componentId={`${componentId}.card.${binding.binding_id}`}
            to={Routes.getAccessBindingDetailsPageRoute(binding.binding_id)}
            css={{
              overflow: 'hidden',
              border: `1px solid ${theme.colors.borderDecorative}`,
              borderLeft: `3px solid ${theme.colors.turquoise}`,
              borderRadius: theme.borders.borderRadiusMd,
              background: theme.colors.backgroundPrimary,
              padding: theme.spacing.sm + theme.spacing.xs,
              display: 'flex',
              gap: theme.spacing.sm,
              boxSizing: 'border-box',
              boxShadow: theme.shadows.sm,
              transition: 'background 150ms ease',
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              '&:hover': {
                background: theme.colors.actionDefaultBackgroundHover,
              },
            }}
          >
            <div
              css={{
                borderRadius: theme.borders.borderRadiusSm,
                background: theme.colors.actionDefaultBackgroundHover,
                padding: theme.spacing.xs,
                color: theme.colors.turquoise,
                flexShrink: 0,
                height: 'min-content',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              <ConnectIcon />
            </div>
            <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, flex: 1, minWidth: 0 }}>
              <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                <Typography.Text bold size="md">
                  {serverDisplayName}
                </Typography.Text>
                <Typography.Text color="secondary" size="sm" css={{ flexShrink: 0 }}>
                  {getBindingVersionLabel(binding)}
                </Typography.Text>
              </div>
              {(binding.description || binding.last_updated_timestamp) && (
                <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.sm, alignItems: 'baseline' }}>
                  {binding.description && (
                    <Typography.Text color="secondary" size="sm">
                      {binding.description}
                    </Typography.Text>
                  )}
                  {binding.last_updated_timestamp && (
                    <Typography.Text color="secondary" size="sm">
                      {Utils.formatTimestamp(binding.last_updated_timestamp, intl)}
                    </Typography.Text>
                  )}
                </div>
              )}
              {binding.labels && binding.labels.length > 0 && (
                <div css={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {binding.labels.map((label) => (
                    <span
                      key={label}
                      css={{
                        borderRadius: theme.borders.borderRadiusSm,
                        background: theme.colors.actionDefaultBackgroundHover,
                        color: theme.colors.blue500,
                        padding: `2px ${theme.spacing.xs}px`,
                        fontSize: theme.typography.fontSizeSm,
                        lineHeight: theme.typography.lineHeightSm,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};
