import { useDesignSystemTheme } from '@databricks/design-system';
import type { KeyValueEntity } from '../../../../common/types';

export const AccessBindingTag = ({ tag }: { tag: KeyValueEntity }) => {
  const { theme } = useDesignSystemTheme();

  return (
    <span
      css={{
        borderRadius: theme.borders.borderRadiusSm,
        background: theme.colors.actionDefaultBackgroundHover,
        color: theme.colors.blue500,
        padding: `2px ${theme.spacing.xs}px`,
        fontSize: theme.typography.fontSizeSm,
        lineHeight: theme.typography.lineHeightSm,
        fontWeight: theme.typography.typographyRegularFontWeight,
      }}
    >
      {tag.key}
      {tag.value ? `: ${tag.value}` : ''}
    </span>
  );
};
