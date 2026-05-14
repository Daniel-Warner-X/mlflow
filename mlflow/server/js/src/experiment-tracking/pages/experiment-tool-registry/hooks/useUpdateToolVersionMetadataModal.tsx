import { useEditKeyValueTagsModal } from '../../../../common/hooks/useEditKeyValueTagsModal';
import type { ToolVersion } from '../types';
import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import type { KeyValueEntity } from '../../../../common/types';

type UpdateToolVersionMetadataPayload = {
  toolName: string;
  toolVersion: string;
  newMetadata: { key: string; value: string }[];
};

export const useUpdateToolVersionMetadataModal = ({
  onSuccess,
}: {
  onSuccess?: (payload: UpdateToolVersionMetadataPayload) => void;
}) => {
  const {
    EditTagsModal: EditToolVersionMetadataModal,
    showEditTagsModal,
    isLoading,
  } = useEditKeyValueTagsModal<{ name: string; version: string; tags?: KeyValueEntity[] }>({
    title: (
      <FormattedMessage
        defaultMessage="Add/Edit MCP Server Version Metadata"
        description="Title for a modal that allows the user to add or edit metadata tags on MCP server versions."
      />
    ),
    valueRequired: true,
    saveTagsHandler: (toolVersion, currentTags, newTags) => {
      return new Promise<void>((resolve, reject) => {
        if (!toolVersion.name) {
          return reject();
        }

        // Call the onSuccess callback with the new metadata
        onSuccess?.({
          toolName: toolVersion.name,
          toolVersion: toolVersion.version,
          newMetadata: newTags,
        });

        resolve();
      });
    },
  });

  const showEditToolVersionMetadataModal = useCallback(
    (toolName: string, toolVersion: ToolVersion) =>
      showEditTagsModal({
        name: toolName,
        version: toolVersion.version,
        tags: toolVersion.metadata || [],
      }),
    [showEditTagsModal],
  );

  return { EditToolVersionMetadataModal, showEditToolVersionMetadataModal, isLoading };
};
