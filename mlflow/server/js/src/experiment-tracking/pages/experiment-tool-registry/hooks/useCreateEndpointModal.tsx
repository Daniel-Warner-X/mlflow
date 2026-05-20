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

const BINDINGS_STORAGE_KEY = 'mlflow_access_bindings';

const loadBindingsFromStorage = (): MCPAccessBinding[] => {
  try {
    const stored = localStorage.getItem(BINDINGS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load bindings from localStorage:', error);
  }
  return [];
};

const saveBindingsToStorage = (bindings: MCPAccessBinding[]) => {
  try {
    localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
  } catch (error) {
    console.error('Failed to save bindings to localStorage:', error);
  }
};

export const useCreateEndpointModal = ({
  tools,
  preselectedServer,
  onSuccess,
}: {
  tools: RegisteredTool[];
  preselectedServer?: string;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const intl = useIntl();

  const form = useForm<{
    endpoint_url: string;
    server_name: string;
    version_or_alias: string;
    transport_type: 'streamable-http' | 'sse';
  }>({
    defaultValues: {
      endpoint_url: '',
      server_name: preselectedServer || '',
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
    version_or_alias: string;
    transport_type: 'streamable-http' | 'sse';
  }) => {
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

      // Create new binding - ensure mutually exclusive version/alias constraint
      // TODO: In production, workspace should come from global workspace context (mlflow.get_workspace())
      const newBinding: MCPAccessBinding = {
        binding_id: `binding-${Date.now()}`,
        server_name: values.server_name,
        endpoint_url: values.endpoint_url,
        transport_type: values.transport_type,
        server_version,
        server_alias,
        workspace: 'default', // Hardcoded for prototype - would come from workspace context in production
        created_by: 'current_user', // TODO: Get from auth context
        last_updated_by: 'current_user', // TODO: Get from auth context
        creation_timestamp: Date.now(),
        last_updated_timestamp: Date.now(),
      };

      // Save to localStorage
      const existingBindings = loadBindingsFromStorage();
      const updatedBindings = [newBinding, ...existingBindings];
      saveBindingsToStorage(updatedBindings);

      onSuccess?.();
      setOpen(false);
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
        componentId="mlflow.endpoint.create.modal"
        visible={open}
        onCancel={() => setOpen(false)}
        title={
          <FormattedMessage
            defaultMessage="Create access binding"
            description="A header for the create access binding modal"
          />
        }
        okText={
          <FormattedMessage
            defaultMessage="Create"
            description="A label for the confirm button in the create access binding modal"
          />
        }
        okButtonProps={{ loading: isLoading }}
        onOk={form.handleSubmit(handleSubmit)}
        cancelText={
          <FormattedMessage
            defaultMessage="Cancel"
            description="A label for the cancel button in the create endpoint modal"
          />
        }
        size="normal"
      >
        {error?.message && (
          <>
            <Alert componentId="mlflow.access-binding.create.error" closable={false} message={error.message} type="error" />
            <Spacer />
          </>
        )}

        <FormUI.Label htmlFor="mlflow.access-binding.create.server">
          <FormattedMessage defaultMessage="MCP Server:" description="Label for server selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.access-binding.create.server"
          componentId="mlflow.access-binding.create.server"
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

        <FormUI.Label htmlFor="mlflow.access-binding.create.endpoint_url">
          <FormattedMessage defaultMessage="Endpoint URL:" description="Label for endpoint URL field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.access-binding.create.endpoint_url"
          componentId="mlflow.access-binding.create.endpoint_url"
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

        <FormUI.Label htmlFor="mlflow.access-binding.create.version_or_alias">
          <FormattedMessage defaultMessage="Version/Alias (optional):" description="Label for version/alias selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.access-binding.create.version_or_alias"
          componentId="mlflow.access-binding.create.version_or_alias"
          name="version_or_alias"
          options={versionAliasOptions}
          placeholder={intl.formatMessage({
            defaultMessage: 'Select a version or alias',
            description: 'Placeholder for version/alias selection',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.create.transport_type">
          <FormattedMessage defaultMessage="Transport Type:" description="Label for transport type selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.access-binding.create.transport_type"
          componentId="mlflow.access-binding.create.transport_type"
          name="transport_type"
          options={[
            { value: 'streamable-http', label: 'Streamable HTTP' },
            { value: 'sse', label: 'Server-Sent Events (SSE)' },
          ]}
        />
      </Modal>
    </FormProvider>
  );

  const openModal = () => {
    setError(null);
    form.reset({
      endpoint_url: '',
      server_name: preselectedServer || '',
      version_or_alias: '',
      transport_type: 'streamable-http',
    });
    setOpen(true);
  };

  return { CreateEndpointModal: modalElement, openModal };
};
