import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
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
import { mapBudget, mapBudgetOverview, mapBudgets } from './budget-mappers';

const budgetingGatewayPath = '/budgeting/api/budgeting/v1/budgets';

/**
 * Resolve o dono dos recursos a partir da sessão autenticada.
 *
 * `CreateBudgetRequest.userId` e os parâmetros `userId` de listagem e overview
 * são obrigatórios no contrato atual do `ms-budgeting`. O valor nunca é pedido
 * no formulário nem exibido: ele vem do usuário autenticado. A autorização real
 * continua sendo responsabilidade do backend.
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
   * O contrato publica a lista completa do usuário, sem paginação, ordenação ou
   * filtros no servidor. A projeção para `Page<Budget>` usa exatamente a mesma
   * função do Mock, mantendo o comportamento idêntico nos dois modos.
   */
  async list(params: BudgetListParams): Promise<BudgetPage> {
    const response = await this.httpClient.request<unknown>(
      budgetingGatewayPath,
      { query: { userId: this.requireUserId() } },
    );

    return projectBudgetPage(mapBudgets(response.data), params);
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
