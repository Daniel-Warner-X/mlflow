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
import { Link } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';

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
        cell: ({ getValue }) => {
          const endpointUrl = getValue() as string;
          return (
            <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Tooltip content="Copy endpoint URL">
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
              <span css={{ fontFamily: 'monospace', fontSize: '0.9em', flex: 1 }}>{endpointUrl}</span>
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
          if (binding.server_alias) {
            return <span>@ {binding.server_alias}</span>;
          }
          if (binding.server_version) {
            return <span>v{binding.server_version}</span>;
          }
          return <span css={{ fontStyle: 'italic', opacity: 0.6 }}>Latest</span>;
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
            onClick={() => onEditBinding?.(row.original)}
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
  hasNextPage,
  hasPreviousPage,
  isLoading,
  isFiltered,
  onNextPage,
  onPreviousPage,
  onCreateBinding,
  onEditBinding,
  componentId,
}: {
  bindings?: MCPAccessBinding[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
  isFiltered?: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onCreateBinding: () => void;
  onEditBinding?: (binding: MCPAccessBinding) => void;
  componentId: string;
}) => {
  const { theme } = useDesignSystemTheme();
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
              <FormattedMessage
                defaultMessage="Create endpoint"
                description="A header for the empty state in the endpoints table"
              />
            }
            description={
              <FormattedMessage
                defaultMessage="Create and manage direct access endpoints for your MCP servers."
                description="Guidelines for the user on how to create a new endpoint"
              />
            }
            button={
              <Button
                componentId="mlflow.access-bindings.table.create_endpoint"
                data-testid="create-endpoint-empty-state-button"
                onClick={onCreateBinding}
                type="primary"
                icon={<PlusIcon />}
              >
                <FormattedMessage
                  defaultMessage="Create endpoint"
                  description="Endpoints empty state CTA"
                />
              </Button>
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
          <TableRow key={row.id} css={{ height: theme.general.buttonHeight }}>
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
