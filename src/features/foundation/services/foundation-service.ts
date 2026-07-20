import type { FoundationDataSource } from '../data-sources/foundation-data-source';

export class FoundationService {
  constructor(private readonly dataSource: FoundationDataSource) {}

  getSummary() {
    return this.dataSource.getSummary();
  }
}
