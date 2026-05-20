import {
  Alert,
  FormUI,
  Modal,
  RHFControlledComponents,
  Spacer,
} from '@databricks/design-system';
import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPStatus, ToolVersion } from '../types';

// Valid status transitions per RFC 0004-mcp-registry
const VALID_TRANSITIONS: Record<MCPStatus, MCPStatus[]> = {
  draft: ['active', 'deleted'],
  active: ['draft', 'deprecated'],
  deprecated: ['active', 'deleted'],
  deleted: [], // Terminal state
};

export const useUpdateVersionStatusModal = ({
  onSuccess,
}: {
  onSuccess?: (payload: { toolName: string; version: string; newStatus: MCPStatus }) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<{ toolName: string; version: ToolVersion } | null>(null);
  const intl = useIntl();

  const form = useForm<{
    status: MCPStatus;
  }>({
    defaultValues: {
      status: 'draft',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const currentStatus = currentVersion?.version.status || 'draft';
  const allowedStatuses = VALID_TRANSITIONS[currentStatus] || [];

  const statusOptions = useMemo(() => {
    return allowedStatuses.map((status) => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    }));
  }, [allowedStatuses]);

  const handleSubmit = async (values: { status: MCPStatus }) => {
    if (!currentVersion) return;

    setIsLoading(true);
    setError(null);

    try {
      onSuccess?.({
        toolName: currentVersion.toolName,
        version: currentVersion.version.version,
        newStatus: values.status,
      });

      setOpen(false);
      setCurrentVersion(null);
      form.reset();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const modalElement = (
    <FormProvider {...form}>
      <Modal
        componentId="mlflow.tool-registry.version.status.update.modal"
        visible={open}
        onCancel={() => {
          setOpen(false);
          setCurrentVersion(null);
        }}
        title={
          <FormattedMessage
            defaultMessage="Update version status"
            description="A header for the update version status modal"
          />
        }
        okText={
          <FormattedMessage
            defaultMessage="Update"
            description="A label for the confirm button in the update version status modal"
          />
        }
        okButtonProps={{ loading: isLoading, disabled: statusOptions.length === 0 }}
        onOk={form.handleSubmit(handleSubmit)}
        cancelText={
          <FormattedMessage
            defaultMessage="Cancel"
            description="A label for the cancel button in the update version status modal"
          />
        }
        size="normal"
      >
        {error?.message && (
          <>
            <Alert componentId="mlflow.version.status.update.error" closable={false} message={error.message} type="error" />
            <Spacer />
          </>
        )}

        {statusOptions.length === 0 ? (
          <Alert
            componentId="mlflow.version.status.terminal"
            closable={false}
            message={intl.formatMessage({
              defaultMessage: 'This version is in a terminal state and cannot be transitioned.',
              description: 'Message when version status cannot be changed',
            })}
            type="warning"
          />
        ) : (
          <>
            <FormUI.Label>
              <FormattedMessage defaultMessage="Current status:" description="Label for current status" />
            </FormUI.Label>
            <FormUI.Hint>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </FormUI.Hint>
            <Spacer />

            <FormUI.Label htmlFor="mlflow.version.status.new">
              <FormattedMessage defaultMessage="New status:" description="Label for new status selection" />
            </FormUI.Label>
            <RHFControlledComponents.Select
              control={form.control}
              id="mlflow.version.status.new"
              componentId="mlflow.version.status.new"
              name="status"
              options={statusOptions}
              rules={{
                required: {
                  value: true,
                  message: intl.formatMessage({
                    defaultMessage: 'Status is required',
                    description: 'Validation error for status selection',
                  }),
                },
              }}
              placeholder={intl.formatMessage({
                defaultMessage: 'Select a status',
                description: 'Placeholder for status selection',
              })}
              validationState={form.formState.errors.status ? 'error' : undefined}
            />
            {form.formState.errors.status && (
              <FormUI.Message type="error" message={form.formState.errors.status.message} />
            )}
          </>
        )}
      </Modal>
    </FormProvider>
  );

  const openModal = (toolName: string, version: ToolVersion) => {
    setError(null);
    setCurrentVersion({ toolName, version });

    // Set default to first allowed status
    const allowed = VALID_TRANSITIONS[version.status || 'draft'];
    form.reset({
      status: allowed.length > 0 ? allowed[0] : 'draft',
    });

    setOpen(true);
  };

  return { UpdateVersionStatusModal: modalElement, openUpdateVersionStatusModal: openModal };
};
