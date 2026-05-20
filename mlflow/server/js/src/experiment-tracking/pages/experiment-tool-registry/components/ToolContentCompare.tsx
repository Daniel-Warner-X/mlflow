import {
  Button,
  ExpandMoreIcon,
  Spacer,
  Tooltip,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useMemo } from 'react';
import type { RegisteredTool, ToolVersion } from '../types';
import { FormattedMessage, useIntl } from 'react-intl';
import { diffWords } from '../../prompts/diff';
import { ToolVersionMetadata } from './ToolVersionMetadata';

export const ToolContentCompare = ({
  baselineVersion,
  comparedVersion,
  onSwitchSides,
  registeredTool,
  aliasesByVersion,
  showEditAliasesModal,
}: {
  baselineVersion?: ToolVersion;
  comparedVersion?: ToolVersion;
  onSwitchSides: () => void;
  registeredTool?: RegisteredTool;
  aliasesByVersion: Record<string, string[]>;
  showEditAliasesModal?: (versionNumber: string) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();

  const baselineValue = useMemo(() => (baselineVersion?.server_json ? baselineVersion.server_json : ''), [baselineVersion]);
  const comparedValue = useMemo(() => (comparedVersion?.server_json ? comparedVersion.server_json : ''), [comparedVersion]);

  const diff = useMemo(() => diffWords(baselineValue ?? '', comparedValue ?? '') ?? [], [baselineValue, comparedValue]);

  const colors = useMemo(
    () => ({
      addedBackground: theme.isDarkMode ? theme.colors.green700 : theme.colors.green300,
      removedBackground: theme.isDarkMode ? theme.colors.red700 : theme.colors.red300,
    }),
    [theme],
  );

  const formatJSON = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  const baselineDisplay = formatJSON(baselineValue);
  const comparedDisplay = formatJSON(comparedValue);

  return (
    <div
      css={{
        flex: 1,
        padding: theme.spacing.md,
        paddingTop: 0,
        borderRadius: theme.borders.borderRadiusSm,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={3}>
          <FormattedMessage
            defaultMessage="Comparing version {baseline} with version {compared}"
            description="Label for comparing tool versions in the tool comparison view. Variables {baseline} and {compared} are numeric version numbers being compared."
            values={{
              baseline: baselineVersion?.version,
              compared: comparedVersion?.version,
            }}
          />
        </Typography.Title>
      </div>
      <Spacer shrinks={false} />
      <div css={{ display: 'flex' }}>
        <div css={{ flex: 1 }}>
          <ToolVersionMetadata
            aliasesByVersion={aliasesByVersion}
            registeredTool={registeredTool}
            toolVersion={baselineVersion}
            showEditAliasesModal={showEditAliasesModal}
            isBaseline
          />
        </div>
        <div css={{ paddingLeft: theme.spacing.sm, paddingRight: theme.spacing.sm }}>
          <div css={{ width: theme.general.heightSm }} />
        </div>
        <div css={{ flex: 1 }}>
          <ToolVersionMetadata
            aliasesByVersion={aliasesByVersion}
            registeredTool={registeredTool}
            toolVersion={comparedVersion}
            showEditAliasesModal={showEditAliasesModal}
          />
        </div>
      </div>
      <Spacer shrinks={false} />
      <div css={{ display: 'flex', flex: 1, overflow: 'auto', alignItems: 'flex-start' }}>
        <div
          css={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: theme.spacing.md,
            flex: 1,
            borderRadius: theme.borders.borderRadiusSm,
            overflow: 'auto',
          }}
        >
          <Typography.Text
            css={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            }}
          >
            {baselineDisplay || 'Empty'}
          </Typography.Text>
        </div>
        <div css={{ paddingLeft: theme.spacing.sm, paddingRight: theme.spacing.sm }}>
          <Tooltip
            componentId="mlflow.tool-registry.details.switch_sides.tooltip"
            content={
              <FormattedMessage
                defaultMessage="Switch sides"
                description="A label for button used to switch tool versions when in side-by-side comparison view"
              />
            }
            side="top"
          >
            <Button
              aria-label={intl.formatMessage({
                defaultMessage: 'Switch sides',
                description: 'A label for button used to switch tool versions when in side-by-side comparison view',
              })}
              componentId="mlflow.tool-registry.details.switch_sides"
              icon={<ExpandMoreIcon css={{ svg: { rotate: '90deg' } }} />}
              onClick={onSwitchSides}
            />
          </Tooltip>
        </div>

        <div
          css={{
            backgroundColor: theme.colors.backgroundSecondary,
            padding: theme.spacing.md,
            flex: 1,
            borderRadius: theme.borders.borderRadiusSm,
            overflow: 'auto',
          }}
        >
          <Typography.Text
            css={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '0.9em',
            }}
          >
            {diff.map((part, index) => (
              <span
                key={index}
                css={{
                  backgroundColor: part.added
                    ? colors.addedBackground
                    : part.removed
                      ? colors.removedBackground
                      : undefined,
                  textDecoration: part.removed ? 'line-through' : 'none',
                }}
              >
                {part.value}
              </span>
            ))}
          </Typography.Text>
        </div>
      </div>
    </div>
  );
};
