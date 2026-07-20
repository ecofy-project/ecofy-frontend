import type { FoundationSummary } from '../types/foundation-summary';

export interface FoundationDataSource {
  getSummary(): Promise<FoundationSummary>;
}
