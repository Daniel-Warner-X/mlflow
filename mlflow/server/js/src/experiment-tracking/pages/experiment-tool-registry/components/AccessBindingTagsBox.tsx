import { Button, PencilIcon, useDesignSystemTheme } from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPAccessBinding } from '../types';
import { useUpdateAccessBindingTags } from '../hooks/useUpdateAccessBindingTags';
import { AccessBindingTag } from './AccessBindingTag';

export const AccessBindingTagsBox = ({
  binding,
  onTagsUpdated,
}: {
  binding?: MCPAccessBinding;
  onTagsUpdated?: () => void;
}) => {
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();

  const { EditTagsModal, showEditBindingTagsModal } = useUpdateAccessBindingTags({ onSuccess: onTagsUpdated });

  const visibleTags = binding?.tags ?? [];
  const containsTags = visibleTags.length > 0;

  return (
    <div
      css={{
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.xs,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        '> *': {
          marginRight: '0 !important',
        },
        gap: theme.spacing.xs,
      }}
    >
      {visibleTags.map((tag) => (
        <AccessBindingTag key={tag.key} tag={tag} />
      ))}
      <Button
        componentId="mlflow.access-binding.details.tags.edit"
        size="small"
        icon={!containsTags ? undefined : <PencilIcon />}
        onClick={() => binding && showEditBindingTagsModal(binding)}
        aria-label={intl.formatMessage({
          defaultMessage: 'Edit tags',
          description: 'Label for the edit tags button on the access binding details page',
        })}
        children={
          !containsTags ? (
            <FormattedMessage
              defaultMessage="Add tags"
              description="Label for the add tags button on the access binding details page"
            />
          ) : undefined
        }
        type="tertiary"
      />
      {EditTagsModal}
    </div>
  );
};
