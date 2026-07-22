import { MetricCard } from '../../../components/finance';
import { Icon, type IconName } from '../../../components/ui';
import {
  metricTypes,
  type MetricSnapshot,
  type MetricType,
} from '../../insights/types/insights';
import {
  formatMetricValue,
  metricHelperText,
  metricLabel,
} from '../../insights/utils/insight-format';

const metricIcons: Record<MetricType, IconName> = {
  TOTAL_SPENT: 'wallet',
  INCOME: 'dashboard',
  SAVINGS_RATE: 'insights',
};

const metricAccents = {
  TOTAL_SPENT: 'primary',
  INCOME: 'success',
  SAVINGS_RATE: 'info',
} as const;

/**
 * Apresenta exatamente as três métricas do enum `MetricType`, sempre na mesma
 * ordem. Quando o serviço não devolve alguma delas, o cartão informa a ausência
 * — o valor nunca é calculado pelo frontend.
 */
export function DashboardMetrics({
  metrics,
}: {
  metrics: readonly MetricSnapshot[];
}) {
  const byType = new Map<MetricType, MetricSnapshot>();
  metrics.forEach((metric) => {
    if (!byType.has(metric.metricType)) {
      byType.set(metric.metricType, metric);
    }
  });

  return (
    <section aria-label="Métricas do período" className="dashboard-metrics">
      {metricTypes.map((metricType) => {
        const snapshot = byType.get(metricType);

        return (
          <MetricCard
            accent={metricAccents[metricType]}
            helperText={
              snapshot
                ? metricHelperText(metricType)
                : 'Ainda não informado pelo serviço'
            }
            icon={<Icon name={metricIcons[metricType]} size={18} />}
            key={metricType}
            label={metricLabel(metricType)}
            value={
              snapshot
                ? formatMetricValue(
                    metricType,
                    snapshot.valueCents,
                    snapshot.currency,
                  )
                : '—'
            }
          />
        );
      })}
    </section>
  );
}
