import type { InsightsDataSource } from '../../features/insights/data-sources/insights-data-source';
import type {
  GenerateInsightsInput,
  Insight,
  InsightListParams,
  InsightPage,
  InsightsBundle,
  RebuildMode,
  RebuildRun,
} from '../../features/insights/types/insights';
import { projectInsightPage } from '../../features/insights/utils/insight-projection';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockInsightsOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

/** Consultas necessárias até o rebuild simulado concluir, sem aleatoriedade. */
const rebuildPollsToFinish = 2;

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

/**
 * Resultados prontos usados pela geração simulada. São dados de seed, escolhidos
 * de forma determinística — nenhum algoritmo analítico é executado.
 */
const generatedInsightTemplates: readonly Readonly<{
  type: Insight['type'];
  score: number;
  title: string;
  summary: string;
}>[] = [
  {
    type: 'SPENDING_BREAKDOWN',
    score: 72,
    title: 'Alimentação concentra a maior parte das saídas',
    summary:
      'A categoria Alimentação responde pela maior fatia das saídas do período analisado.',
  },
  {
    type: 'CASHFLOW',
    score: 64,
    title: 'Entradas superaram as saídas no período',
    summary:
      'O fluxo do período fechou positivo, mantendo margem para as metas em andamento.',
  },
  {
    type: 'ANOMALY',
    score: 58,
    title: 'Movimentação fora do padrão em Lazer',
    summary:
      'Uma saída acima do habitual foi registrada em Lazer dentro do período analisado.',
  },
];

/**
 * Mock Mode da analítica.
 *
 * Reutiliza o Mock Storage central e a mesma projeção de listagem do Data
 * Source de API. Nenhuma métrica é calculada: limites, valores e percentuais
 * vêm prontos do seed, como viriam do backend.
 */
export class MockInsightsDataSource implements InsightsDataSource {
  private readonly rebuildPolls = new Map<string, number>();

  constructor(
    private readonly store: DemoStore,
    private readonly options: MockInsightsOptions,
  ) {}

  private async prepare() {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;
    await simulateMockLatency(delay);

    if (
      this.options.scenario === 'degraded' ||
      this.options.scenario === 'dashboard-degraded'
    ) {
      /* Mesmo formato do RestExceptionHandler: 503 com details.reason. */
      throw new ApiErrorException({
        code: 'Service Unavailable',
        message: 'External dependency unavailable: transactions',
        status: 503,
        details: { reason: 'EXTERNAL_DATA_UNAVAILABLE', source: 'transactions' },
      });
    }

    if (
      this.options.scenario === 'error' ||
      this.options.scenario === 'dashboard-error'
    ) {
      throw new ApiErrorException({
        code: 'INSIGHTS_UNAVAILABLE',
        message: 'Não foi possível carregar as análises.',
        status: 503,
      });
    }
  }

  private isEmptyScenario() {
    return (
      this.options.scenario === 'empty' ||
      this.options.scenario === 'dashboard-empty'
    );
  }

  private visibleInsights(): readonly Insight[] {
    if (this.isEmptyScenario() || this.options.scenario === 'insights-empty') {
      return [];
    }

    return this.store.getState().insightRecords;
  }

  async getDashboard(): Promise<InsightsBundle> {
    await this.prepare();
    const state = this.store.getState();

    if (this.isEmptyScenario()) {
      return { insights: [], metrics: [], goals: [] };
    }

    return {
      insights: this.visibleInsights(),
      metrics: state.metricSnapshots,
      goals:
        this.options.scenario === 'goals-empty' ? [] : state.goalRecords,
    };
  }

  async listInsights(params: InsightListParams): Promise<InsightPage> {
    await this.prepare();

    return projectInsightPage(this.visibleInsights(), params);
  }

  async generateInsights(
    input: GenerateInsightsInput,
  ): Promise<InsightsBundle> {
    await this.prepare();

    if (this.options.scenario === 'insight-generation-error') {
      throw new ApiErrorException({
        code: 'BUSINESS_VALIDATION',
        message: 'Não foi possível gerar análises para o período informado.',
        status: 400,
        details: { reason: 'BUSINESS_VALIDATION' },
      });
    }

    const state = this.store.getState();
    /* Escolha determinística: o próximo template da sequência. */
    const template =
      generatedInsightTemplates[
        state.insightRecords.length % generatedInsightTemplates.length
      ]!;
    const created: Insight = {
      id: createId('insight'),
      type: template.type,
      score: template.score,
      title: template.title,
      summary: template.summary,
      period: {
        start: input.start,
        end: input.end,
        granularity: input.granularity,
      },
      createdAt: new Date().toISOString(),
    };

    this.store.update((draft) => {
      draft.insightRecords = [created, ...draft.insightRecords];
    });

    return this.getDashboardWithoutLatency();
  }

  private getDashboardWithoutLatency(): InsightsBundle {
    const state = this.store.getState();

    return {
      insights: state.insightRecords,
      metrics: state.metricSnapshots,
      goals: state.goalRecords,
    };
  }

  async requestRebuild(mode: RebuildMode): Promise<RebuildRun> {
    await this.prepare();
    void mode;
    const runId = createId('rebuild');
    this.rebuildPolls.set(runId, 0);

    return {
      runId,
      status:
        this.options.scenario === 'rebuild-completed'
          ? 'COMPLETED'
          : 'PROCESSING',
    };
  }

  async getRebuildStatus(runId: string): Promise<RebuildRun> {
    await this.prepare();
    const attempt = (this.rebuildPolls.get(runId) ?? 0) + 1;
    this.rebuildPolls.set(runId, attempt);

    return {
      runId,
      status:
        this.options.scenario === 'rebuild-processing' &&
        attempt < rebuildPollsToFinish
          ? 'PROCESSING'
          : 'COMPLETED',
    };
  }
}
