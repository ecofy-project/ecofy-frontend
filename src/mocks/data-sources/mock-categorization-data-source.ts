import type { CategorizationDataSource } from '../../features/categories/data-sources/categorization-data-source';
import type {
  CategorizableTransaction,
  CategorizationRule,
  CategorizationSuggestion,
  Category,
  CreateCategoryInput,
  CreateRuleInput,
  ManualCategorizationInput,
  ManualCategorizationResult,
} from '../../features/categories/types/categorization';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockCategorizationOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

/** Score fixo aplicado pelo ms-categorization em decisões manuais. */
const manualScore = 100;
const manualDecision = 'MANUAL';

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

export class MockCategorizationDataSource implements CategorizationDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockCategorizationOptions,
  ) {}

  private async prepare() {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;
    await simulateMockLatency(delay);

    if (this.options.scenario === 'error') {
      throw new ApiErrorException({
        code: 'CATEGORIZATION_UNAVAILABLE',
        message: 'Não foi possível carregar os dados de categorização.',
        status: 503,
      });
    }
  }

  async listCategories(): Promise<readonly Category[]> {
    await this.prepare();

    if (
      this.options.scenario === 'empty' ||
      this.options.scenario === 'categories-empty'
    ) {
      return [];
    }

    return this.store.getState().categories;
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    await this.prepare();

    if (this.options.scenario === 'category-create-error') {
      throw new ApiErrorException({
        code: 'VALIDATION_ERROR',
        message: 'Revise os dados enviados e tente novamente.',
        status: 400,
        fieldErrors: [
          { field: 'name', message: 'Já existe uma categoria com este nome.' },
        ],
      });
    }

    const created: Category = {
      id: createId('category'),
      name: input.name,
      ...(input.color ? { color: input.color } : {}),
      active: true,
    };

    this.store.update((state) => {
      state.categories.push(created);
    });

    return created;
  }

  async listRules(): Promise<readonly CategorizationRule[]> {
    await this.prepare();

    return this.options.scenario === 'empty'
      ? []
      : this.store.getState().rules;
  }

  async createRule(input: CreateRuleInput): Promise<CategorizationRule> {
    await this.prepare();
    const state = this.store.getState();

    if (!state.categories.some((category) => category.id === input.categoryId)) {
      throw new ApiErrorException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'A categoria selecionada não foi encontrada.',
        status: 404,
      });
    }

    const now = new Date().toISOString();
    const created: CategorizationRule = {
      id: createId('rule'),
      categoryId: input.categoryId,
      name: input.name,
      status: input.status,
      priority: input.priority,
      conditions: input.conditions.map((condition) => ({ ...condition })),
      createdAt: now,
      updatedAt: now,
    };

    this.store.update((draft) => {
      draft.rules.push(created);
    });

    return created;
  }

  async categorizeManually(
    input: ManualCategorizationInput,
  ): Promise<ManualCategorizationResult> {
    await this.prepare();

    if (this.options.scenario === 'manual-error') {
      throw new ApiErrorException({
        code: 'TRANSACTION_NOT_FOUND',
        message: 'A transação informada não foi encontrada.',
        status: 404,
      });
    }

    const state = this.store.getState();
    const transaction = state.transactions.find(
      (item) => item.id === input.transactionId,
    );

    if (!transaction) {
      throw new ApiErrorException({
        code: 'TRANSACTION_NOT_FOUND',
        message: 'A transação informada não foi encontrada.',
        status: 404,
      });
    }

    if (!state.categories.some((category) => category.id === input.categoryId)) {
      throw new ApiErrorException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'A categoria selecionada não foi encontrada.',
        status: 404,
      });
    }

    const suggestionId = createId('suggestion');

    this.store.update((draft) => {
      draft.transactions = draft.transactions.map((item) =>
        item.id === input.transactionId
          ? { ...item, categoryId: input.categoryId }
          : item,
      );
      draft.suggestions = [
        {
          id: suggestionId,
          transactionId: input.transactionId,
          categoryId: input.categoryId,
          status: 'APPLIED_MANUAL',
          score: manualScore,
          ...(input.rationale ? { rationale: input.rationale } : {}),
        },
        ...draft.suggestions.filter(
          (item) => item.transactionId !== input.transactionId,
        ),
      ];
    });

    return {
      transactionId: input.transactionId,
      categorized: true,
      categoryId: input.categoryId,
      suggestionId,
      decision: manualDecision,
      score: manualScore,
    };
  }

  async getSuggestionByTransaction(
    transactionId: string,
  ): Promise<CategorizationSuggestion | null> {
    await this.prepare();

    return (
      this.store
        .getState()
        .suggestions.find((item) => item.transactionId === transactionId) ?? null
    );
  }

  async listCategorizableTransactions(): Promise<
    readonly CategorizableTransaction[]
  > {
    await this.prepare();

    return this.options.scenario === 'empty'
      ? []
      : this.store.getState().transactions;
  }
}
