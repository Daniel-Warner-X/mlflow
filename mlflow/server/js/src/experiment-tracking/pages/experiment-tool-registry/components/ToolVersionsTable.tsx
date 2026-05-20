import { useReactTable_unverifiedWithReact18 as useReactTable } from '@databricks/web-shared/react-table';
import {
  ChevronRightIcon,
  Empty,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableSkeletonRows,
  useDesignSystemTheme,
} from '@databricks/design-system';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel } from '@tanstack/react-table';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { RegisteredTool, ToolVersion } from '../types';
import { ToolVersionsTableCombinedCell } from './ToolVersionsTableCombinedCell';
import { ToolVersionsDiffSelectorButton } from './ToolVersionsDiffSelectorButton';
import { ToolVersionsTableMode } from '../hooks/useToolDetailsPageViewState';

type ToolVersionsTableColumnDef = ColumnDef<ToolVersion>;

export const ToolVersionsTable = ({
  toolVersions,
  isLoading,
  onUpdateSelectedVersion,
  onUpdateComparedVersion,
  selectedVersion,
  comparedVersion,
  mode,
  registeredTool,
  aliasesByVersion,
  showEditAliasesModal,
}: {
  toolVersions?: ToolVersion[];
  isLoading: boolean;
  selectedVersion?: string;
  comparedVersion?: string;
  onUpdateSelectedVersion: (version: string) => void;
  onUpdateComparedVersion?: (version: string) => void;
  mode: ToolVersionsTableMode;
  registeredTool?: RegisteredTool;
  aliasesByVersion: Record<string, string[]>;
  showEditAliasesModal?: (versionNumber: string) => void;
}) => {
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();

  const columns = useMemo(() => {
    const resultColumns: ToolVersionsTableColumnDef[] = [
      {
        id: 'version',
        header: intl.formatMessage({
          defaultMessage: 'Version',
          description: 'Header for the version column in the MCP server versions table',
        }),
        accessorKey: 'version',
        cell: ToolVersionsTableCombinedCell,
      },
    ];

    return resultColumns;
  }, [intl]);

  const table = useReactTable(
    'mlflow/server/js/src/experiment-tracking/pages/experiment-tool-registry/components/ToolVersionsTable.tsx',
    {
      data: toolVersions ?? [],
      getRowId: (row) => row.version,
      columns,
      getCoreRowModel: getCoreRowModel(),
      meta: { aliasesByVersion, registeredTool, selectedVersion, onUpdateSelectedVersion, showEditAliasesModal },
    },
  );

  const getEmptyState = () => {
    if (!isLoading && toolVersions?.length === 0) {
      return (
        <Empty
          title={
            <FormattedMessage
              defaultMessage="No MCP server versions created"
              description="A header for the empty state in the MCP server versions table"
            />
          }
          description={
            <FormattedMessage
              defaultMessage='Use "Create MCP server version" button in order to create a new MCP server version'
              description="Guidelines for the user on how to create a new MCP server version"
            />
          }
        />
      );
    }
    return null;
  };

  return (
    <Table scrollable empty={getEmptyState()}>
      <TableRow isHeader>
        {table.getLeafHeaders().map((header) => (
          <TableHeader componentId="mlflow.tool-registry.details.versions.header" key={header.id}>
            {flexRender(header.column.columnDef.header, header.getContext())}
          </TableHeader>
        ))}
      </TableRow>
      {isLoading ? (
        <TableSkeletonRows table={table} />
      ) : (
        table.getRowModel().rows.map((row) => {
          const isSelectedSingle = mode === ToolVersionsTableMode.PREVIEW && selectedVersion === row.original.version;
          const isSelectedFirstToCompare =
            mode === ToolVersionsTableMode.COMPARE && selectedVersion === row.original.version;
          const isSelectedSecondToCompare =
            mode === ToolVersionsTableMode.COMPARE && comparedVersion === row.original.version;

          const getColor = () => {
            if (isSelectedSingle) {
              return theme.colors.actionDefaultBackgroundPress;
            } else if (isSelectedFirstToCompare || isSelectedSecondToCompare) {
              return theme.colors.actionDefaultBackgroundHover;
            }
            return 'transparent';
          };

          const showCursorForEntireRow = mode === ToolVersionsTableMode.PREVIEW;

          return (
            <TableRow
              key={row.id}
              css={{
                height: 'auto',
                backgroundColor: getColor(),
                cursor: showCursorForEntireRow ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (mode !== ToolVersionsTableMode.PREVIEW) {
                  return;
                }
                onUpdateSelectedVersion(row.original.version);
              }}
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} css={{ alignItems: 'flex-start', padding: theme.spacing.sm }}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
              {isSelectedSingle && (
                <div
                  css={{
                    width: theme.spacing.md * 2,
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: theme.spacing.sm,
                  }}
                >
                  <ChevronRightIcon />
                </div>
              )}
              {mode === ToolVersionsTableMode.COMPARE && onUpdateComparedVersion && (
                <ToolVersionsDiffSelectorButton
                  onSelectFirst={() => onUpdateSelectedVersion(row.original.version)}
                  onSelectSecond={() => onUpdateComparedVersion(row.original.version)}
                  isSelectedFirstToCompare={isSelectedFirstToCompare}
                  isSelectedSecondToCompare={isSelectedSecondToCompare}
                />
              )}
            </TableRow>
          );
        })
      )}
    </Table>
  );
};
