import type {
  CategorizableTransaction,
  CategorizationRule,
  CategorizationSuggestion,
  Category,
  CreateCategoryInput,
  CreateRuleInput,
  ManualCategorizationInput,
  ManualCategorizationResult,
} from '../types/categorization';

/**
 * Contrato único consumido pela feature. Mock e API implementam exatamente
 * esta interface, de modo que nenhuma página conhece o modo de execução.
 */
export interface CategorizationDataSource {
  listCategories(): Promise<readonly Category[]>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
  listRules(): Promise<readonly CategorizationRule[]>;
  createRule(input: CreateRuleInput): Promise<CategorizationRule>;
  categorizeManually(
    input: ManualCategorizationInput,
  ): Promise<ManualCategorizationResult>;
  /** Retorna `null` quando a transação não possui sugestão registrada. */
  getSuggestionByTransaction(
    transactionId: string,
  ): Promise<CategorizationSuggestion | null>;
  /**
   * Opcional: só existe quando a origem de dados consegue enumerar transações.
   * O API Gateway não publica esse recurso, então a implementação de API a omite
   * e a interface passa a solicitar o identificador da transação diretamente.
   */
  listCategorizableTransactions?(): Promise<readonly CategorizableTransaction[]>;
}
