import {
  Alert,
  FormUI,
  Modal,
  RHFControlledComponents,
  Spacer,
} from '@databricks/design-system';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';

export const useRegisterToolModal = ({
  experimentId,
  onSuccess,
}: {
  experimentId?: string;
  onSuccess?: (result: {
    internalName: string;
    displayName?: string;
    serverVersion?: string;
    description: string;
    serverJson: string;
  }) => void | Promise<any>;
}) => {
  const [open, setOpen] = useState(false);
  const intl = useIntl();

  const form = useForm<{
    displayName: string;
    description: string;
    serverJson: string;
  }>({
    defaultValues: {
      displayName: '',
      description: '',
      serverJson: '',
    },
  });

  // Mock mutation - in a real implementation, this would be a mutation hook
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (values: { displayName: string; description: string; serverJson: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate and parse server.json
      let parsedServerJson: any;
      try {
        parsedServerJson = JSON.parse(values.serverJson);
      } catch (e) {
        setError(new Error('Invalid JSON format in server configuration'));
        setIsLoading(false);
        return;
      }

      // Extract required internal_name from server.json
      const internalName = parsedServerJson?.name;
      if (!internalName) {
        setError(new Error('Server configuration must include a "name" field'));
        setIsLoading(false);
        return;
      }

      // Extract optional server_version from server.json
      const serverVersion = parsedServerJson?.version;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In a real implementation, this would call an API to register the tool
      console.log('Registering tool:', {
        internalName,
        displayName: values.displayName || undefined,
        serverVersion,
        description: values.description,
        serverJson: values.serverJson,
        experimentId,
      });

      onSuccess?.({
        internalName,
        displayName: values.displayName || undefined,
        serverVersion,
        description: values.description,
        serverJson: values.serverJson,
      });
      setOpen(false);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const modalElement = (
    <FormProvider {...form}>
      <Modal
        componentId="mlflow.tools.create.modal"
        visible={open}
        onCancel={() => setOpen(false)}
        title={
          <FormattedMessage
            defaultMessage="Create MCP server"
            description="A header for the create MCP server modal in the MCP registry UI"
          />
        }
        okText={
          <FormattedMessage
            defaultMessage="Create"
            description="A label for the confirm button in the create MCP server modal"
          />
        }
        okButtonProps={{ loading: isLoading }}
        onOk={form.handleSubmit(handleSubmit)}
        cancelText={
          <FormattedMessage
            defaultMessage="Cancel"
            description="A label for the cancel button in the register tool modal"
          />
        }
        size="normal"
      >
        {error?.message && (
          <>
            <Alert componentId="mlflow.tools.create.error" closable={false} message={error.message} type="error" />
            <Spacer />
          </>
        )}
        <FormUI.Label htmlFor="mlflow.tools.create.displayName">
          <FormattedMessage defaultMessage="Display name (optional):" description="Label for MCP server display name field" />
        </FormUI.Label>
        <FormUI.Hint>
          <FormattedMessage
            defaultMessage="Optional friendly name. If not provided, will use the name from server.json"
            description="Help text for MCP server display name field"
          />
        </FormUI.Hint>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.tools.create.displayName"
          componentId="mlflow.tools.create.displayName"
          name="displayName"
          placeholder={intl.formatMessage({
            defaultMessage: 'e.g., Analytics Platform MCP',
            description: 'A placeholder for the MCP server display name in the create MCP server modal',
          })}
          validationState={form.formState.errors.displayName ? 'error' : undefined}
        />
        {form.formState.errors.displayName && (
          <FormUI.Message type="error" message={form.formState.errors.displayName.message} />
        )}
        <Spacer />
        <FormUI.Label htmlFor="mlflow.tools.create.description">
          <FormattedMessage defaultMessage="Description (optional):" description="Label for MCP server description field" />
        </FormUI.Label>
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.tools.create.description"
          componentId="mlflow.tools.create.description"
          name="description"
          autoSize={{ minRows: 3, maxRows: 6 }}
          placeholder={intl.formatMessage({
            defaultMessage: 'Describe what this MCP server does',
            description: 'A placeholder for the MCP server description in the create MCP server modal',
          })}
        />
        <Spacer />
        <FormUI.Label htmlFor="mlflow.tools.create.serverJson">
          <FormattedMessage defaultMessage="Server definition (json):" description="Label for MCP server configuration field" />
        </FormUI.Label>
        <FormUI.Hint>
          <FormattedMessage
            defaultMessage='Must include a "name" field (e.g., io.github.anthropic/brave-search)'
            description="Help text for MCP server configuration field"
          />
        </FormUI.Hint>
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.tools.create.serverJson"
          componentId="mlflow.tools.create.serverJson"
          name="serverJson"
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                defaultMessage: 'Server definition is required',
                description: 'A validation state for the MCP server configuration in the create MCP server modal',
              }),
            },
          }}
          autoSize={{ minRows: 6, maxRows: 12 }}
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter your MCP server definitions',
            description: 'A placeholder for the MCP server configuration in the create MCP server modal',
          })}
          validationState={form.formState.errors.serverJson ? 'error' : undefined}
        />
        {form.formState.errors.serverJson && (
          <FormUI.Message type="error" message={form.formState.errors.serverJson.message} />
        )}
      </Modal>
    </FormProvider>
  );

  const openModal = () => {
    setError(null);
    form.reset({
      displayName: '',
      description: '',
      serverJson: '',
    });
    setOpen(true);
  };

  return { RegisterToolModal: modalElement, openModal };
};
