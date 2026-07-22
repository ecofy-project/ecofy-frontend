import type { BudgetDataSource } from '../../features/budgets/data-sources/budget-data-source';
import type {
  Budget,
  BudgetListParams,
  BudgetOverview,
  BudgetPage,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../../features/budgets/types/budget';
import { projectBudgetPage } from '../../features/budgets/utils/budget-projection';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockBudgetOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

/**
 * Mock Mode do budgeting.
 *
 * Reutiliza o Mock Storage central (`DemoStore`) e a mesma projeção de listagem
 * usada pelo Data Source de API, de modo que filtros, ordenação e paginação se
 * comportam exatamente igual nos dois modos. Nenhum consumo é calculado aqui:
 * limite, consumo e percentual vêm prontos do seed, como viriam do backend.
 */
export class MockBudgetDataSource implements BudgetDataSource {
  /**
   * Marca os orçamentos que já sofreram o conflito simulado. O conflito é
   * determinístico: acontece na primeira tentativa de atualização e deixa de
   * acontecer depois que o usuário recarrega e reenvia com a versão nova.
   */
  private readonly simulatedConflicts = new Set<string>();

  constructor(
    private readonly store: DemoStore,
    private readonly options: MockBudgetOptions,
  ) {}

  private async prepare() {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;
    await simulateMockLatency(delay);

    if (
      this.options.scenario === 'error' ||
      this.options.scenario === 'budget-error'
    ) {
      throw new ApiErrorException({
        code: 'BUDGETING_UNAVAILABLE',
        message: 'Não foi possível carregar os orçamentos.',
        status: 503,
      });
    }
  }

  /** Recorte visível de acordo com o cenário selecionado. */
  private visibleBudgets(): readonly Budget[] {
    const state = this.store.getState();
    const budgets = state.budgetRecords;
    const percentageOf = (budgetId: string) =>
      state.budgetConsumptions.find(
        (consumption) => consumption.budgetId === budgetId,
      )?.percentage;

    switch (this.options.scenario) {
      case 'empty':
      case 'budgets-empty':
        return [];
      case 'budget-single':
        return budgets.slice(0, 1);
      case 'budget-paused':
        return budgets.filter((budget) => budget.status === 'PAUSED');
      case 'budget-archived':
        return budgets.filter((budget) => budget.status === 'ARCHIVED');
      case 'consumption-partial':
        return budgets.filter((budget) => (percentageOf(budget.id) ?? 0) < 100);
      case 'consumption-full':
        return budgets.filter(
          (budget) => (percentageOf(budget.id) ?? 0) >= 100,
        );
      default:
        return budgets;
    }
  }

  private findBudget(id: string): Budget {
    const budget = this.store
      .getState()
      .budgetRecords.find((item) => item.id === id);

    if (!budget) {
      throw new ApiErrorException({
        code: 'BUDGET_NOT_FOUND',
        message: 'O orçamento informado não foi encontrado.',
        status: 404,
      });
    }

    return budget;
  }

  async list(params: BudgetListParams): Promise<BudgetPage> {
    await this.prepare();

    return projectBudgetPage(this.visibleBudgets(), params);
  }

  async getById(id: string): Promise<Budget> {
    await this.prepare();

    return this.findBudget(id);
  }

  async create(input: CreateBudgetInput): Promise<Budget> {
    await this.prepare();
    const state = this.store.getState();

    if (!state.categories.some((item) => item.id === input.categoryId)) {
      throw new ApiErrorException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'A categoria selecionada não foi encontrada.',
        status: 404,
      });
    }

    const now = new Date().toISOString();
    const created: Budget = {
      id: createId('budget'),
      categoryId: input.categoryId,
      periodType: input.periodType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      limitAmount: input.limitAmount,
      currency: input.currency,
      status: input.status ?? 'ACTIVE',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.store.update((draft) => {
      draft.budgetRecords = [created, ...draft.budgetRecords];
      draft.budgetConsumptions = [
        {
          budgetId: created.id,
          consumedAmount: '0.00',
          limitAmount: created.limitAmount,
          percentage: 0,
        },
        ...draft.budgetConsumptions,
      ];
    });

    return created;
  }

  async update(id: string, input: UpdateBudgetInput): Promise<Budget> {
    await this.prepare();
    const current = this.findBudget(id);

    if (
      this.options.scenario === 'budget-conflict' &&
      !this.simulatedConflicts.has(id)
    ) {
      this.simulatedConflicts.add(id);
      const concurrentVersion = (current.version ?? 1) + 1;

      this.store.update((draft) => {
        draft.budgetRecords = draft.budgetRecords.map((budget) =>
          budget.id === id
            ? {
                ...budget,
                version: concurrentVersion,
                updatedAt: new Date().toISOString(),
              }
            : budget,
        );
      });
    }

    const stored = this.findBudget(id);

    if (
      input.version !== undefined &&
      stored.version !== undefined &&
      input.version !== stored.version
    ) {
      throw new ApiErrorException({
        code: 'BUDGET_CONCURRENT_UPDATE',
        message:
          'Este orçamento foi alterado por outra operação enquanto você editava.',
        status: 409,
      });
    }

    const updated: Budget = {
      ...stored,
      ...(input.newLimitAmount === undefined
        ? {}
        : { limitAmount: input.newLimitAmount }),
      ...(input.currency === undefined ? {} : { currency: input.currency }),
      ...(input.status === undefined ? {} : { status: input.status }),
      version: (stored.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    /**
     * O consumo não é tocado aqui: no serviço real ele é recalculado de forma
     * assíncrona a partir de eventos. A interface apresenta o consumo publicado
     * e sinaliza quando o limite mudou depois dele.
     */
    this.store.update((draft) => {
      draft.budgetRecords = draft.budgetRecords.map((budget) =>
        budget.id === id ? updated : budget,
      );
    });

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.prepare();
    this.findBudget(id);

    this.store.update((draft) => {
      draft.budgetRecords = draft.budgetRecords.filter(
        (budget) => budget.id !== id,
      );
      draft.budgetConsumptions = draft.budgetConsumptions.filter(
        (consumption) => consumption.budgetId !== id,
      );
    });
  }

  async getOverview(): Promise<BudgetOverview> {
    await this.prepare();
    const visibleIds = new Set(this.visibleBudgets().map((budget) => budget.id));

    return {
      consumptions: this.store
        .getState()
        .budgetConsumptions.filter((consumption) =>
          visibleIds.has(consumption.budgetId),
        ),
    };
  }
}
