import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import type { CreateGoalInput, Goal, UpdateGoalInput } from '../types/goal';
import type { GoalDataSource } from './goal-data-source';
import { mapGoal, mapGoals } from './goal-mappers';

const goalsGatewayPath = '/insights/api/insights/v1/goals';

/**
 * Resolve o dono das metas a partir da sessão autenticada.
 *
 * `CreateGoalRequest.userId` e o parâmetro `userId` da listagem são
 * obrigatórios no contrato atual. O valor vem do usuário autenticado, nunca do
 * formulário, e não é exibido em nenhum lugar da interface. A autorização real
 * permanece no backend.
 */
export type CurrentUserProvider = Readonly<{
  getUserId: () => string | null;
}>;

export class ApiGoalDataSource implements GoalDataSource {
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

  async listGoals(): Promise<readonly Goal[]> {
    const response = await this.httpClient.request<unknown>(goalsGatewayPath, {
      query: { userId: this.requireUserId() },
    });

    return mapGoals(response.data);
  }

  async createGoal(input: CreateGoalInput): Promise<Goal> {
    const response = await this.httpClient.request<unknown>(goalsGatewayPath, {
      method: 'POST',
      body: {
        userId: this.requireUserId(),
        name: input.name,
        targetCents: input.targetCents,
        currency: input.currency,
        ...(input.status ? { status: input.status } : {}),
      },
    });

    return mapGoal(response.data);
  }

  async updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
    const response = await this.httpClient.request<unknown>(
      `${goalsGatewayPath}/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: {
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.targetCents === undefined
            ? {}
            : { targetCents: input.targetCents }),
          ...(input.currency === undefined ? {} : { currency: input.currency }),
          ...(input.status === undefined ? {} : { status: input.status }),
        },
      },
    );

    return mapGoal(response.data);
  }
}
