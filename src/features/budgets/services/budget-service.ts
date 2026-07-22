import type { BudgetDataSource } from '../data-sources/budget-data-source';
import type {
  BudgetListParams,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../types/budget';

export class BudgetService {
  constructor(private readonly dataSource: BudgetDataSource) {}

  listBudgets(params: BudgetListParams) {
    return this.dataSource.list(params);
  }

  getBudget(id: string) {
    return this.dataSource.getById(id);
  }

  createBudget(input: CreateBudgetInput) {
    return this.dataSource.create(input);
  }

  updateBudget(id: string, input: UpdateBudgetInput) {
    return this.dataSource.update(id, input);
  }

  removeBudget(id: string) {
    return this.dataSource.remove(id);
  }

  getOverview() {
    return this.dataSource.getOverview();
  }
}
