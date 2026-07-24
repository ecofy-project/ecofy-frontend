import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import type {
  CategorizationRule,
  CategorizationSuggestion,
  Category,
  CreateCategoryInput,
  CreateRuleInput,
  ManualCategorizationInput,
  ManualCategorizationResult,
} from '../types/categorization';
import type { CategorizationDataSource } from './categorization-data-source';
import {
  mapCategories,
  mapCategory,
  mapManualCategorizationResult,
  mapRule,
  mapRules,
  mapSuggestion,
} from './categorization-mappers';

/**
 * Prefixo versionado do API Gateway. A rota `/api/v1/**` reescreve para o mesmo
 * downstream da rota legada (`/categorization/api/categorization/v1`), com
 * CircuitBreaker, Retry e fallback que a rota legada não tem.
 */
const categorizationGatewayPath = '/api/v1/categorization';

export class ApiCategorizationDataSource implements CategorizationDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async listCategories(): Promise<readonly Category[]> {
    const response = await this.httpClient.request<unknown>(
      `${categorizationGatewayPath}/categories`,
    );

    return mapCategories(response.data);
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const response = await this.httpClient.request<unknown>(
      `${categorizationGatewayPath}/categories`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          name: input.name,
          ...(input.color ? { color: input.color } : {}),
        },
      },
    );

    return mapCategory(response.data);
  }

  async listRules(): Promise<readonly CategorizationRule[]> {
    const response = await this.httpClient.request<unknown>(
      `${categorizationGatewayPath}/rules`,
    );

    return mapRules(response.data);
  }

  async createRule(input: CreateRuleInput): Promise<CategorizationRule> {
    const response = await this.httpClient.request<unknown>(
      `${categorizationGatewayPath}/rules`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          categoryId: input.categoryId,
          name: input.name,
          status: input.status,
          priority: input.priority,
          conditions: input.conditions.map((condition) => ({
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            ...(condition.weight === undefined
              ? {}
              : { weight: condition.weight }),
          })),
        },
      },
    );

    return mapRule(response.data);
  }

  async categorizeManually(
    input: ManualCategorizationInput,
  ): Promise<ManualCategorizationResult> {
    const response = await this.httpClient.request<unknown>(
      `${categorizationGatewayPath}/manual`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          transactionId: input.transactionId,
          categoryId: input.categoryId,
          ...(input.rationale ? { rationale: input.rationale } : {}),
        },
      },
    );

    return mapManualCategorizationResult(response.data);
  }

  async getSuggestionByTransaction(
    transactionId: string,
  ): Promise<CategorizationSuggestion | null> {
    try {
      const response = await this.httpClient.request<unknown>(
        `${categorizationGatewayPath}/suggestions/${encodeURIComponent(transactionId)}`,
      );

      return mapSuggestion(response.data);
    } catch (error: unknown) {
      if (
        error instanceof ApiErrorException &&
        error.apiError.status === 404
      ) {
        return null;
      }

      throw error;
    }
  }
}
