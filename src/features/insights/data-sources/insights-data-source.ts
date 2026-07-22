import type {
  GenerateInsightsInput,
  InsightListParams,
  InsightPage,
  InsightsBundle,
  RebuildMode,
  RebuildRun,
} from '../types/insights';

/**
 * Contrato único consumido pela feature. Mock e API implementam exatamente esta
 * interface, então nenhuma página conhece o modo de execução.
 *
 * `requestRebuild` e `getRebuildStatus` são opcionais: o `ms-insights` ainda não
 * publica endpoints de reconstrução, então a implementação de API os omite e a
 * interface esconde a ação, em vez de chamar um endpoint inexistente. O mesmo
 * padrão já é usado em `CategorizationDataSource.listCategorizableTransactions`.
 */
export interface InsightsDataSource {
  getDashboard(): Promise<InsightsBundle>;
  listInsights(params: InsightListParams): Promise<InsightPage>;
  generateInsights(input: GenerateInsightsInput): Promise<InsightsBundle>;
  requestRebuild?(mode: RebuildMode): Promise<RebuildRun>;
  getRebuildStatus?(runId: string): Promise<RebuildRun>;
}
