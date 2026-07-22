import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import type {
  GenerateInsightsInput,
  InsightListParams,
  InsightPage,
  InsightsBundle,
} from '../types/insights';
import { projectInsightPage } from '../utils/insight-projection';
import type { InsightsDataSource } from './insights-data-source';
import { mapInsightsBundle } from './insights-mappers';

const insightsGatewayPath = '/insights/api/insights/v1';

/**
 * Origem de dados analítica em API Mode.
 *
 * `requestRebuild` e `getRebuildStatus` não são implementados de propósito: o
 * `ms-insights` não publica endpoints de reconstrução, e chamar um caminho
 * inexistente seria inventar contrato. A ausência dos métodos faz a interface
 * esconder a ação avançada neste modo.
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
}
