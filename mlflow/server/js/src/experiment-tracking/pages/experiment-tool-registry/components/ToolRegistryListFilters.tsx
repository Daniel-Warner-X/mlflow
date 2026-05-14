import { TableFilterInput, TableFilterLayout } from '@databricks/design-system';
import { ModelSearchInputHelpTooltip } from '../../../../model-registry/components/model-list/ModelListFilters';

export const ToolRegistryListFilters = ({
  searchFilter,
  onSearchFilterChange,
  componentId,
}: {
  searchFilter: string;
  onSearchFilterChange: (searchFilter: string) => void;
  componentId: string;
}) => {
  return (
    <TableFilterLayout>
      <TableFilterInput
        placeholder="Search MCP servers by name"
        componentId={componentId}
        value={searchFilter}
        onChange={(e) => onSearchFilterChange(e.target.value)}
        suffix={<ModelSearchInputHelpTooltip exampleEntityName="my-mcp-server" />}
      />
    </TableFilterLayout>
  );
};
