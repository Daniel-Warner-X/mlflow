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
import type { DirectAccessBinding, RegisteredTool } from '../types';

const BINDINGS_STORAGE_KEY = 'mlflow_access_bindings';

const loadBindingsFromStorage = (): DirectAccessBinding[] => {
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

const saveBindingsToStorage = (bindings: DirectAccessBinding[]) => {
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
    endpoint: string;
    server_name: string;
    version_or_alias: string;
    credential_ref: string;
    status: 'active' | 'deprecated' | 'health-check';
    health_check_interval: string;
    health_check_timeout: string;
    health_check_path: string;
  }>({
    defaultValues: {
      endpoint: '',
      server_name: preselectedServer || '',
      version_or_alias: '',
      credential_ref: '',
      status: 'active',
      health_check_interval: '60',
      health_check_timeout: '5',
      health_check_path: '/health',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get selected server's versions and aliases
  const selectedServerName = form.watch('server_name');
  const selectedStatus = form.watch('status');
  const selectedServer = useMemo(
    () => tools.find((t) => t.name === selectedServerName),
    [tools, selectedServerName],
  );

  const versionAliasOptions = useMemo(() => {
    if (!selectedServer) return [];

    const options: { value: string; label: string }[] = [
      { value: '', label: 'Latest (no specific version)' },
    ];

    // Add aliases
    if (selectedServer.aliases && selectedServer.aliases.length > 0) {
      const aliasOptions = selectedServer.aliases.map((a) => ({
        value: `alias:${a.alias}`,
        label: `@ ${a.alias} (alias)`,
      }));
      options.push(...aliasOptions);
    }

    // Add versions
    if (selectedServer.versions && selectedServer.versions.length > 0) {
      const versionOptions = selectedServer.versions.map((v) => ({
        value: `version:${v.version}`,
        label: `v${v.version}`,
      }));
      options.push(...versionOptions);
    }

    return options;
  }, [selectedServer]);

  const handleSubmit = async (values: {
    endpoint: string;
    server_name: string;
    version_or_alias: string;
    credential_ref: string;
    status: 'active' | 'deprecated' | 'health-check';
    health_check_interval: string;
    health_check_timeout: string;
    health_check_path: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse version_or_alias
      let version: string | undefined;
      let alias: string | undefined;

      if (values.version_or_alias) {
        const [type, value] = values.version_or_alias.split(':');
        if (type === 'version') {
          version = value;
        } else if (type === 'alias') {
          alias = value;
        }
      }

      // Create new binding
      const newBinding: DirectAccessBinding = {
        id: `binding-${Date.now()}`,
        endpoint: values.endpoint,
        server_name: values.server_name,
        version,
        alias,
        credential_ref: values.credential_ref || undefined,
        status: values.status,
        created_timestamp: Date.now(),
        last_updated_timestamp: Date.now(),
      };

      // Add health check configuration if status is 'health-check'
      if (values.status === 'health-check') {
        newBinding.health_check = {
          interval_seconds: parseInt(values.health_check_interval, 10),
          timeout_seconds: parseInt(values.health_check_timeout, 10),
          endpoint_path: values.health_check_path,
        };
      }

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
            defaultMessage="Create endpoint"
            description="A header for the create endpoint modal"
          />
        }
        okText={
          <FormattedMessage
            defaultMessage="Create"
            description="A label for the confirm button in the create endpoint modal"
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
            <Alert componentId="mlflow.endpoint.create.error" closable={false} message={error.message} type="error" />
            <Spacer />
          </>
        )}

        <FormUI.Label htmlFor="mlflow.endpoint.create.endpoint">
          <FormattedMessage defaultMessage="Endpoint URL:" description="Label for endpoint URL field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.endpoint.create.endpoint"
          componentId="mlflow.endpoint.create.endpoint"
          name="endpoint"
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
          validationState={form.formState.errors.endpoint ? 'error' : undefined}
        />
        {form.formState.errors.endpoint && (
          <FormUI.Message type="error" message={form.formState.errors.endpoint.message} />
        )}
        <Spacer />

        <FormUI.Label htmlFor="mlflow.endpoint.create.server">
          <FormattedMessage defaultMessage="MCP Server:" description="Label for server selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.endpoint.create.server"
          componentId="mlflow.endpoint.create.server"
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

        <FormUI.Label htmlFor="mlflow.endpoint.create.version">
          <FormattedMessage defaultMessage="Version/Alias (optional):" description="Label for version/alias selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.endpoint.create.version"
          componentId="mlflow.endpoint.create.version"
          name="version_or_alias"
          options={versionAliasOptions}
          placeholder={intl.formatMessage({
            defaultMessage: 'Select a version or alias',
            description: 'Placeholder for version/alias selection',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.endpoint.create.credential">
          <FormattedMessage defaultMessage="Credential reference (optional):" description="Label for credential reference" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.endpoint.create.credential"
          componentId="mlflow.endpoint.create.credential"
          name="credential_ref"
          placeholder={intl.formatMessage({
            defaultMessage: 'workspace-secret-name',
            description: 'Placeholder for credential reference',
          })}
        />
        <FormUI.Hint>
          <FormattedMessage
            defaultMessage="Reference to a workspace-managed credential for authenticating to this endpoint."
            description="Hint for credential reference field"
          />
        </FormUI.Hint>
        <Spacer />

        <FormUI.Label htmlFor="mlflow.endpoint.create.status">
          <FormattedMessage defaultMessage="Status:" description="Label for status selection" />
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.endpoint.create.status"
          componentId="mlflow.endpoint.create.status"
          name="status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'deprecated', label: 'Deprecated' },
            { value: 'health-check', label: 'Health Check' },
          ]}
        />

        {selectedStatus === 'health-check' && (
          <>
            <Spacer />
            <FormUI.Label htmlFor="mlflow.endpoint.create.health_check_interval">
              <FormattedMessage defaultMessage="Health check interval (seconds):" description="Label for health check interval" />
            </FormUI.Label>
            <RHFControlledComponents.Input
              control={form.control}
              id="mlflow.endpoint.create.health_check_interval"
              componentId="mlflow.endpoint.create.health_check_interval"
              name="health_check_interval"
              type="number"
              rules={{
                required: {
                  value: selectedStatus === 'health-check',
                  message: intl.formatMessage({
                    defaultMessage: 'Health check interval is required',
                    description: 'Validation error for health check interval',
                  }),
                },
                min: {
                  value: 1,
                  message: intl.formatMessage({
                    defaultMessage: 'Interval must be at least 1 second',
                    description: 'Validation error for health check interval minimum',
                  }),
                },
              }}
              placeholder={intl.formatMessage({
                defaultMessage: '60',
                description: 'Placeholder for health check interval',
              })}
              validationState={form.formState.errors.health_check_interval ? 'error' : undefined}
            />
            {form.formState.errors.health_check_interval && (
              <FormUI.Message type="error" message={form.formState.errors.health_check_interval.message} />
            )}
            <Spacer />

            <FormUI.Label htmlFor="mlflow.endpoint.create.health_check_timeout">
              <FormattedMessage defaultMessage="Health check timeout (seconds):" description="Label for health check timeout" />
            </FormUI.Label>
            <RHFControlledComponents.Input
              control={form.control}
              id="mlflow.endpoint.create.health_check_timeout"
              componentId="mlflow.endpoint.create.health_check_timeout"
              name="health_check_timeout"
              type="number"
              rules={{
                required: {
                  value: selectedStatus === 'health-check',
                  message: intl.formatMessage({
                    defaultMessage: 'Health check timeout is required',
                    description: 'Validation error for health check timeout',
                  }),
                },
                min: {
                  value: 1,
                  message: intl.formatMessage({
                    defaultMessage: 'Timeout must be at least 1 second',
                    description: 'Validation error for health check timeout minimum',
                  }),
                },
              }}
              placeholder={intl.formatMessage({
                defaultMessage: '5',
                description: 'Placeholder for health check timeout',
              })}
              validationState={form.formState.errors.health_check_timeout ? 'error' : undefined}
            />
            {form.formState.errors.health_check_timeout && (
              <FormUI.Message type="error" message={form.formState.errors.health_check_timeout.message} />
            )}
            <Spacer />

            <FormUI.Label htmlFor="mlflow.endpoint.create.health_check_path">
              <FormattedMessage defaultMessage="Health check endpoint path:" description="Label for health check path" />
            </FormUI.Label>
            <RHFControlledComponents.Input
              control={form.control}
              id="mlflow.endpoint.create.health_check_path"
              componentId="mlflow.endpoint.create.health_check_path"
              name="health_check_path"
              rules={{
                required: {
                  value: selectedStatus === 'health-check',
                  message: intl.formatMessage({
                    defaultMessage: 'Health check endpoint path is required',
                    description: 'Validation error for health check path',
                  }),
                },
                pattern: {
                  value: /^\/.+/,
                  message: intl.formatMessage({
                    defaultMessage: 'Path must start with /',
                    description: 'Validation error for health check path format',
                  }),
                },
              }}
              placeholder={intl.formatMessage({
                defaultMessage: '/health',
                description: 'Placeholder for health check path',
              })}
              validationState={form.formState.errors.health_check_path ? 'error' : undefined}
            />
            {form.formState.errors.health_check_path && (
              <FormUI.Message type="error" message={form.formState.errors.health_check_path.message} />
            )}
            <FormUI.Hint>
              <FormattedMessage
                defaultMessage="The endpoint path to ping for health checks (e.g., /health, /status)."
                description="Hint for health check path field"
              />
            </FormUI.Hint>
          </>
        )}
      </Modal>
    </FormProvider>
  );

  const openModal = () => {
    setError(null);
    form.reset({
      endpoint: '',
      server_name: preselectedServer || '',
      version_or_alias: '',
      credential_ref: '',
      status: 'active',
      health_check_interval: '60',
      health_check_timeout: '5',
      health_check_path: '/health',
    });
    setOpen(true);
  };

  return { CreateEndpointModal: modalElement, openModal };
};
