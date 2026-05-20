import { Typography, useDesignSystemTheme, Empty, SearchIcon, Button, PlusIcon } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';
import type { RegisteredTool } from '../types';
import { ToolIcon } from './ToolIcon';
import Utils from '../../../../common/utils/Utils';

interface ToolRegistryCardViewProps {
  tools: RegisteredTool[];
  isLoading: boolean;
  isFiltered: boolean;
  experimentId?: string;
  onCreateTool?: () => void;
  componentId: string;
}

export const ToolRegistryCardView = ({
  tools,
  isLoading,
  isFiltered,
  experimentId,
  onCreateTool,
  componentId,
}: ToolRegistryCardViewProps) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  if (!isLoading && tools.length === 0) {
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
                defaultMessage="No MCP servers match your search"
                description="Message when no MCP servers match the search filter"
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
            <FormattedMessage
              defaultMessage="Create MCP server"
              description="A header for the empty state in the MCP registry card view"
            />
          }
          description={
            <FormattedMessage
              defaultMessage="Create and manage MCP servers using MLflow. <link>Learn more</link>"
              description="Guidelines for the user on how to create a new MCP server in the MCP registry page"
              values={{
                link: (content: any) => (
                  <Typography.Link
                    componentId="mlflow.tool-registry.list.card.learn_more_link"
                    href="https://mlflow.org/docs/latest/genai/"
                    openInNewTab
                  >
                    {content}
                  </Typography.Link>
                ),
              }}
            />
          }
          button={
            <Button
              componentId="mlflow.tool-registry.list.card.create_mcp_server"
              data-testid="create-mcp-server-empty-state-button"
              onClick={onCreateTool}
              type="primary"
              icon={<PlusIcon />}
            >
              <FormattedMessage defaultMessage="Create MCP server" description="MCP registry empty state CTA" />
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      css={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: theme.spacing.md,
        padding: `${theme.spacing.sm}px 0`,
      }}
    >
      {tools.map((tool) => {
        const displayName = tool.use_display_name_in_list && tool.display_name ? tool.display_name : tool.internal_name;
        const description = tool.parsed_server_json?.description;

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
          cursor: 'pointer',
          transition: 'background 150ms ease',
          '&:hover': {
            background: theme.colors.actionDefaultBackgroundHover,
          },
          '&:active': {
            background: theme.colors.actionDefaultBackgroundPress,
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

        const contentStyles = {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: theme.spacing.xs,
          flex: 1,
          minWidth: 0,
        };

        const linkStyles = {
          textDecoration: 'none',
          color: theme.colors.textPrimary,
          display: 'block',
        };

        return (
          <Link
            key={tool.internal_name}
            componentId={`${componentId}.card.${tool.internal_name}`}
            to={Routes.getToolDetailsPageRoute(encodeURIComponent(tool.internal_name))}
            css={linkStyles}
          >
            <div css={containerStyles}>
              <div css={iconWrapperStyles}>
                <ToolIcon parsedServerJson={tool.parsed_server_json} size={20} />
              </div>
              <div css={contentStyles}>
                <span role="heading" aria-level={3}>
                  <Typography.Text bold>{displayName}</Typography.Text>
                </span>
                {description && (
                  <Typography.Text
                    color="secondary"
                    size="sm"
                    css={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {description}
                  </Typography.Text>
                )}
                {tool.last_updated_timestamp && (
                  <Typography.Text color="secondary" size="sm">
                    {Utils.formatTimestamp(tool.last_updated_timestamp, intl)}
                  </Typography.Text>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
