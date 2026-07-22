import type { InsightsDataSource } from '../data-sources/insights-data-source';
import type {
  GenerateInsightsInput,
  InsightListParams,
  RebuildMode,
} from '../types/insights';

export class InsightsService {
  constructor(private readonly dataSource: InsightsDataSource) {}

  /** Indica se a origem de dados atual publica reconstrução de análises. */
  get supportsRebuild() {
    return (
      typeof this.dataSource.requestRebuild === 'function' &&
      typeof this.dataSource.getRebuildStatus === 'function'
    );
  }

  getDashboard() {
    return this.dataSource.getDashboard();
  }

  listInsights(params: InsightListParams) {
    return this.dataSource.listInsights(params);
  }

  generateInsights(input: GenerateInsightsInput) {
    return this.dataSource.generateInsights(input);
  }

  requestRebuild(mode: RebuildMode) {
    return this.dataSource.requestRebuild?.(mode) ?? null;
  }

  getRebuildStatus(runId: string) {
    return this.dataSource.getRebuildStatus?.(runId) ?? null;
  }
}
