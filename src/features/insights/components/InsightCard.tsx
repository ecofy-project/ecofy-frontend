import { Card, Icon } from '../../../components/ui';
import type { Insight } from '../types/insights';
import {
  formatInstant,
  formatLocalDate,
  granularityLabel,
  insightTypeLabel,
} from '../utils/insight-format';

/**
 * Apresenta somente os campos publicados por `InsightResponse`: tipo, título,
 * resumo, período e data de geração. Nenhuma severidade, prioridade ou
 * recomendação é inferida, e o `payload` bruto nunca é exibido.
 */
export function InsightCard({ insight }: { insight: Insight }) {
  const { end, granularity, start } = insight.period;
  const hasPeriod = Boolean(start && end);

  return (
    <Card as="article" className="insight-card">
      <span aria-hidden="true" className="insight-card__icon">
        <Icon name="insights" size={19} />
      </span>
      <div className="insight-card__body">
        <span className="insight-card__type">
          {insightTypeLabel(insight.type)}
          {granularity ? ` · ${granularityLabel(granularity)}` : ''}
        </span>
        <h3>{insight.title}</h3>
        {insight.summary ? <p>{insight.summary}</p> : null}
        <div className="insight-card__meta">
          {hasPeriod ? (
            <span>
              Período de {formatLocalDate(start)} a {formatLocalDate(end)}
            </span>
          ) : null}
          {insight.createdAt ? (
            <time dateTime={insight.createdAt}>
              Gerado em {formatInstant(insight.createdAt)}
            </time>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
