import type {
  ImportJob,
  ImportJobDetails,
  ImportJobListParams,
  ImportJobPage,
  ImportUploadInput,
  ImportUploadOptions,
} from '../types/import';

/**
 * Contrato único consumido pela feature. Mock e API implementam exatamente esta
 * interface, então nenhuma página conhece o modo de execução.
 *
 * Nenhum tipo da camada de transporte (`Response`, headers, corpo bruto) é
 * exposto: o upload devolve o próprio `ImportJob` normalizado.
 */
export interface ImportDataSource {
  upload(
    input: ImportUploadInput,
    options?: ImportUploadOptions,
  ): Promise<ImportJob>;
  listJobs(params: ImportJobListParams): Promise<ImportJobPage>;
  getJobById(id: string): Promise<ImportJobDetails>;
}
