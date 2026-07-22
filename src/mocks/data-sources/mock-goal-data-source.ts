import type { GoalDataSource } from '../../features/goals/data-sources/goal-data-source';
import type {
  CreateGoalInput,
  Goal,
  UpdateGoalInput,
} from '../../features/goals/types/goal';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockGoalOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

/**
 * Mock Mode de metas, sobre o Mock Storage central. Nenhum progresso é
 * calculado: o contrato publica apenas o valor alvo.
 */
export class MockGoalDataSource implements GoalDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockGoalOptions,
  ) {}

  private async prepare() {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;
    await simulateMockLatency(delay);

    if (
      this.options.scenario === 'error' ||
      this.options.scenario === 'goal-error'
    ) {
      throw new ApiErrorException({
        code: 'GOALS_UNAVAILABLE',
        message: 'Não foi possível carregar as metas.',
        status: 503,
      });
    }
  }

  async listGoals(): Promise<readonly Goal[]> {
    await this.prepare();

    return this.options.scenario === 'empty' ||
      this.options.scenario === 'goals-empty'
      ? []
      : this.store.getState().goalRecords;
  }

  async createGoal(input: CreateGoalInput): Promise<Goal> {
    await this.prepare();
    const now = new Date().toISOString();
    const created: Goal = {
      id: createId('goal'),
      name: input.name,
      targetCents: input.targetCents,
      currency: input.currency,
      status: input.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.store.update((draft) => {
      draft.goalRecords = [created, ...draft.goalRecords];
    });

    return created;
  }

  async updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
    await this.prepare();
    const current = this.store
      .getState()
      .goalRecords.find((goal) => goal.id === id);

    if (!current) {
      throw new ApiErrorException({
        code: 'GOAL_NOT_FOUND',
        message: 'A meta informada não foi encontrada.',
        status: 404,
        details: { reason: 'GOAL_NOT_FOUND' },
      });
    }

    const updated: Goal = {
      ...current,
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.targetCents === undefined
        ? {}
        : { targetCents: input.targetCents }),
      ...(input.currency === undefined ? {} : { currency: input.currency }),
      ...(input.status === undefined ? {} : { status: input.status }),
      updatedAt: new Date().toISOString(),
    };

    this.store.update((draft) => {
      draft.goalRecords = draft.goalRecords.map((goal) =>
        goal.id === id ? updated : goal,
      );
    });

    return updated;
  }
}
