import { Alert, Button, Card, StatusBadge } from '../../../components/ui';
import { AppLink } from '../../../app/routing/router';
import type { ImportError, ImportJob } from '../types/import';
import {
  importStatusDescription,
  importStatusLabel,
  importStatusTone,
} from '../utils/import-labels';
import { ImportCounters } from './ImportCounters';
import { ImportErrorList } from './ImportErrorList';

type ImportResultProps = {
  job: ImportJob;
  errors: readonly ImportError[];
  onStartNew: () => void;
};

/**
 * Resultado terminal do envio. `COMPLETED_WITH_ERRORS` é apresentado como
 * sucesso parcial, nunca como falha global.
 */
export function ImportResult({ errors, job, onStartNew }: ImportResultProps) {
  const isFailure = job.status === 'FAILED';
  const isPartial = job.status === 'COMPLETED_WITH_ERRORS';

  return (
    <Card as="section" className="import-result-card">
      <div className="import-result-card__heading">
        <div>
          <span className="import-eyebrow">RESULTADO</span>
          <h2>{importStatusDescription(job.status)}</h2>
        </div>
        <StatusBadge tone={importStatusTone(job.status)}>
          {importStatusLabel(job.status)}
        </StatusBadge>
      </div>

      {isFailure ? (
        <Alert title="A importação não foi concluída" tone="danger">
          Nenhum registro foi publicado. Revise o arquivo e envie novamente.
        </Alert>
      ) : null}

      {isPartial ? (
        <Alert title="Parte dos registros não pôde ser processada" tone="warning">
          Os registros válidos foram importados. Consulte a lista abaixo para
          rever as linhas com inconsistências.
        </Alert>
      ) : null}

      <ImportCounters job={job} />

      {errors.length > 0 ? (
        <div className="import-result-card__errors">
          <h3>Linhas com inconsistências</h3>
          <ImportErrorList errors={errors} />
        </div>
      ) : null}

      <p className="import-result-card__note" role="status">
        Algumas informações podem continuar sendo atualizadas.
      </p>

      <div className="import-result-card__actions">
        <Button onClick={onStartNew} variant="outline">
          Importar outro arquivo
        </Button>
        <AppLink className="button button--ghost button--md" to={`/imports/${job.id}`}>
          Ver detalhes
        </AppLink>
      </div>
    </Card>
  );
}
