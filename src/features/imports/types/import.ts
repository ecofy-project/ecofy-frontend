/**
 * Contratos de importação confirmados em `ms-ingestion`.
 *
 * Todos os campos e enums abaixo foram lidos diretamente de `ImportController`,
 * `ImportJobResponse`, `ImportErrorResponse`, `ImportJobStatusResponse`, dos
 * enums de domínio e do `RestExceptionHandler`. Nada foi inventado. As
 * divergências entre o contrato real e a especificação da etapa estão
 * documentadas em `docs/INGESTION_CONTRACTS.md`.
 */

import type { Page } from '../../../services/pagination/pagination';

/** `ImportJobStatus` publicado pelo domínio de importações. */
export const importJobStatuses = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
] as const;

export type ImportJobStatus = (typeof importJobStatuses)[number];

/**
 * `ImportFileType` aceito no upload. O enum de domínio também declara `EVENT`,
 * usado apenas para ingestão sintética via Kafka — nunca para envio de arquivo.
 */
export const importFileTypes = ['CSV', 'OFX'] as const;

export type ImportFileType = (typeof importFileTypes)[number];

/** `ImportErrorType` publicado pelo domínio. */
export const importErrorTypes = [
  'PARSE_ERROR',
  'VALIDATION_ERROR',
  'STORAGE_ERROR',
  'UNKNOWN',
] as const;

export type ImportErrorType = (typeof importErrorTypes)[number];

const terminalStatuses = new Set<ImportJobStatus>([
  'COMPLETED',
  'COMPLETED_WITH_ERRORS',
  'FAILED',
]);

export function isTerminalStatus(status: ImportJobStatus): boolean {
  return terminalStatuses.has(status);
}

/**
 * Modelo interno de job. Reflete exatamente `ImportJobResponse`: o serviço não
 * publica duplicados, publicados, código ou motivo de falha, então esses valores
 * não existem aqui.
 */
export type ImportJob = Readonly<{
  id: string;
  importFileId?: string;
  status: ImportJobStatus;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}>;

/**
 * Erro por linha. `rawContent` é publicado por `ImportErrorResponse`, mas nunca
 * é mapeado nem exibido: a linha original do arquivo não trafega pela interface.
 */
export type ImportError = Readonly<{
  id?: string;
  lineNumber?: number;
  errorType?: ImportErrorType;
  message: string;
  createdAt?: string;
}>;

/** Projeção de `ImportJobStatusResponse`. */
export type ImportJobDetails = Readonly<{
  job: ImportJob;
  errors: readonly ImportError[];
}>;

export type ImportUploadInput = Readonly<{
  file: File;
  /** Omitido quando o serviço deve inferir o tipo pelo sufixo do nome. */
  type?: ImportFileType;
}>;

export type ImportUploadOptions = Readonly<{
  /**
   * Só é chamado quando a origem de dados consegue medir o envio dos bytes.
   * O cliente HTTP baseado em `fetch` não expõe progresso de upload, então em
   * API Mode a interface apresenta um indicador indeterminado.
   */
  onUploadProgress?: (percent: number) => void;
  signal?: AbortSignal;
}>;

/** Único campo de ordenação referenciado pelo contrato de listagem. */
export const importSortFields = ['createdAt'] as const;

export type ImportSortField = (typeof importSortFields)[number];

export type ImportSortDirection = 'asc' | 'desc';

export type ImportSort = Readonly<{
  field: ImportSortField;
  direction: ImportSortDirection;
}>;

export type ImportJobListParams = Readonly<{
  page: number;
  size: number;
  sort: ImportSort;
  /** Ausente significa "todos": nenhum parâmetro é enviado ao backend. */
  status?: ImportJobStatus;
}>;

export type ImportJobPage = Page<ImportJob>;
