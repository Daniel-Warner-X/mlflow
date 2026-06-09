import { useCallback } from 'react';
import { useEditKeyValueTagsModal } from '../../../../common/hooks/useEditKeyValueTagsModal';
import type { KeyValueEntity } from '../../../../common/types';
import type { MCPAccessBinding } from '../types';
import { loadRawBindingsFromStorage, saveBindingsToStorage } from '../utils/registryStorage';

type EditableBindingTags = {
  binding_id: string;
  tags: KeyValueEntity[];
};

export const useUpdateAccessBindingTags = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { EditTagsModal, showEditTagsModal } = useEditKeyValueTagsModal<EditableBindingTags>({
    valueRequired: false,
    saveTagsHandler: (entity, _currentTags, newTags) => {
      const bindings = loadRawBindingsFromStorage();
      const updatedBindings = bindings.map((binding) =>
        binding.binding_id === entity.binding_id
          ? {
              ...binding,
              tags: newTags.length > 0 ? newTags : undefined,
              last_updated_by: 'current_user',
              last_updated_timestamp: Date.now(),
            }
          : binding,
      );
      saveBindingsToStorage(updatedBindings);
      onSuccess?.();
      return Promise.resolve();
    },
  });

  const showEditBindingTagsModal = useCallback(
    (binding: MCPAccessBinding) =>
      showEditTagsModal({
        binding_id: binding.binding_id,
        tags: binding.tags ?? [],
      }),
    [showEditTagsModal],
  );

  return { EditTagsModal, showEditBindingTagsModal };
};
