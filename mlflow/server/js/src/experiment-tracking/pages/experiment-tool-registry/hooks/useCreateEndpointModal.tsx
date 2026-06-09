import {
  Alert,
  FormUI,
  Modal,
  RHFControlledComponents,
  Spacer,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPAccessBinding, RegisteredTool } from '../types';
import { loadBindingsFromStorage, saveBindingsToStorage } from '../utils/registryStorage';
import { getEffectiveDisplayName } from '../utils/accessBindingUtils';

export const useCreateEndpointModal = ({
  tools,
  preselectedServer,
  lockServer = false,
  onSuccess,
}: {
  tools: RegisteredTool[];
  preselectedServer?: string;
  lockServer?: boolean;
  onSuccess?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();

  const form = useForm<{
    endpoint_url: string;
    server_name: string;
    description: string;
    version_or_alias: string;
    transport_type: 'streamable-http' | 'sse';
  }>({
    defaultValues: {
      endpoint_url: '',
      server_name: preselectedServer || '',
      description: '',
      version_or_alias: '',
      transport_type: 'streamable-http',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const selectedServerName = form.watch('server_name');
  const selectedServer = useMemo(
    () => tools.find((t) => t.internal_name === selectedServerName),
    [tools, selectedServerName],
  );

  const versionAliasOptions = useMemo(() => {
    if (!selectedServer) return [];
    const options: Array<{ value: string; label: string }> = [];

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
    version_or_alias: string;
    transport_type: 'streamable-http' | 'sse';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      let server_version: string | undefined;
      let server_alias: string | undefined;

      if (values.version_or_alias) {
        if (values.version_or_alias.startsWith('version:')) {
          server_version = values.version_or_alias.substring('version:'.length);
        } else if (values.version_or_alias.startsWith('alias:')) {
          server_alias = values.version_or_alias.substring('alias:'.length);
        }
      }

      const newBinding: MCPAccessBinding = {
        binding_id: `binding-${Date.now()}`,
        server_name: values.server_name,
        endpoint_url: values.endpoint_url,
        description: values.description.trim() || undefined,
        transport_type: values.transport_type,
        server_version,
        server_alias,
        workspace: 'default',
        created_by: 'current_user',
        last_updated_by: 'current_user',
        creation_timestamp: Date.now(),
        last_updated_timestamp: Date.now(),
      };

      const existingBindings = loadBindingsFromStorage(tools);
      saveBindingsToStorage([newBinding, ...existingBindings]);

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

  const lockedServerDisplayName = useMemo(() => {
    if (!lockServer || !preselectedServer) {
      return preselectedServer;
    }
    const server = tools.find((tool) => tool.internal_name === preselectedServer);
    return server ? getEffectiveDisplayName(server) : preselectedServer;
  }, [lockServer, preselectedServer, tools]);

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

        {lockServer ? (
          <div css={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing.xs }}>
            <FormUI.Label htmlFor="mlflow.access-binding.create.server" css={{ marginBottom: 0 }}>
              <FormattedMessage defaultMessage="MCP Server:" description="Label for server selection" />
            </FormUI.Label>
            <Typography.Text id="mlflow.access-binding.create.server">{lockedServerDisplayName}</Typography.Text>
          </div>
        ) : (
          <>
            <FormUI.Label htmlFor="mlflow.access-binding.create.server">
              <FormattedMessage defaultMessage="MCP Server:" description="Label for server selection" />
              <span css={{ color: theme.colors.textValidationDanger }}> *</span>
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
          </>
        )}
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.create.endpoint_url">
          <FormattedMessage defaultMessage="Endpoint URL:" description="Label for endpoint URL field" />
          <span css={{ color: theme.colors.textValidationDanger }}> *</span>
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

        <FormUI.Label htmlFor="mlflow.access-binding.create.description">
          <FormattedMessage defaultMessage="Description:" description="Label for access binding description field" />
        </FormUI.Label>
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.access-binding.create.description"
          componentId="mlflow.access-binding.create.description"
          name="description"
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder={intl.formatMessage({
            defaultMessage: 'Describe this deployment for other users',
            description: 'Placeholder for access binding description',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.access-binding.create.version_or_alias">
          <FormattedMessage defaultMessage="Version/Alias:" description="Label for version/alias selection" />
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
          <span css={{ color: theme.colors.textValidationDanger }}> *</span>
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
      description: '',
      version_or_alias: '',
      transport_type: 'streamable-http',
    });
    setOpen(true);
  };

  return { CreateEndpointModal: modalElement, openModal };
};
