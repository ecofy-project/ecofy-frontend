import type {
  Budget,
  BudgetListParams,
  BudgetOverview,
  BudgetPage,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../types/budget';

/**
 * Contrato único consumido pela feature. Mock e API implementam exatamente esta
 * interface, então nenhuma página conhece o modo de execução.
 *
 * `remove` existe porque `DELETE /budgeting/api/budgeting/v1/budgets/{id}` está
 * confirmado em `BudgetController`.
 */
export interface BudgetDataSource {
  list(params: BudgetListParams): Promise<BudgetPage>;
  getById(id: string): Promise<Budget>;
  create(input: CreateBudgetInput): Promise<Budget>;
  update(id: string, input: UpdateBudgetInput): Promise<Budget>;
  remove(id: string): Promise<void>;
  getOverview(): Promise<BudgetOverview>;
}
