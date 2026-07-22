import type {
  DashboardDataSource,
  GoalDataSource,
  InsightsDataSource,
  NotificationDataSource,
} from '../../features/demo/data-sources/demo-data-sources';
import type {
  GoalOverview,
  SaveGoalInput,
} from '../../features/demo/types/demo';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockDemoOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

async function prepare(options: MockDemoOptions) {
  const delay =
    options.scenario === 'loading'
      ? Math.max(options.delayMs, 1_200)
      : options.delayMs;
  await simulateMockLatency(delay);

  if (options.scenario === 'error') {
    throw new ApiErrorException({
      code: 'DEMO_DATA_UNAVAILABLE',
      message: 'Não foi possível carregar os dados demonstrativos.',
      status: 503,
    });
  }
}

function goalOverview(store: DemoStore): GoalOverview {
  const state = store.getState();
  return {
    goals: state.goals,
    currency: state.preferences.DEFAULT_CURRENCY ?? 'BRL',
  };
}

export class MockDashboardDataSource implements DashboardDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockDemoOptions,
  ) {}

  async getDashboard() {
    await prepare(this.options);
    const state = this.store.getState();

    if (this.options.scenario === 'empty') {
      return {
        periodLabel: 'Este mês',
        metrics: [],
        budgets: [],
        insights: [],
        goals: [],
        activity: [],
      } as const;
    }

    return {
      periodLabel: 'Este mês',
      metrics: state.metrics,
      budgets: state.budgets,
      insights: state.insights,
      goals: state.goals,
      activity: state.activity,
    };
  }
}

export class MockGoalDataSource implements GoalDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockDemoOptions,
  ) {}

  async getGoalOverview() {
    await prepare(this.options);
    const overview = goalOverview(this.store);
    return this.options.scenario === 'empty'
      ? { ...overview, goals: [] }
      : overview;
  }

  async saveGoal(input: SaveGoalInput) {
    await prepare(this.options);
    this.store.update((state) => {
      const current = input.id
        ? state.goals.find((goal) => goal.id === input.id)
        : undefined;
      const nextGoal = {
        id: current?.id ?? createId('goal'),
        name: input.name,
        saved: current?.saved ?? {
          cents: 0,
          currency: input.target.currency,
        },
        target: input.target,
        targetDate: input.targetDate,
      };

      state.goals = current
        ? state.goals.map((goal) =>
            goal.id === current.id ? nextGoal : goal,
          )
        : [nextGoal, ...state.goals];
    });
    return goalOverview(this.store);
  }
}

export class MockInsightsDataSource implements InsightsDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockDemoOptions,
  ) {}

  async listInsights() {
    await prepare(this.options);

    if (this.options.scenario === 'degraded') {
      throw new ApiErrorException({
        code: 'INSIGHTS_DEGRADED',
        message: 'Os insights estão temporariamente indisponíveis.',
        status: 503,
      });
    }

    return this.options.scenario === 'empty'
      ? []
      : this.store.getState().insights;
  }

  async generateInsight() {
    await prepare(this.options);
    this.store.update((state) => {
      state.insights.unshift({
        id: createId('insight'),
        title: 'Assinaturas sob controle',
        message:
          'As assinaturas representam uma parcela estável do período demonstrativo.',
        periodLabel: 'AGORA',
        createdAt: new Date().toISOString(),
      });
    });
    return this.store.getState().insights;
  }
}

export class MockNotificationDataSource
  implements NotificationDataSource
{
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockDemoOptions,
  ) {}

  async listNotifications() {
    await prepare(this.options);
    return this.options.scenario === 'empty'
      ? []
      : this.store.getState().notifications;
  }

  async markAllNotificationsRead() {
    await prepare(this.options);
    this.store.update((state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        read: true,
      }));
    });
    return this.store.getState().notifications;
  }
}
