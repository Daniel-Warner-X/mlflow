import type { ColumnDef } from '@tanstack/react-table';
import { Link } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';
import type { RegisteredTool } from '../types';
import type { ToolsTableMetadata } from '../types';

export const ToolRegistryListTableNameCell: ColumnDef<RegisteredTool>['cell'] = ({
  row: { original },
  getValue,
  table: {
    options: { meta },
  },
}) => {
  const name = getValue<string>();
  const { experimentId } = (meta || {}) as ToolsTableMetadata;

  if (!original.internal_name) {
    return name;
  }
  return (
    <Link
      componentId="mlflow.tool-registry.list.tool_name_link"
      to={Routes.getToolDetailsPageRoute(encodeURIComponent(original.internal_name))}
    >
      {name}
    </Link>
  );
};
