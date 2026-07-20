import type { FoundationDataSource } from '../../features/foundation/data-sources/foundation-data-source';
import type { FoundationSummary } from '../../features/foundation/types/foundation-summary';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import { resolveFoundationMockScenario } from '../scenarios/foundation-scenarios';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockFoundationOptions = {
  scenario: MockScenario;
  delayMs: number;
};

export class MockFoundationDataSource implements FoundationDataSource {
  constructor(private readonly options: MockFoundationOptions) {}

  async getSummary(): Promise<FoundationSummary> {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;

    await simulateMockLatency(delay);
    const result = resolveFoundationMockScenario(this.options.scenario);

    if (result.kind === 'error') {
      throw new ApiErrorException(result.error);
    }

    return result.data;
  }
}
