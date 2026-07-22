import type { Page } from '../../../services/pagination/pagination';
import type { Insight, InsightListParams } from '../types/insights';

/**
 * Projeção de listagem compartilhada por Mock e API.
 *
 * O `ms-insights` não publica uma listagem paginada de insights: eles chegam
 * exclusivamente dentro do bundle do dashboard. Para que a interface trabalhe
 * sempre com o mesmo contrato interno (`Page<Insight>`), a paginação e o
 * recorte por tipo acontecem aqui e são usados pelos dois Data Sources — assim
 * as regras são idênticas nos dois modos e nenhuma query inexistente é enviada.
 */

export const defaultInsightPageSize = 6;

export function projectInsightPage(
  insights: readonly Insight[],
  params: InsightListParams,
): Page<Insight> {
  const filtered = params.type
    ? insights.filter((insight) => insight.type === params.type)
    : insights;
  const sorted = [...filtered].sort((a, b) => {
    const comparison = (b.createdAt ?? '').localeCompare(
      a.createdAt ?? '',
      'pt-BR',
    );
    return comparison === 0 ? a.id.localeCompare(b.id, 'pt-BR') : comparison;
  });

  const size = Math.max(1, params.size);
  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const page = Math.min(Math.max(0, params.page), totalPages - 1);
  const start = page * size;

  return {
    content: sorted.slice(start, start + size),
    page,
    size,
    totalElements,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  };
}
