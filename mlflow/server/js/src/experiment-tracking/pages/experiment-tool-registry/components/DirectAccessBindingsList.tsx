import {
  Button,
  PlusIcon,
  Typography,
  useDesignSystemTheme,
  Tag,
  TrashIcon,
} from '@databricks/design-system';
import { FormattedMessage, useIntl } from 'react-intl';
import type { DirectAccessBinding, RegisteredTool } from '../types';
import Utils from '../../../../common/utils/Utils';
import { useState, useEffect } from 'react';
import { useCreateEndpointModal } from '../hooks/useCreateEndpointModal';

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

export const DirectAccessBindingsList = ({
  serverName,
  tools,
  onEditBinding,
}: {
  serverName: string;
  tools: RegisteredTool[];
  onEditBinding?: (binding: DirectAccessBinding) => void;
}) => {
  const { theme } = useDesignSystemTheme();
  const intl = useIntl();
  const [bindings, setBindings] = useState<DirectAccessBinding[]>([]);

  const { CreateEndpointModal, openModal: openCreateEndpointModal } = useCreateEndpointModal({
    tools,
    preselectedServer: serverName,
    onSuccess: () => {
      // Reload bindings for this server
      const allBindings = loadBindingsFromStorage();
      const serverBindings = allBindings.filter((b) => b.server_name === serverName);
      setBindings(serverBindings);
    },
  });

  useEffect(() => {
    const allBindings = loadBindingsFromStorage();
    const serverBindings = allBindings.filter((b) => b.server_name === serverName);
    setBindings(serverBindings);
  }, [serverName]);

  const handleDelete = (bindingId: string) => {
    const allBindings = loadBindingsFromStorage();
    const updatedBindings = allBindings.filter((b) => b.id !== bindingId);
    saveBindingsToStorage(updatedBindings);
    setBindings(updatedBindings.filter((b) => b.server_name === serverName));
  };

  return (
    <div>
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <div css={{ fontWeight: 600 }}>
          <FormattedMessage
            defaultMessage="Endpoints"
            description="Label for endpoints section"
          />
        </div>
        <Button
          componentId="mlflow.tool-registry.details.add_endpoint"
          icon={<PlusIcon />}
          size="small"
          onClick={openCreateEndpointModal}
        >
          <FormattedMessage defaultMessage="Add endpoint" description="Button to add a new endpoint" />
        </Button>
      </div>

      {bindings.length === 0 ? (
        <div css={{ padding: theme.spacing.md, textAlign: 'center', color: theme.colors.textSecondary }}>
          <FormattedMessage
            defaultMessage="No endpoints configured for this server."
            description="Message when no endpoints exist"
          />
        </div>
      ) : (
        <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {bindings.map((binding) => (
            <div
              key={binding.id}
              css={{
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borders.borderRadiusMd,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div css={{ flex: 1 }}>
                <div css={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                  <span css={{ fontFamily: 'monospace', fontSize: theme.typography.fontSizeSm, fontWeight: 600 }}>
                    {binding.endpoint}
                  </span>
                  <Tag
                    componentId="mlflow.tool-registry.binding-status-tag"
                    color={
                      binding.status === 'active' || binding.status === 'health-check' ? 'teal' : 'lemon'
                    }
                  >
                    {binding.status === 'active' || binding.status === 'health-check' ? 'Active' : 'Deprecated'}
                  </Tag>
                </div>
                <div css={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs, fontSize: theme.typography.fontSizeSm }}>
                  <div css={{ display: 'flex', gap: theme.spacing.md }}>
                    <span>
                      <strong>
                        <FormattedMessage defaultMessage="Version:" description="Label for binding version" />
                      </strong>{' '}
                      {binding.alias ? `@ ${binding.alias}` : binding.version ? `v${binding.version}` : 'Latest'}
                    </span>
                    <span>
                      <strong>
                        <FormattedMessage defaultMessage="Credential:" description="Label for binding credential" />
                      </strong>{' '}
                      {binding.credential_ref ? (
                        <span css={{ color: '#28a745' }}>✓ {binding.credential_ref}</span>
                      ) : (
                        <span css={{ opacity: 0.6 }}>None</span>
                      )}
                    </span>
                    <span>
                      <strong>
                        <FormattedMessage defaultMessage="Updated:" description="Label for last updated" />
                      </strong>{' '}
                      {Utils.formatTimestamp(binding.last_updated_timestamp, intl)}
                    </span>
                  </div>
                  {binding.status === 'health-check' && binding.health_check && (
                    <div css={{ display: 'flex', gap: theme.spacing.md }}>
                      <span>
                        <strong>
                          <FormattedMessage defaultMessage="Interval:" description="Label for health check interval" />
                        </strong>{' '}
                        {binding.health_check.interval_seconds}s
                      </span>
                      <span>
                        <strong>
                          <FormattedMessage defaultMessage="Timeout:" description="Label for health check timeout" />
                        </strong>{' '}
                        {binding.health_check.timeout_seconds}s
                      </span>
                      <span>
                        <strong>
                          <FormattedMessage defaultMessage="Path:" description="Label for health check path" />
                        </strong>{' '}
                        <span css={{ fontFamily: 'monospace' }}>{binding.health_check.endpoint_path}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div css={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                <Typography.Link
                  componentId="mlflow.tool-registry.details.edit_binding"
                  onClick={() => onEditBinding?.(binding)}
                >
                  <FormattedMessage defaultMessage="Edit" description="Edit link for endpoint" />
                </Typography.Link>
                <Button
                  componentId="mlflow.tool-registry.details.delete_binding"
                  icon={<TrashIcon />}
                  size="small"
                  danger
                  onClick={() => handleDelete(binding.id)}
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
