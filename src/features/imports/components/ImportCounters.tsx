import type { ImportJob } from '../types/import';

/**
 * Contadores exatamente como o serviço os publica. Nenhum valor é somado,
 * derivado ou completado pelo frontend.
 */
export function ImportCounters({ job }: { job: ImportJob }) {
  const counters = [
    { label: 'Total', value: job.totalRecords },
    { label: 'Processados', value: job.processedRecords },
    { label: 'Sucessos', value: job.successCount },
    { label: 'Erros', value: job.errorCount },
  ];

  return (
    <dl className="import-counters">
      {counters.map((counter) => (
        <div key={counter.label}>
          <dt>{counter.label}</dt>
          <dd className="numeric">{counter.value}</dd>
        </div>
      ))}
    </dl>
  );
}
