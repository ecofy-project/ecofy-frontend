import { AppLink } from '../../../app/routing/router';
import { StatusBadge } from '../../../components/ui';
import type { ImportJob } from '../types/import';
import {
  formatImportDateTime,
  importStatusLabel,
  importStatusTone,
} from '../utils/import-labels';

/**
 * Tabela semântica do histórico, usada a partir do tablet. Apresenta apenas
 * colunas com dado disponível no contrato — o identificador técnico do job não
 * é exibido como coluna.
 */
export function ImportHistoryTable({ jobs }: { jobs: readonly ImportJob[] }) {
  return (
    <table className="import-table import-table--history">
      <caption className="sr-only">Histórico de importações</caption>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Status</th>
          <th scope="col">Total</th>
          <th scope="col">Processados</th>
          <th scope="col">Sucessos</th>
          <th scope="col">Erros</th>
          <th scope="col">Ações</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <td>
              <time dateTime={job.createdAt}>
                {formatImportDateTime(job.createdAt)}
              </time>
            </td>
            <td>
              <StatusBadge tone={importStatusTone(job.status)}>
                {importStatusLabel(job.status)}
              </StatusBadge>
            </td>
            <td className="numeric">{job.totalRecords}</td>
            <td className="numeric">{job.processedRecords}</td>
            <td className="numeric">{job.successCount}</td>
            <td className="numeric">{job.errorCount}</td>
            <td>
              <AppLink
                className="import-table__link"
                to={`/imports/${job.id}`}
              >
                Ver detalhes
              </AppLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
