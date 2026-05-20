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
  Typography,
} from '@databricks/design-system';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel } from '@tanstack/react-table';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { RegisteredTool, ToolsTableMetadata } from '../types';
import Utils from '../../../../common/utils/Utils';
import { isEmpty } from 'lodash';
import { ToolRegistryListTableNameCell } from './ToolRegistryListTableNameCell';

type ToolsTableColumnDef = ColumnDef<RegisteredTool>;

const useToolsTableColumns = () => {
  const intl = useIntl();
  return useMemo(() => {
    const resultColumns: ToolsTableColumnDef[] = [
      {
        header: intl.formatMessage({
          defaultMessage: 'Name',
          description: 'Header for the name column in the tool registry table',
        }),
        accessorFn: (row) => (row.use_display_name_in_list && row.display_name) ? row.display_name : row.internal_name,
        id: 'name',
        cell: ToolRegistryListTableNameCell,
      },
      {
        header: intl.formatMessage({
          defaultMessage: 'Description',
          description: 'Header for the description column in the tool registry table',
        }),
        accessorFn: (row) => row.parsed_server_json?.description || '',
        id: 'description',
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        header: intl.formatMessage({
          defaultMessage: 'Last modified',
          description: 'Header for the last modified column in the tool registry table',
        }),
        id: 'lastModified',
        accessorFn: ({ last_updated_timestamp }) =>
          last_updated_timestamp ? Utils.formatTimestamp(last_updated_timestamp, intl) : '-',
      },
    ];

    return resultColumns;
  }, [intl]);
};

export const ToolRegistryListTable = ({
  tools,
  hasNextPage,
  hasPreviousPage,
  isLoading,
  isFiltered,
  onNextPage,
  onPreviousPage,
  experimentId,
  onCreateTool,
  componentId,
}: {
  tools?: RegisteredTool[];
  error?: Error;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading?: boolean;
  isFiltered?: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  experimentId?: string;
  onCreateTool: () => void;
  componentId: string;
}) => {
  const { theme } = useDesignSystemTheme();
  const columns = useToolsTableColumns();

  // prettier-ignore
  const table = useReactTable('mlflow/server/js/src/experiment-tracking/pages/experiment-tool-registry/components/ToolRegistryListTable.tsx', {
    data: tools ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => row.internal_name ?? index.toString(),
    meta: { experimentId } satisfies ToolsTableMetadata,
  });

  const getEmptyState = () => {
    const isEmptyList = !isLoading && isEmpty(tools);
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
                defaultMessage="No MCP servers found"
                description="Label for the empty state in the MCP registry table when no MCP servers are found"
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
                defaultMessage="Create MCP server"
                description="A header for the empty state in the MCP registry table"
              />
            }
            description={
              <FormattedMessage
                defaultMessage="Create and manage MCP servers using MLflow. <link>Learn more</link>"
                description="Guidelines for the user on how to create a new MCP server in the MCP registry page"
                values={{
                  link: (content: any) => (
                    <Typography.Link
                      componentId="mlflow.tool-registry.list.table.learn_more_link"
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
                componentId="mlflow.tool-registry.list.table.create_mcp_server"
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
