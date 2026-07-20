import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import type { FoundationSummary } from '../types/foundation-summary';
import type { FoundationDataSource } from './foundation-data-source';

export class ApiFoundationDataSource implements FoundationDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async getSummary(): Promise<FoundationSummary> {
    // Mantém a dependência de transporte pronta sem inventar um endpoint.
    void this.httpClient;

    throw new ApiErrorException({
      code: 'DATA_SOURCE_NOT_CONFIGURED',
      message:
        'Esta demonstração ainda não possui um endpoint definido no API Gateway.',
      status: 503,
    });
  }
}
