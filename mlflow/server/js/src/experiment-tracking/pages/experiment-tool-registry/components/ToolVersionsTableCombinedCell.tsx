import { Typography, useDesignSystemTheme } from '@databricks/design-system';
import type { ColumnDef } from '@tanstack/react-table';
import { useIntl } from 'react-intl';
import Utils from '../../../../common/utils/Utils';
import type { ToolVersion, RegisteredTool } from '../types';
import { ModelVersionTableAliasesCell } from '../../../../model-registry/components/aliases/ModelVersionTableAliasesCell';

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

  return (
    <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
      <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
        <Typography.Text bold>Version {original.version}</Typography.Text>
        {registeredTool && (
          <ModelVersionTableAliasesCell
            modelName={registeredTool.name}
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
