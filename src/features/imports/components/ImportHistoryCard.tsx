import { AppLink } from '../../../app/routing/router';
import { Card, StatusBadge } from '../../../components/ui';
import type { ImportJob } from '../types/import';
import {
  formatImportDateTime,
  importStatusLabel,
  importStatusTone,
} from '../utils/import-labels';

/** Apresentação resumida do histórico, usada no mobile. */
export function ImportHistoryCard({ job }: { job: ImportJob }) {
  return (
    <Card as="article" className="import-history-card">
      <div className="import-history-card__heading">
        <time dateTime={job.createdAt}>
          {formatImportDateTime(job.createdAt)}
        </time>
        <StatusBadge tone={importStatusTone(job.status)}>
          {importStatusLabel(job.status)}
        </StatusBadge>
      </div>
      <dl className="import-history-card__counters">
        <div>
          <dt>Processados</dt>
          <dd className="numeric">{job.processedRecords}</dd>
        </div>
        <div>
          <dt>Sucessos</dt>
          <dd className="numeric">{job.successCount}</dd>
        </div>
        <div>
          <dt>Erros</dt>
          <dd className="numeric">{job.errorCount}</dd>
        </div>
      </dl>
      <AppLink className="import-history-card__link" to={`/imports/${job.id}`}>
        Ver detalhes
      </AppLink>
    </Card>
  );
}
