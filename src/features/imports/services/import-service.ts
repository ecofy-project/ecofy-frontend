import type { ImportDataSource } from '../data-sources/import-data-source';
import type {
  ImportJobListParams,
  ImportUploadInput,
  ImportUploadOptions,
} from '../types/import';

export type ImportServiceOptions = Readonly<{
  /** Limite vindo da configuração central do frontend. */
  maxFileSizeBytes: number;
}>;

export class ImportService {
  constructor(
    private readonly dataSource: ImportDataSource,
    private readonly options: ImportServiceOptions,
  ) {}

  /** Limite usado nas validações preliminares e nas mensagens da interface. */
  get maxFileSizeBytes() {
    return this.options.maxFileSizeBytes;
  }

  uploadFile(input: ImportUploadInput, options?: ImportUploadOptions) {
    return this.dataSource.upload(input, options);
  }

  listJobs(params: ImportJobListParams) {
    return this.dataSource.listJobs(params);
  }

  getJobById(id: string) {
    return this.dataSource.getJobById(id);
  }
}
