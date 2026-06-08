import {
  Alert,
  FormUI,
  Modal,
  RHFControlledComponents,
  Spacer,
  useDesignSystemTheme,
} from '@databricks/design-system';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPStatus, MCPTool, ParsedServerJson, RegisteredTool, ServerIcon, ToolVersion } from '../types';
import {
  buildRegisterToolFormValues,
  parseTagsInput,
  parseToolsInput,
  parseSvgIconInput,
} from '../utils/registerServerUtils';

export enum RegisterToolModalMode {
  CreateServer = 'CreateServer',
  CreateServerVersion = 'CreateServerVersion',
}

export interface RegisterToolResult {
  internalName: string;
  displayName?: string;
  serverVersion?: string;
  serverJson: string;
  parsedServerJson?: ParsedServerJson;
  status: MCPStatus;
  source?: string;
  tags?: Record<string, string>;
  tools?: MCPTool[];
  icons?: ServerIcon[];
}

const emptyFormValues = {
  serverJson: '',
  displayName: '',
  status: 'draft' as MCPStatus,
  source: '',
  tags: '',
  tools: '',
  iconSvg: '',
};

export const useRegisterToolModal = ({
  experimentId,
  mode = RegisterToolModalMode.CreateServer,
  registeredTool,
  sourceVersion,
  modalTitle,
  onSuccess,
}: {
  experimentId?: string;
  mode?: RegisterToolModalMode;
  registeredTool?: RegisteredTool;
  sourceVersion?: ToolVersion;
  modalTitle?: ReactNode;
  onSuccess?: (result: RegisterToolResult) => void | Promise<any>;
}) => {
  const [open, setOpen] = useState(false);
  const intl = useIntl();
  const { theme } = useDesignSystemTheme();

  const form = useForm<{
    serverJson: string;
    displayName: string;
    status: MCPStatus;
    source: string;
    tags: string;
    tools: string;
    iconSvg: string;
  }>({
    defaultValues: {
      serverJson: '',
      displayName: '',
      status: 'draft',
      source: '',
      tags: '',
      tools: '',
      iconSvg: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (values: {
    serverJson: string;
    displayName: string;
    status: MCPStatus;
    source: string;
    tags: string;
    tools: string;
    iconSvg: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      let parsedServerJson: any;
      try {
        parsedServerJson = JSON.parse(values.serverJson);
      } catch {
        setError(new Error('Invalid JSON format in server configuration'));
        setIsLoading(false);
        return;
      }

      const serverData = parsedServerJson?.server || parsedServerJson;

      const internalName = serverData?.name;
      if (!internalName) {
        setError(new Error('Server configuration must include a "name" field'));
        setIsLoading(false);
        return;
      }

      if (values.tools.trim()) {
        const parsedTools = parseToolsInput(values.tools);
        if (!parsedTools) {
          setError(new Error('Tools must be a valid JSON array of objects with a "name" field'));
          setIsLoading(false);
          return;
        }
      }

      const parsedIcons = parseSvgIconInput(values.iconSvg);
      if (parsedIcons === null) {
        setError(new Error('Icon must be raw SVG markup or a data:image/svg+xml URI'));
        setIsLoading(false);
        return;
      }

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

      const serverVersion = serverData?.version;
      const normalizedServerJson = JSON.stringify(serverData, null, 2);

      await new Promise((resolve) => setTimeout(resolve, 500));

      onSuccess?.({
        internalName,
        displayName: values.displayName.trim() || undefined,
        serverVersion,
        serverJson: normalizedServerJson,
        parsedServerJson: parsedFields,
        status: values.status,
        source: values.source.trim() || undefined,
        tags: parseTagsInput(values.tags),
        tools: parseToolsInput(values.tools),
        icons: parsedIcons,
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
          modalTitle ?? (
            <FormattedMessage
              defaultMessage="Create MCP server"
              description="A header for the create MCP server modal in the MCP registry UI"
            />
          )
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
          <FormattedMessage defaultMessage="Display name:" description="Label for MCP server display name field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.tools.create.displayName"
          componentId="mlflow.tools.create.displayName"
          name="displayName"
          placeholder={intl.formatMessage({
            defaultMessage: 'Human-readable label for this server',
            description: 'Placeholder for MCP server display name',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.tools.create.serverJson">
          <FormattedMessage defaultMessage="server.json:" description="Label for MCP server configuration field" />
          <span css={{ color: theme.colors.textValidationDanger }}> *</span>
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
        <Spacer />

        <FormUI.Label htmlFor="mlflow.tools.create.status">
          <FormattedMessage defaultMessage="Status:" description="Label for MCP server version status field" />
          <span css={{ color: theme.colors.textValidationDanger }}> *</span>
        </FormUI.Label>
        <RHFControlledComponents.Select
          control={form.control}
          id="mlflow.tools.create.status"
          componentId="mlflow.tools.create.status"
          name="status"
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'active', label: 'Active' },
            { value: 'deprecated', label: 'Deprecated' },
          ]}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.tools.create.source">
          <FormattedMessage defaultMessage="Source:" description="Label for MCP server version source field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.tools.create.source"
          componentId="mlflow.tools.create.source"
          name="source"
          placeholder={intl.formatMessage({
            defaultMessage: 'https://github.com/org/repo',
            description: 'Placeholder for MCP server version source URI',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.tools.create.tags">
          <FormattedMessage defaultMessage="Tags:" description="Label for MCP server version tags field" />
        </FormUI.Label>
        <RHFControlledComponents.Input
          control={form.control}
          id="mlflow.tools.create.tags"
          componentId="mlflow.tools.create.tags"
          name="tags"
          placeholder={intl.formatMessage({
            defaultMessage: 'team=platform, env=production',
            description: 'Placeholder for comma-separated MCP server version tags',
          })}
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.tools.create.tools">
          <FormattedMessage defaultMessage="Tools:" description="Label for MCP server version tools field" />
        </FormUI.Label>
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.tools.create.tools"
          componentId="mlflow.tools.create.tools"
          name="tools"
          autoSize={{ minRows: 3, maxRows: 8 }}
          placeholder='[{"name": "search", "description": "Search the web"}]'
        />
        <Spacer />

        <FormUI.Label htmlFor="mlflow.tools.create.iconSvg">
          <FormattedMessage defaultMessage="Icon:" description="Label for MCP server SVG icon field" />
        </FormUI.Label>
        <RHFControlledComponents.TextArea
          control={form.control}
          id="mlflow.tools.create.iconSvg"
          componentId="mlflow.tools.create.iconSvg"
          name="iconSvg"
          autoSize={{ minRows: 3, maxRows: 8 }}
          placeholder={intl.formatMessage({
            defaultMessage: '<svg>...</svg> or leave blank to use server.json',
            description: 'Placeholder for MCP server SVG icon field',
          })}
        />
      </Modal>
    </FormProvider>
  );

  const openModal = () => {
    setError(null);
    if (mode === RegisterToolModalMode.CreateServerVersion && registeredTool) {
      form.reset(buildRegisterToolFormValues(registeredTool, sourceVersion));
    } else {
      form.reset(emptyFormValues);
    }
    setOpen(true);
  };

  return { RegisterToolModal: modalElement, openModal };
};
