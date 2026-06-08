import {
  Button,
  PlusIcon,
  Typography,
  useDesignSystemTheme,
  Tag,
  TrashIcon,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { MCPAccessBinding, RegisteredTool } from '../types';
import Utils from '../../../../common/utils/Utils';
import { useState, useEffect } from 'react';
import { Link } from '../../../../common/utils/RoutingUtils';
import Routes from '../../../routes';
import { useCreateEndpointModal } from '../hooks/useCreateEndpointModal';
import { getBindingVersionLabel } from '../utils/accessBindingUtils';
import { loadBindingsFromStorage, saveBindingsToStorage } from '../utils/registryStorage';

export const DirectAccessBindingsList = ({
  serverName,
  tools,
  onEditBinding,
}: {
  serverName: string;
  tools: RegisteredTool[];
  onEditBinding?: (binding: MCPAccessBinding) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [bindings, setBindings] = useState<MCPAccessBinding[]>([]);

  const { CreateEndpointModal, openModal: openCreateEndpointModal } = useCreateEndpointModal({
    tools,
    preselectedServer: serverName,
    onSuccess: () => {
      // Reload bindings for this server
      const allBindings = loadBindingsFromStorage(tools);
      const serverBindings = allBindings.filter((b) => b.server_name === serverName);
      setBindings(serverBindings);
    },
  });

  useEffect(() => {
    const allBindings = loadBindingsFromStorage(tools);
    const serverBindings = allBindings.filter((b) => b.server_name === serverName);
    setBindings(serverBindings);
  }, [serverName]);

  const handleDelete = (bindingId: string) => {
    const allBindings = loadBindingsFromStorage(tools);
    const updatedBindings = allBindings.filter((b) => b.binding_id !== bindingId);
    saveBindingsToStorage(updatedBindings);
    setBindings(updatedBindings.filter((b) => b.server_name === serverName));
  };

  return (
    <div>
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <div css={{ fontWeight: 600 }}>
          <FormattedMessage
            defaultMessage="Access Bindings"
            description="Label for access bindings section"
          />
        </div>
        <Button
          componentId="mlflow.tool-registry.details.add_access_binding"
          icon={<PlusIcon />}
          size="small"
          onClick={openCreateEndpointModal}
        >
          <FormattedMessage defaultMessage="Add access binding" description="Button to add a new access binding" />
        </Button>
      </div>

      {bindings.length === 0 ? (
        <div css={{ padding: theme.spacing.md, textAlign: 'center', color: theme.colors.textSecondary }}>
          <FormattedMessage
            defaultMessage="No access bindings configured for this server."
            description="Message when no access bindings exist"
          />
        </div>
      ) : (
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {bindings.map((binding) => (
            <div
              key={binding.binding_id}
              css={{
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borders.borderRadiusMd,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Link
                componentId={`mlflow.tool-registry.details.binding_link.${binding.binding_id}`}
                to={Routes.getAccessBindingDetailsPageRoute(binding.binding_id)}
                css={{
                  flex: 1,
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                  <span css={{ fontFamily: 'monospace', fontSize: theme.typography.fontSizeSm, fontWeight: 600 }}>
                    {binding.endpoint_url}
                  </span>
                  <Tag
                    componentId="mlflow.tool-registry.binding-transport-tag"
                    color="turquoise"
                  >
                    {binding.transport_type}
                  </Tag>
                </div>
                <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, fontSize: theme.typography.fontSizeSm }}>
                  {binding.description && (
                    <Typography.Text color="secondary" size="sm">
                      {binding.description}
                    </Typography.Text>
                  )}
                  <div css={{ display: 'flex', gap: theme.spacing.md }}>
                    <span>
                      <strong>
                        <FormattedMessage defaultMessage="Target:" description="Label for binding target" />
                      </strong>{' '}
                      {getBindingVersionLabel(binding)}
                    </span>
                    <span>
                      <strong>
                        <FormattedMessage defaultMessage="Workspace:" description="Label for workspace" />
                      </strong>{' '}
                      {binding.workspace}
                    </span>
                    <span>
                      <strong>
                        <FormattedMessage defaultMessage="Updated:" description="Label for last updated" />
                      </strong>{' '}
                      {Utils.formatTimestamp(binding.last_updated_timestamp, intl)}
                    </span>
                  </div>
                </div>
              </Link>
              <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                <Typography.Link
                  componentId="mlflow.tool-registry.details.edit_binding"
                  onClick={() => onEditBinding?.(binding)}
                >
                  <FormattedMessage defaultMessage="Edit" description="Edit link for access binding" />
                </Typography.Link>
                <Button
                  componentId="mlflow.tool-registry.details.delete_binding"
                  icon={<TrashIcon />}
                  size="small"
                  danger
                  onClick={() => handleDelete(binding.binding_id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {CreateEndpointModal}
    </div>
  );
};
