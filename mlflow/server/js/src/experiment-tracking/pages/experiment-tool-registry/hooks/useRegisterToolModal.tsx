import {
  Alert,
  FormUI,
  Modal,
  RHFControlledComponents,
  Spacer,
} from '@databricks/design-system';
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import type { ParsedServerJson } from '../types';

export const useRegisterToolModal = ({
  experimentId,
  onSuccess,
}: {
  experimentId?: string;
  onSuccess?: (result: {
    internalName: string;
    displayName?: string; // Auto-extracted from server.json "title" field
    serverVersion?: string;
    serverJson: string;
    parsedServerJson?: ParsedServerJson;
  }) => void | Promise<any>;
}) => {
  const [open, setOpen] = useState(false);
  const intl = useIntl();

  const form = useForm<{
    serverJson: string;
  }>({
    defaultValues: {
      serverJson: '',
    },
  });

  // Mock mutation - in a real implementation, this would be a mutation hook
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (values: { serverJson: string }) => {
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

      // Handle both flat structure and nested "server" structure
      const serverData = parsedServerJson?.server || parsedServerJson;

      // Extract required internal_name from server.json
      const internalName = serverData?.name;
      if (!internalName) {
        setError(new Error('Server configuration must include a "name" field'));
        setIsLoading(false);
        return;
      }

      // Extract and structure parsed fields from server.json
      const parsedFields: ParsedServerJson = {
        title: serverData?.title,
        description: serverData?.description,
        version: serverData?.version,
        websiteUrl: serverData?.websiteUrl,
        repository: serverData?.repository
          ? {
              url: serverData.repository.url,
              source: serverData.repository.source,
            }
          : undefined,
        packages: serverData?.packages?.map((pkg: any) => ({
          runtimeHint: pkg.runtimeHint,
          identifier: pkg.identifier,
          version: pkg.version,
          registryType: pkg.registryType,
          environmentVariables: pkg.environmentVariables,
          runtimeArguments: pkg.runtimeArguments,
          packageArguments: pkg.packageArguments,
        })),
        icons: serverData?.icons?.map((icon: any) => ({
          src: icon.src,
          mimeType: icon.mimeType,
        })),
      };

      // Extract optional server_version from server.json
      const serverVersion = serverData?.version;

      // Extract display name from title in JSON
      const displayName = serverData?.title;

      // Normalize serverJson to always store the flat structure (unwrap "server" if present)
      const normalizedServerJson = JSON.stringify(serverData, null, 2);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In a real implementation, this would call an API to register the tool
      console.log('Registering tool:', {
        internalName,
        displayName: displayName || undefined,
        serverVersion,
        serverJson: normalizedServerJson,
        parsedServerJson: parsedFields,
        experimentId,
      });

      onSuccess?.({
        internalName,
        displayName: displayName || undefined,
        serverVersion,
        serverJson: normalizedServerJson,
        parsedServerJson: parsedFields,
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
        <FormUI.Label htmlFor="mlflow.tools.create.serverJson">
          <FormattedMessage defaultMessage="server.json:" description="Label for MCP server configuration field" />
        </FormUI.Label>
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
      serverJson: '',
    });
    setOpen(true);
  };

  return { RegisterToolModal: modalElement, openModal };
};
