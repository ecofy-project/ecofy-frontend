import { useState, type FormEvent } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Icon,
  Modal,
  Select,
  useToast,
} from '../../../components/ui';
import { AccountPageHeader } from '../components/AccountPageHeader';
import {
  AccountPageSkeleton,
  AccountResourceError,
  AccountSessionUnavailable,
} from '../components/AccountResourceState';
import { useConnections } from '../hooks/use-connections';
import {
  connectionProviders,
  connectionTypes,
  type ConnectionProvider,
  type ConnectionType,
} from '../types/user';

const typeLabels: Readonly<Record<string, string>> = {
  BANK_API: 'API bancária',
  CSV_IMPORT: 'Importação CSV',
  OPEN_FINANCE: 'Open Finance',
  MANUAL: 'Registro manual',
};

const providerLabels: Readonly<Record<string, string>> = {
  ITAU: 'Itaú',
  NUBANK: 'Nubank',
  BRADESCO: 'Bradesco',
  SANTANDER: 'Santander',
  CAIXA: 'Caixa',
  BANCO_DO_BRASIL: 'Banco do Brasil',
  INTER: 'Inter',
  C6: 'C6',
  OTHER: 'Outro provedor',
};

const typeOptions = connectionTypes.map((value) => ({
  value,
  label: typeLabels[value] ?? value,
}));

const providerOptions = connectionProviders.map((value) => ({
  value,
  label: providerLabels[value] ?? value,
}));

export function ConnectionsPage() {
  const { currentUser } = useSession();
  const connections = useConnections(currentUser?.id);
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<ConnectionType>('MANUAL');
  const [provider, setProvider] = useState<ConnectionProvider>('OTHER');

  if (!currentUser) {
    return <AccountSessionUnavailable />;
  }

  if (connections.isLoading && !connections.data) {
    return <AccountPageSkeleton cards={2} />;
  }

  if (connections.error && !connections.data) {
    return <AccountResourceError error={connections.error} onRetry={connections.reload} />;
  }

  if (!connections.data) {
    return <AccountResourceError error={{ message: 'As conexões não puderam ser carregadas.' }} onRetry={connections.reload} />;
  }

  const openCreateModal = () => {
    connections.clearMutationError();
    setType('MANUAL');
    setProvider('OTHER');
    setModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!connections.isCreating) {
      connections.clearMutationError();
      setModalOpen(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await connections.createConnection({ type, provider });

    if (!result.ok) {
      return;
    }

    setModalOpen(false);
    showToast({
      title: 'Conexão adicionada',
      message: 'A nova conexão foi registrada na sua conta.',
      tone: 'success',
    });
  };

  return (
    <div className="account-page">
      <AccountPageHeader
        action={
          <Button leadingIcon="connections" onClick={openCreateModal}>
            Adicionar conexão
          </Button>
        }
        description="Consulte os meios de integração registrados para sua conta."
        eyebrow="Integrações da conta"
        title="Conexões"
      />

      {connections.data.length === 0 ? (
        <Card as="section" className="account-state-card">
          <EmptyState
            actionLabel="Adicionar conexão"
            description="Registre uma integração usando somente um tipo e um provedor aceitos pelo serviço."
            onAction={openCreateModal}
            title="Nenhuma conexão registrada"
          />
        </Card>
      ) : (
        <section aria-label="Conexões registradas" className="connections-grid">
          {connections.data.map((connection, index) => (
            <Card as="article" className="connection-card" key={`${connection.type}-${connection.provider}-${index}`}>
              <div className="connection-card__top">
                <span aria-hidden="true" className="connection-card__icon">
                  <Icon name="connections" size={20} />
                </span>
              </div>
              <div className="connection-card__copy">
                <span className="connection-card__code numeric">{connection.type}</span>
                <h2>{typeLabels[connection.type] ?? connection.type}</h2>
                <p>{providerLabels[connection.provider] ?? connection.provider}</p>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Modal
        footer={
          <>
            <Button disabled={connections.isCreating} onClick={closeCreateModal} variant="ghost">
              Cancelar
            </Button>
            <Button form="create-connection-form" loading={connections.isCreating} type="submit">
              Adicionar conexão
            </Button>
          </>
        }
        onClose={closeCreateModal}
        open={modalOpen}
        title="Adicionar conexão"
      >
        <form className="account-form" id="create-connection-form" onSubmit={handleSubmit}>
          <p className="connection-form__description">
            Escolha uma combinação suportada pelo serviço. Dados técnicos e metadados não são solicitados nesta interface.
          </p>
          {connections.mutationError ? (
            <Alert title="Não foi possível adicionar" tone="danger">
              {connections.mutationError.message}
            </Alert>
          ) : null}
          <Select
            label="Tipo de conexão"
            onChange={(event) => setType(event.currentTarget.value as ConnectionType)}
            options={typeOptions}
            value={type}
          />
          <Select
            label="Provedor"
            onChange={(event) => setProvider(event.currentTarget.value as ConnectionProvider)}
            options={providerOptions}
            value={provider}
          />
        </form>
      </Modal>
    </div>
  );
}
