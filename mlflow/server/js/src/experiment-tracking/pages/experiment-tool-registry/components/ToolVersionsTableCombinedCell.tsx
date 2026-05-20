import { Typography, useDesignSystemTheme, Tag } from '@databricks/design-system';
import type { ColumnDef } from '@tanstack/react-table';
import { useIntl } from 'react-intl';
import Utils from '../../../../common/utils/Utils';
import type { ToolVersion, RegisteredTool, MCPStatus } from '../types';
import { ModelVersionTableAliasesCell } from '../../../../model-registry/components/aliases/ModelVersionTableAliasesCell';

const getStatusColor = (status: MCPStatus) => {
  switch (status) {
    case 'active':
      return 'lime';
    case 'deprecated':
      return 'lemon';
    case 'deleted':
      return 'coral';
    case 'draft':
    default:
      return 'charcoal';
  }
};

const getStatusBadgeStyles = (status: MCPStatus, theme: any) => {
  if (status === 'active') {
    return {
      backgroundColor: 'rgba(34, 197, 94, 0.2)', // Green with opacity
      color: '#22c55e', // Solid green text
    };
  }
  return {};
};

interface ToolVersionsTableMetadata {
  aliasesByVersion: Record<string, string[]>;
  selectedVersion?: string;
  onUpdateSelectedVersion: (version: string) => void;
  registeredTool?: RegisteredTool;
  showEditAliasesModal?: (versionNumber: string) => void;
}

export const ToolVersionsTableCombinedCell: ColumnDef<ToolVersion>['cell'] = ({
  row: { original },
  table: {
    options: { meta },
  },
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const { aliasesByVersion, registeredTool, showEditAliasesModal } = meta as ToolVersionsTableMetadata;
  const aliases = aliasesByVersion[original.version] || [];

  const status = original.status || 'draft';

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        <Typography.Text bold>Version {original.version}</Typography.Text>
        <Tag
          componentId="mlflow.tool-registry.version.status"
          color={getStatusColor(status)}
          css={getStatusBadgeStyles(status, theme)}
        >
          {status}
        </Tag>
        {registeredTool && (
          <ModelVersionTableAliasesCell
            modelName={registeredTool.internal_name}
            version={original.version}
            aliases={aliases}
            onAddEdit={() => {
              showEditAliasesModal?.(original.version);
            }}
          />
        )}
      </div>
      <Typography.Text size="sm" color="secondary">
        {Utils.formatTimestamp(original.creation_timestamp, intl)}
      </Typography.Text>
    </div>
  );
};
