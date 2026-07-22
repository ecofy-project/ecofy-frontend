import { Button, Card, ProgressBar } from '../../../components/ui';
import type { ImportJob } from '../types/import';
import { importStatusDescription } from '../utils/import-labels';

type ImportProgressProps = {
  /** `null` quando a origem de dados não consegue medir o envio dos bytes. */
  uploadPercent: number | null;
  isUploading: boolean;
  job: ImportJob | null;
  onCancel: () => void;
};

/**
 * Separa visualmente o envio dos bytes do processamento no servidor. Concluir o
 * upload nunca é apresentado como importação concluída.
 */
export function ImportProgress({
  isUploading,
  job,
  onCancel,
  uploadPercent,
}: ImportProgressProps) {
  if (isUploading) {
    const isDeterminate = uploadPercent !== null;

    return (
      <Card as="section" className="import-progress-card">
        <div className="import-progress-card__heading">
          <div>
            <span className="import-eyebrow">ETAPA 1 DE 2</span>
            <p className="import-progress-card__title">Enviando arquivo…</p>
          </div>
          {isDeterminate ? (
            <span className="numeric">{uploadPercent}%</span>
          ) : null}
        </div>

        {isDeterminate ? (
          <ProgressBar
            label="Progresso do envio do arquivo"
            tone="processing"
            value={uploadPercent}
          />
        ) : (
          <div
            aria-label="Enviando arquivo"
            aria-valuetext="Envio em andamento"
            className="import-indeterminate-bar"
            role="progressbar"
          >
            <span />
          </div>
        )}

        <p className="import-progress-card__hint" role="status">
          {isDeterminate
            ? 'O envio representa apenas a transferência dos bytes.'
            : 'O envio está em andamento. O progresso exato não é informado por esta conexão.'}
        </p>
        <Button onClick={onCancel} size="sm" variant="ghost">
          Cancelar envio
        </Button>
      </Card>
    );
  }

  if (!job || job.status === 'COMPLETED' || job.status === 'COMPLETED_WITH_ERRORS' || job.status === 'FAILED') {
    return null;
  }

  /* Progresso de processamento só é determinado quando há total conhecido. */
  const hasKnownTotal = job.totalRecords > 0;
  const processedPercent = hasKnownTotal
    ? Math.min(100, Math.round((job.processedRecords / job.totalRecords) * 100))
    : null;

  return (
    <Card as="section" className="import-progress-card">
      <div className="import-progress-card__heading">
        <div>
          <span className="import-eyebrow">ETAPA 2 DE 2</span>
          <p className="import-progress-card__title">
            Arquivo enviado. {importStatusDescription(job.status)}
          </p>
        </div>
        {processedPercent === null ? null : (
          <span className="numeric">{processedPercent}%</span>
        )}
      </div>

      {processedPercent === null ? (
        <div
          aria-label="Processamento do arquivo"
          aria-valuetext="Processamento em andamento"
          className="import-indeterminate-bar"
          role="progressbar"
        >
          <span />
        </div>
      ) : (
        <ProgressBar
          label="Progresso do processamento"
          tone="processing"
          value={processedPercent}
          valueText={`${job.processedRecords} de ${job.totalRecords} registros processados`}
        />
      )}

      <p className="import-progress-card__hint" role="status">
        {processedPercent === null
          ? 'O total de registros ainda não foi informado pelo serviço.'
          : `${job.processedRecords} de ${job.totalRecords} registros processados.`}
      </p>
    </Card>
  );
}
