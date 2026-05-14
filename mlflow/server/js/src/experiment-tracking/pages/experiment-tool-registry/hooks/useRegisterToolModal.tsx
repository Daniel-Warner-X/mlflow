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
  onSuccess?: (result: { toolName: string; description: string; serverJson: string }) => void | Promise<any>;
}) => {
  const [open, setOpen] = useState(false);
  const intl = useIntl();

  const form = useForm<{
    name: string;
    description: string;
    serverJson: string;
  }>({
    defaultValues: {
      name: '',
      description: '',
      serverJson: '',
    },
  });

  // Mock mutation - in a real implementation, this would be a mutation hook
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (values: { name: string; description: string; serverJson: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate JSON if provided
      if (values.serverJson) {
        try {
          JSON.parse(values.serverJson);
        } catch (e) {
          setError(new Error('Invalid JSON format in server configuration'));
          setIsLoading(false);
          return;
        }
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In a real implementation, this would call an API to register the tool
      console.log('Registering tool:', {
        name: values.name,
        description: values.description,
        serverJson: values.serverJson,
        experimentId,
      });

      onSuccess?.({ toolName: values.name, description: values.description, serverJson: values.serverJson });
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
        <FormUI.Label htmlFor="mlflow.tools.create.name">
          <FormattedMessage defaultMessage="Name:" description="Label for MCP server name field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.tools.create.name"
          componentId="mlflow.tools.create.name"
          name="name"
          rules={{
            required: {
              value: true,
              message: intl.formatMessage({
                defaultMessage: 'Name is required',
                description: 'A validation state for the MCP server name in the create MCP server modal',
              }),
            },
            pattern: {
              value: /^[a-zA-Z0-9_\-.]+$/,
              message: intl.formatMessage({
                defaultMessage: 'Only alphanumeric characters, underscores, hyphens, and dots are allowed',
                description: 'A validation state for the MCP server name format in the create MCP server modal',
              }),
            },
          }}
          placeholder={intl.formatMessage({
            defaultMessage: 'Provide a unique MCP server name',
            description: 'A placeholder for the MCP server name in the create MCP server modal',
          })}
          validationState={form.formState.errors.name ? 'error' : undefined}
        />
        {form.formState.errors.name && (
          <FormUI.Message type="error" message={form.formState.errors.name.message} />
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
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.tools.create.serverJson"
          componentId="mlflow.tools.create.serverJson"
          name="serverJson"
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
      name: '',
      description: '',
      serverJson: '',
    });
    setOpen(true);
  };

  return { RegisterToolModal: modalElement, openModal };
};
