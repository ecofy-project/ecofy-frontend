import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';

/** Todo erro da feature passa pelo Error Adapter antes de chegar à UI. */
export function normalizeImportError(error: unknown): ApiError {
  return error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);
}

export function isAbortedRequest(error: ApiError): boolean {
  return error.code === 'REQUEST_ABORTED';
}

/**
 * Classificação dos erros de upload conhecidos.
 *
 * Cada categoria reconhece tanto o código publicado hoje pelo `ms-ingestion`
 * quanto o código previsto pela especificação da etapa, mantendo a interface
 * compatível com os dois. Os códigos reais estão em `IngestionErrorCode` e no
 * `RestExceptionHandler`; a correspondência está documentada em
 * `docs/INGESTION_CONTRACTS.md`.
 */
export type ImportUploadIssue =
  | 'already-processed'
  | 'idempotency-mismatch'
  | 'file-too-large'
  | 'unsupported-type'
  | 'invalid-file'
  | 'forbidden'
  | 'not-found'
  | 'generic';

const alreadyProcessedCodes = new Set(['IMPORT_ALREADY_PROCESSED']);
const idempotencyMismatchCodes = new Set([
  'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
]);
const fileTooLargeCodes = new Set([
  'FILE_TOO_LARGE',
  'FILE_SIZE_LIMIT_EXCEEDED',
]);
const unsupportedTypeCodes = new Set([
  'UNSUPPORTED_IMPORT_FILE_TYPE',
  'UNSUPPORTED_FILE_TYPE',
  'IMPORT_FILE_TYPE_REQUIRED',
]);
const invalidFileCodes = new Set([
  'PARSE_ERROR',
  'INVALID_FILE_HEADER',
  'INVALID_ENCODING',
  'INVALID_LINE',
  'INVALID_COLUMN',
  'INVALID_FILE_SIZE',
  'INVALID_MULTIPART',
  'IMPORT_FILE_STORED_PATH_MISSING',
]);
const forbiddenCodes = new Set(['IMPORT_ACCESS_FORBIDDEN']);

export function classifyImportUploadError(error: ApiError): ImportUploadIssue {
  const code = error.code ?? '';

  if (error.status === 409 && idempotencyMismatchCodes.has(code)) {
    return 'idempotency-mismatch';
  }

  if (error.status === 409 && alreadyProcessedCodes.has(code)) {
    return 'already-processed';
  }

  if (error.status === 413 || fileTooLargeCodes.has(code)) {
    return 'file-too-large';
  }

  if (error.status === 415 || unsupportedTypeCodes.has(code)) {
    return 'unsupported-type';
  }

  if (error.status === 403 || forbiddenCodes.has(code)) {
    return 'forbidden';
  }

  if (error.status === 404) {
    return 'not-found';
  }

  return invalidFileCodes.has(code) ? 'invalid-file' : 'generic';
}

/**
 * Identificador do job já existente, anexado aos detalhes pelo Data Source a
 * partir do header `Location`. Ausente quando o header não veio.
 */
export function readExistingJobId(error: ApiError): string | undefined {
  const details = error.details;

  if (typeof details !== 'object' || details === null || Array.isArray(details)) {
    return undefined;
  }

  const jobId = (details as Record<string, unknown>).jobId;
  return typeof jobId === 'string' && jobId.trim() ? jobId.trim() : undefined;
}
