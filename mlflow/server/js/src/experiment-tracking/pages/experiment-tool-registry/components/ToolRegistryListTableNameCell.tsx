import type { ColumnDef } from '@tanstack/react-table';
import { useDesignSystemTheme } from '@databricks/design-system';
import { Link } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';
import type { RegisteredTool } from '../types';
import type { ToolsTableMetadata } from '../types';
import { ToolIcon } from './ToolIcon';

export const ToolRegistryListTableNameCell: ColumnDef<RegisteredTool>['cell'] = ({
  row: { original },
  getValue,
  table: {
    options: { meta },
  },
}) => {
  const { theme } = useDesignSystemTheme();
  const name = getValue<string>();
  const { experimentId } = (meta || {}) as ToolsTableMetadata;

  if (!original.internal_name) {
    return name;
  }
  return (
    <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
      <ToolIcon icons={original.icons} parsedServerJson={original.parsed_server_json} serverJson={original.server_json} size={20} />
      <Link
        componentId="mlflow.tool-registry.list.tool_name_link"
        to={Routes.getToolDetailsPageRoute(encodeURIComponent(original.internal_name))}
      >
        {name}
      </Link>
    </div>
  );
};
