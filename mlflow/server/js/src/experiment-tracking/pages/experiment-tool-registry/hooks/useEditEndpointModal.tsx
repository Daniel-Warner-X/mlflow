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
import type { MCPAccessBinding, RegisteredTool } from '../types';
import { loadBindingsFromStorage, saveBindingsToStorage } from '../utils/registryStorage';
import { formatLabelsForInput, parseLabelsInput } from '../utils/accessBindingUtils';

export const useEditEndpointModal = ({
  tools,
  onSuccess,
}: {
  tools: RegisteredTool[];
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [editingBinding, setEditingBinding] = useState<MCPAccessBinding | null>(null);
  const intl = useIntl();

  const form = useForm<{
    endpoint_url: string;
    server_name: string;
    description: string;
    labels: string;
    version_or_alias: string;
    transport_type: 'streamable-http' | 'sse';
  }>({
    defaultValues: {
      endpoint_url: '',
      server_name: '',
      description: '',
      labels: '',
      version_or_alias: '',
      transport_type: 'streamable-http',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get selected server's versions and aliases
  const selectedServerName = form.watch('server_name');
  const selectedServer = useMemo(
    () => tools.find((t) => t.internal_name === selectedServerName),
    [tools, selectedServerName],
  );

  const versionAliasOptions = useMemo(() => {
    if (!selectedServer) return [];
    const options: Array<{ value: string; label: string }> = [];

    // Add versions (only active and deprecated per RFC 0004 - draft/deleted are not surfaced)
    if (selectedServer.versions) {
      selectedServer.versions.forEach((v) => {
        const status = v.status || 'draft';
        if (status === 'active' || status === 'deprecated') {
          const label = status === 'deprecated'
            ? `v${v.version} (deprecated)`
            : `v${v.version}`;
          options.push({
            value: `version:${v.version}`,
            label,
          });
        }
      });
    }

    // Add aliases
    if (selectedServer.aliases) {
      selectedServer.aliases.forEach((a) => {
        options.push({
          value: `alias:${a.alias}`,
          label: `@ ${a.alias}`,
        });
      });
    }

    return options;
  }, [selectedServer]);

  const handleSubmit = async (values: {
    endpoint_url: string;
    server_name: string;
    description: string;
    labels: string;
    version_or_alias: string;
    transport_type: 'streamable-http' | 'sse';
  }) => {
    if (!editingBinding) return;

    setIsLoading(true);
    setError(null);

    try {
      // Parse version_or_alias to determine type
      let server_version: string | undefined;
      let server_alias: string | undefined;

      if (values.version_or_alias) {
        if (values.version_or_alias.startsWith('version:')) {
          server_version = values.version_or_alias.substring('version:'.length);
        } else if (values.version_or_alias.startsWith('alias:')) {
          server_alias = values.version_or_alias.substring('alias:'.length);
        }
      }

      // Create updated binding - ensure mutually exclusive version/alias constraint
      // Workspace is preserved from the original binding (set during creation from workspace context)
      const updatedBinding: MCPAccessBinding = {
        ...editingBinding,
        server_name: values.server_name,
        endpoint_url: values.endpoint_url,
        description: values.description.trim() || undefined,
        labels: parseLabelsInput(values.labels),
        transport_type: values.transport_type,
        server_version,
        server_alias,
        last_updated_by: 'current_user',
        last_updated_timestamp: Date.now(),
      };

      const existingBindings = loadBindingsFromStorage(tools);
      const updatedBindings = existingBindings.map((b) =>
        b.binding_id === editingBinding.binding_id ? updatedBinding : b,
      );
      saveBindingsToStorage(updatedBindings);

      onSuccess?.();
      setOpen(false);
      setEditingBinding(null);
      form.reset();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const serverOptions = useMemo(
    () =>
      tools.map((tool) => ({
        value: tool.internal_name,
        label: tool.internal_name,
      })),
    [tools],
  );

  const modalElement = (
    <FormProvider {...form}>
      <Modal
        componentId="mlflow.access-binding.edit.modal"
        visible={open}
        onCancel={() => {
          setOpen(false);
          setEditingBinding(null);
        }}
        title={
          <FormattedMessage
            defaultMessage="Edit access binding"
            description="A header for the edit access binding modal"
          />
        }
        okText={
          <FormattedMessage
            defaultMessage="Save"
            description="A label for the confirm button in the edit access binding modal"
          />
        }
        okButtonProps={{ loading: isLoading }}
        onOk={form.handleSubmit(handleSubmit)}
        cancelText={
          <FormattedMessage
            defaultMessage="Cancel"
            description="A label for the cancel button in the edit access binding modal"
          />
        }
        size="normal"
      >
        {error?.message && (
          <>
            <Alert componentId="mlflow.access-binding.edit.error" closable={false} message={error.message} type="error" />
            <Spacer />
          </>
        )}

        <FormUI.Label htmlFor="mlflow.access-binding.edit.server">
          <FormattedMessage defaultMessage="MCP Server:" description="Label for server selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.access-binding.edit.server"
          componentId="mlflow.access-binding.edit.server"
          name="server_name"
          options={serverOptions}
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                defaultMessage: 'MCP Server is required',
                description: 'Validation error for server selection',
              }),
            },
          }}
          placeholder={intl.formatMessage({
            defaultMessage: 'Select an MCP server',
            description: 'Placeholder for server selection',
          })}
          validationState={form.formState.errors.server_name ? 'error' : undefined}
        />
        {form.formState.errors.server_name && (
          <FormUI.Message type="error" message={form.formState.errors.server_name.message} />
        )}
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.edit.endpoint_url">
          <FormattedMessage defaultMessage="Endpoint URL:" description="Label for endpoint URL field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.access-binding.edit.endpoint_url"
          componentId="mlflow.access-binding.edit.endpoint_url"
          name="endpoint_url"
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                defaultMessage: 'Endpoint URL is required',
                description: 'Validation error for endpoint URL',
              }),
            },
            pattern: {
              value: /^https?:\/\/.+/,
              message: intl.formatMessage({
                defaultMessage: 'Must be a valid URL starting with http:// or https://',
                description: 'Validation error for endpoint URL format',
              }),
            },
          }}
          placeholder={intl.formatMessage({
            defaultMessage: 'https://mcp.example.com/server-name',
            description: 'Placeholder for endpoint URL',
          })}
          validationState={form.formState.errors.endpoint_url ? 'error' : undefined}
        />
        {form.formState.errors.endpoint_url && (
          <FormUI.Message type="error" message={form.formState.errors.endpoint_url.message} />
        )}
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.edit.description">
          <FormattedMessage defaultMessage="Description (optional):" description="Label for access binding description field" />
        </FormUI.Label>
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.access-binding.edit.description"
          componentId="mlflow.access-binding.edit.description"
          name="description"
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder={intl.formatMessage({
            defaultMessage: 'Describe this deployment for other users',
            description: 'Placeholder for access binding description',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.edit.labels">
          <FormattedMessage defaultMessage="Labels (optional):" description="Label for access binding labels field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.access-binding.edit.labels"
          componentId="mlflow.access-binding.edit.labels"
          name="labels"
          placeholder={intl.formatMessage({
            defaultMessage: 'production, us-east, team-alpha',
            description: 'Placeholder for comma-separated access binding labels',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.edit.version_or_alias">
          <FormattedMessage defaultMessage="Version/Alias (optional):" description="Label for version/alias selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.access-binding.edit.version_or_alias"
          componentId="mlflow.access-binding.edit.version_or_alias"
          name="version_or_alias"
          options={versionAliasOptions}
          placeholder={intl.formatMessage({
            defaultMessage: 'Select a version or alias',
            description: 'Placeholder for version/alias selection',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.edit.transport_type">
          <FormattedMessage defaultMessage="Transport Type:" description="Label for transport type selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.access-binding.edit.transport_type"
          componentId="mlflow.access-binding.edit.transport_type"
          name="transport_type"
          options={[
            { value: 'streamable-http', label: 'Streamable HTTP' },
            { value: 'sse', label: 'Server-Sent Events (SSE)' },
          ]}
        />
      </Modal>
    </FormProvider>
  );

  const openModal = (binding: MCPAccessBinding) => {
    setError(null);
    setEditingBinding(binding);

    // Construct version_or_alias value
    let versionOrAlias = '';
    if (binding.server_alias) {
      versionOrAlias = `alias:${binding.server_alias}`;
    } else if (binding.server_version) {
      versionOrAlias = `version:${binding.server_version}`;
    }

    form.reset({
      endpoint_url: binding.endpoint_url,
      server_name: binding.server_name,
      description: binding.description || '',
      labels: formatLabelsForInput(binding.labels),
      version_or_alias: versionOrAlias,
      transport_type: binding.transport_type,
    });
    setOpen(true);
  };

  return { EditEndpointModal: modalElement, openEditModal: openModal };
};
