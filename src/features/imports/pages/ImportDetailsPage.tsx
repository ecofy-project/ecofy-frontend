import { AppLink } from '../../../app/routing/router';
import { Alert, Card, StatusBadge } from '../../../components/ui';
import { ImportCounters } from '../components/ImportCounters';
import { ImportErrorList } from '../components/ImportErrorList';
import {
  ImportDetailsSkeleton,
  ImportErrorState,
} from '../components/ImportResourceState';
import { useImportDetails } from '../hooks/use-import-details';
import {
  formatImportDateTime,
  importStatusDescription,
  importStatusLabel,
  importStatusTone,
} from '../utils/import-labels';

/**
 * Detalhes de uma importação. Apresenta apenas os campos publicados pelo
 * contrato; o conteúdo bruto das linhas nunca é exibido.
 */
export function ImportDetailsPage({ jobId }: { jobId: string }) {
  const { details, error, isLoading, isRefreshing, pollingExhausted, reload } =
    useImportDetails(jobId);

  if (isLoading) {
    return <ImportDetailsSkeleton />;
  }

  if (error && !details) {
    return <ImportErrorState error={error} onRetry={reload} />;
  }

  if (!details) {
    return null;
  }

  const { errors, job } = details;
  const timestamps = [
    { label: 'Criada em', value: job.createdAt },
    { label: 'Iniciada em', value: job.startedAt },
    { label: 'Concluída em', value: job.finishedAt },
    { label: 'Atualizada em', value: job.updatedAt },
  ];

  return (
    <div className="demo-page">
      <header className="demo-page__header">
        <div>
          <span className="demo-eyebrow">DETALHES DA IMPORTAÇÃO</span>
          <h1>{importStatusDescription(job.status)}</h1>
          <p>{formatImportDateTime(job.createdAt)}</p>
        </div>
        <StatusBadge tone={importStatusTone(job.status)}>
          {importStatusLabel(job.status)}
        </StatusBadge>
      </header>

      <p aria-live="polite" className="import-history__status">
        {isRefreshing ? 'Atualizando informações...' : ''}
      </p>

      {job.status === 'FAILED' ? (
        <Alert title="A importação não foi concluída" tone="danger">
          Nenhum registro foi publicado. Revise o arquivo e envie novamente.
        </Alert>
      ) : null}

      {job.status === 'COMPLETED_WITH_ERRORS' ? (
        <Alert title="Parte dos registros não pôde ser processada" tone="warning">
          Os registros válidos foram importados.
        </Alert>
      ) : null}

      {pollingExhausted ? (
        <Alert title="Processamento ainda em andamento" tone="info">
          O acompanhamento automático foi encerrado. Recarregue a página para
          consultar o resultado mais tarde.
        </Alert>
      ) : null}

      <Card as="section" className="import-details-card">
        <h2>Resumo do processamento</h2>
        <ImportCounters job={job} />
        <dl className="import-details-card__timestamps">
          {timestamps.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{formatImportDateTime(item.value)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {errors.length > 0 ? (
        <Card as="section" className="import-details-card">
          <h2>Linhas com inconsistências</h2>
          <ImportErrorList errors={errors} />
        </Card>
      ) : null}

      <p className="import-note" role="status">
        Algumas informações podem continuar sendo atualizadas.
      </p>

      <div className="import-details-actions">
        <AppLink className="button button--outline button--md" to="/imports">
          Voltar para importações
        </AppLink>
      </div>
    </div>
  );
}
