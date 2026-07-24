import {
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import type {
  GenerateInsightsInput,
  InsightListParams,
  InsightPage,
  InsightsBundle,
  RebuildMode,
  RebuildRun,
} from '../types/insights';
import { projectInsightPage } from '../utils/insight-projection';
import type { InsightsDataSource } from './insights-data-source';
import { mapInsightsBundle } from './insights-mappers';

/**
 * Prefixo versionado do API Gateway. A rota `/api/v1/**` reescreve para o mesmo
 * downstream da rota legada (`/insights/api/insights/v1`), com CircuitBreaker,
 * Retry e fallback que a rota legada não tem.
 */
const insightsGatewayPath = '/api/v1/insights';

/**
 * Estados terminais de `RebuildStatus` no domínio do `ms-insights`
 * (`COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`, `CANCELLED`). O modelo interno
 * é binário: qualquer estado terminal encerra o acompanhamento. `PENDING` e
 * `RUNNING` mantêm o polling.
 */
const processingStatuses = new Set(['PENDING', 'RUNNING']);

/** Período padrão do rebuild: o mês corrente, em `LocalDate` (UTC). */
function currentMonthRange() {
  const now = new Date();
  const iso = (date: Date) => date.toISOString().slice(0, 10);

  return {
    periodStart: iso(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    ),
    periodEnd: iso(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)),
    ),
  };
}

function incompatibleRebuildResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_INSIGHTS_RESPONSE',
    message: 'A resposta de reconstrução recebida é incompatível.',
    status: 502,
  } satisfies ApiError);
}

/**
 * Projeta `RebuildRunResult` no `RebuildRun` interno: apenas o identificador da
 * execução (`id`) e o estado reduzido a `PROCESSING`/`COMPLETED`.
 */
function mapRebuildRun(payload: unknown): RebuildRun {
  if (typeof payload !== 'object' || payload === null) {
    incompatibleRebuildResponse();
  }

  const record = payload as Record<string, unknown>;
  const runId =
    typeof record.id === 'string' && record.id.trim() ? record.id.trim() : '';
  const status = typeof record.status === 'string' ? record.status : '';

  if (!runId || !status) {
    incompatibleRebuildResponse();
  }

  return {
    runId,
    status: processingStatuses.has(status) ? 'PROCESSING' : 'COMPLETED',
  };
}

/**
 * Origem de dados analítica em API Mode.
 *
 * A reconstrução usa `POST /rebuild` e `GET /rebuild/{runId}`. O contrato exige
 * um período; como a ação da interface é apenas "reconstruir análises ausentes",
 * sem seleção de período, o mês corrente é usado como escopo padrão, no modo
 * `MISSING`.
 */
export class ApiInsightsDataSource implements InsightsDataSource {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly currentUser: Readonly<{ getUserId: () => string | null }>,
  ) {}

  private requireUserId(): string {
    const userId = this.currentUser.getUserId();

    if (!userId) {
      throw new ApiErrorException({
        code: 'SESSION_REQUIRED',
        message: 'Sua sessão precisa ser renovada.',
        status: 401,
      });
    }

    return userId;
  }

  async getDashboard(): Promise<InsightsBundle> {
    const response = await this.httpClient.request<unknown>(
      `${insightsGatewayPath}/dashboard/${encodeURIComponent(this.requireUserId())}`,
    );

    return mapInsightsBundle(response.data);
  }

  /**
   * O serviço não publica listagem paginada de insights: eles chegam apenas no
   * bundle do dashboard. A paginação e o recorte por tipo usam a mesma projeção
   * do Mock, mantendo o comportamento idêntico nos dois modos e sem enviar
   * query inexistente.
   */
  async listInsights(params: InsightListParams): Promise<InsightPage> {
    const bundle = await this.getDashboard();

    return projectInsightPage(bundle.insights, params);
  }

  async generateInsights(
    input: GenerateInsightsInput,
  ): Promise<InsightsBundle> {
    const response = await this.httpClient.request<unknown>(
      `${insightsGatewayPath}/generate`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          userId: this.requireUserId(),
          start: input.start,
          end: input.end,
          granularity: input.granularity,
        },
      },
    );

    return mapInsightsBundle(response.data);
  }

  async requestRebuild(mode: RebuildMode): Promise<RebuildRun> {
    const { periodEnd, periodStart } = currentMonthRange();
    const response = await this.httpClient.request<unknown>(
      `${insightsGatewayPath}/rebuild`,
      {
        method: 'POST',
        body: {
          userId: this.requireUserId(),
          periodStart,
          periodEnd,
          granularity: 'MONTH',
          mode,
        },
      },
    );

    return mapRebuildRun(response.data);
  }

  async getRebuildStatus(runId: string): Promise<RebuildRun> {
    const response = await this.httpClient.request<unknown>(
      `${insightsGatewayPath}/rebuild/${encodeURIComponent(runId)}`,
    );

    return mapRebuildRun(response.data);
  }
}
