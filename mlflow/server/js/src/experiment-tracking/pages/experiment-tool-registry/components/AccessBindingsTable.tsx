import { useReactTable_unverifiedWithReact18 as useReactTable } from '@databricks/web-shared/react-table';
import {
  CursorPagination,
  Empty,
  NoIcon,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableSkeletonRows,
  useDesignSystemTheme,
  Button,
  PlusIcon,
  Tag,
  Typography,
  CopyIcon,
  Tooltip,
} from '@databricks/design-system';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel } from '@tanstack/react-table';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPAccessBinding } from '../types';
import Utils from '../../../../common/utils/Utils';
import { Link, useNavigate } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';
import { getBindingVersionLabel } from '../utils/accessBindingUtils';

type AccessBindingsColumnDef = ColumnDef<MCPAccessBinding>;

const useAccessBindingsTableColumns = (onEditBinding?: (binding: MCPAccessBinding) => void) => {
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();
  return useMemo(() => {
    const resultColumns: AccessBindingsColumnDef[] = [
      {
        header: intl.formatMessage({
          defaultMessage: 'Endpoint',
          description: 'Header for the endpoint column in the access bindings table',
        }),
        accessorKey: 'endpoint_url',
        id: 'endpoint',
        cell: ({ row, getValue }) => {
          const endpointUrl = getValue() as string;
          const binding = row.original;
          return (
            <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Tooltip componentId="mlflow.access-bindings.table.copy" content="Copy endpoint URL">
                <div
                  css={{
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
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(endpointUrl);
                  }}
                >
                  <CopyIcon />
                </div>
              </Tooltip>
              <Link
                componentId="mlflow.access-bindings.table.endpoint_link"
                to={Routes.getAccessBindingDetailsPageRoute(binding.binding_id)}
                css={{ fontFamily: 'monospace', fontSize: '0.9em', flex: 1 }}
              >
                {endpointUrl}
              </Link>
            </div>
          );
        },
      },
      {
        header: intl.formatMessage({
          defaultMessage: 'MCP Server',
          description: 'Header for the MCP server column in the access bindings table',
        }),
        accessorKey: 'server_name',
        id: 'server_name',
        cell: ({ getValue }) => {
          const serverName = getValue() as string;
          return (
            <Link
              componentId="mlflow.access-bindings.server_link"
              to={Routes.getToolDetailsPageRoute(encodeURIComponent(serverName))}
            >
              {serverName}
            </Link>
          );
        },
      },
      {
        header: intl.formatMessage({
          defaultMessage: 'Version/Alias',
          description: 'Header for the version/alias column in the access bindings table',
        }),
        id: 'version_alias',
        cell: ({ row }) => {
          const binding = row.original;
          return <span>{getBindingVersionLabel(binding)}</span>;
        },
      },
      {
        header: intl.formatMessage({
          defaultMessage: 'Transport',
          description: 'Header for the transport column in the access bindings table',
        }),
        accessorKey: 'transport_type',
        id: 'transport',
        cell: ({ getValue }) => {
          const transport = getValue() as 'streamable-http' | 'sse';
          const label = transport === 'streamable-http' ? 'Streamable HTTP' : 'SSE';
          return <span>{label}</span>;
        },
      },
      {
        header: intl.formatMessage({
          defaultMessage: 'Last updated',
          description: 'Header for the last updated column in the access bindings table',
        }),
        id: 'lastUpdated',
        accessorFn: ({ last_updated_timestamp }) =>
          last_updated_timestamp ? Utils.formatTimestamp(last_updated_timestamp, intl) : '-',
      },
      {
        header: '',
        id: 'actions',
        cell: ({ row }) => (
          <Typography.Link
            componentId="mlflow.access-bindings.edit-link"
            onClick={(e) => {
              e.stopPropagation();
              onEditBinding?.(row.original);
            }}
          >
            <FormattedMessage defaultMessage="Edit" description="Edit link for endpoint" />
          </Typography.Link>
        ),
      },
    ];

    return resultColumns;
  }, [intl, onEditBinding, theme]);
};

export const AccessBindingsTable = ({
  bindings,
  hasServers,
  hasNextPage,
  hasPreviousPage,
  isLoading,
  isFiltered,
  onNextPage,
  onPreviousPage,
  onCreateBinding,
  onCreateServer,
  onViewServers,
  onEditBinding,
  componentId,
}: {
  bindings?: MCPAccessBinding[];
  hasServers: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
  isFiltered?: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onCreateBinding: () => void;
  onCreateServer: () => void;
  onViewServers: () => void;
  onEditBinding?: (binding: MCPAccessBinding) => void;
  componentId: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const navigate = useNavigate();
  const columns = useAccessBindingsTableColumns(onEditBinding);

  const table = useReactTable(
    'mlflow/server/js/src/experiment-tracking/pages/experiment-tool-registry/components/AccessBindingsTable.tsx',
    {
      data: bindings ?? [],
      columns,
      getCoreRowModel: getCoreRowModel(),
      getRowId: (row) => row.binding_id,
    },
  );

  const getEmptyState = () => {
    const isEmptyList = !isLoading && (!bindings || bindings.length === 0);
    if (isEmptyList && isFiltered) {
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
            image={<NoIcon />}
            title={
              <FormattedMessage
                defaultMessage="No endpoints found"
                description="Label for the empty state in the endpoints table when no endpoints are found"
              />
            }
            description={null}
          />
        </div>
      );
    }
    if (isEmptyList) {
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
                  description="A header for the empty state in the access bindings table"
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
                  description="Guidelines for the user on how to create a new access binding"
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
                    componentId="mlflow.access-bindings.table.create_binding"
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
                    componentId="mlflow.access-bindings.table.view_servers"
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
                  componentId="mlflow.access-bindings.table.create_server"
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

    return null;
  };

  return (
    <Table
      scrollable
      pagination={
        <CursorPagination
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          componentId={`${componentId}.pagination`}
        />
      }
      empty={getEmptyState()}
    >
      <TableRow isHeader>
        {table.getLeafHeaders().map((header) => (
          <TableHeader componentId={`${componentId}.table.header`} key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHeader>
        ))}
      </TableRow>
      {isLoading ? (
        <TableSkeletonRows table={table} />
      ) : (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            css={{ height: theme.general.buttonHeight, cursor: 'pointer' }}
            onClick={() => navigate(Routes.getAccessBindingDetailsPageRoute(row.original.binding_id))}
          >
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id} css={{ alignItems: 'center' }}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
    </Table>
  );
};
