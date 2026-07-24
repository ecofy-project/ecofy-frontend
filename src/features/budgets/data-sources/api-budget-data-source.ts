import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import { normalizePage } from '../../../services/pagination/pagination';
import type {
  Budget,
  BudgetListParams,
  BudgetOverview,
  BudgetPage,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../types/budget';
import { projectBudgetPage } from '../utils/budget-projection';
import type { BudgetDataSource } from './budget-data-source';
import { mapBudget, mapBudgetOverview } from './budget-mappers';

/**
 * Prefixo versionado do API Gateway. A rota `/api/v1/**` reescreve para o mesmo
 * downstream da rota legada (`/budgeting/api/budgeting/v1/budgets`), mas só ela
 * tem CircuitBreaker, Retry e fallback configurados.
 */
const budgetingGatewayPath = '/api/v1/budgeting/budgets';

/**
 * Teto de página do `ms-budgeting` (`max-size`). A listagem busca uma página
 * cheia porque o servidor não filtra por status nem categoria: os filtros da
 * interface são aplicados sobre a coleção recebida, em `projectBudgetPage`. Um
 * usuário tem poucos orçamentos (um por categoria e período), bem abaixo desse
 * teto.
 */
const budgetServerMaxSize = 100;

/**
 * Resolve o dono dos recursos a partir da sessão autenticada.
 *
 * A listagem é escopada pelo JWT e não recebe `userId`. A criação e o overview
 * ainda exigem `userId` no contrato atual do `ms-budgeting`. O valor nunca é
 * pedido no formulário nem exibido: ele vem do usuário autenticado. A
 * autorização real continua sendo responsabilidade do backend.
 */
export type CurrentUserProvider = Readonly<{
  getUserId: () => string | null;
}>;

export class ApiBudgetDataSource implements BudgetDataSource {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly currentUser: CurrentUserProvider,
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

  /**
   * `GET /budgets` devolve `PageResponse<BudgetResponse>` escopado pelo JWT e
   * aceita `page`, `size` e `sort` (`campo,direção`), mas não filtra por status
   * nem categoria. A resposta é normalizada com o Pagination Adapter e o
   * `.content` passa por `projectBudgetPage`, a mesma função do Mock, que aplica
   * os filtros da interface e a paginação de exibição. Assim os dois modos
   * mantêm o comportamento idêntico e nenhuma query inexistente é enviada.
   */
  async list(params: BudgetListParams): Promise<BudgetPage> {
    const response = await this.httpClient.request<unknown>(
      budgetingGatewayPath,
      {
        query: {
          page: 0,
          size: budgetServerMaxSize,
          sort: `${params.sort.field},${params.sort.direction}`,
        },
      },
    );

    const serverPage = normalizePage(response.data, mapBudget);
    return projectBudgetPage(serverPage.content, params);
  }

  async getById(id: string): Promise<Budget> {
    const response = await this.httpClient.request<unknown>(
      `${budgetingGatewayPath}/${encodeURIComponent(id)}`,
    );

    return mapBudget(response.data);
  }

  async create(input: CreateBudgetInput): Promise<Budget> {
    const response = await this.httpClient.request<unknown>(
      budgetingGatewayPath,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          userId: this.requireUserId(),
          categoryId: input.categoryId,
          periodType: input.periodType,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          limitAmount: input.limitAmount,
          currency: input.currency,
          ...(input.status ? { status: input.status } : {}),
        },
      },
    );

    return mapBudget(response.data);
  }

  /**
   * `UpdateBudgetRequest` publica somente `newLimitAmount`, `currency` e
   * `status`. A `version` do modelo interno não é enviada enquanto o contrato
   * não publicar o campo, evitando qualquer payload inventado.
   */
  async update(id: string, input: UpdateBudgetInput): Promise<Budget> {
    const response = await this.httpClient.request<unknown>(
      `${budgetingGatewayPath}/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          ...(input.newLimitAmount === undefined
            ? {}
            : { newLimitAmount: input.newLimitAmount }),
          ...(input.currency === undefined ? {} : { currency: input.currency }),
          ...(input.status === undefined ? {} : { status: input.status }),
        },
      },
    );

    return mapBudget(response.data);
  }

  async remove(id: string): Promise<void> {
    await this.httpClient.request<unknown>(
      `${budgetingGatewayPath}/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: { 'Idempotency-Key': createCorrelationId() },
      },
    );
  }

  async getOverview(): Promise<BudgetOverview> {
    const response = await this.httpClient.request<unknown>(
      `${budgetingGatewayPath}/overview`,
      { query: { userId: this.requireUserId() } },
    );

    return mapBudgetOverview(response.data);
  }
}
