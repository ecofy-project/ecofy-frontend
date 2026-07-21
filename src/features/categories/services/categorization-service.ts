import type { CategorizationDataSource } from '../data-sources/categorization-data-source';
import type {
  CreateCategoryInput,
  CreateRuleInput,
  ManualCategorizationInput,
} from '../types/categorization';

export class CategorizationService {
  constructor(private readonly dataSource: CategorizationDataSource) {}

  /** Indica se a origem de dados atual consegue enumerar transações. */
  get supportsTransactionLookup() {
    return typeof this.dataSource.listCategorizableTransactions === 'function';
  }

  listCategories() {
    return this.dataSource.listCategories();
  }

  createCategory(input: CreateCategoryInput) {
    return this.dataSource.createCategory(input);
  }

  listRules() {
    return this.dataSource.listRules();
  }

  createRule(input: CreateRuleInput) {
    return this.dataSource.createRule(input);
  }

  categorizeManually(input: ManualCategorizationInput) {
    return this.dataSource.categorizeManually(input);
  }

  getSuggestionByTransaction(transactionId: string) {
    return this.dataSource.getSuggestionByTransaction(transactionId);
  }

  listCategorizableTransactions() {
    return this.dataSource.listCategorizableTransactions?.() ?? null;
  }
}
