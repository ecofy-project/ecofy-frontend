import type { Insight } from '../types/insights';
import { InsightCard } from './InsightCard';

/** Apenas renderiza a coleção recebida: não busca dados nem gera insights. */
export function InsightList({
  insights,
  label = 'Insights',
}: {
  insights: readonly Insight[];
  label?: string;
}) {
  return (
    <section aria-label={label} className="insight-grid">
      {insights.map((insight) => (
        <InsightCard insight={insight} key={insight.id} />
      ))}
    </section>
  );
}
