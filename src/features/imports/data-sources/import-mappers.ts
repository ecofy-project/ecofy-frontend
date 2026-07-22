import {
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';
import {
  importErrorTypes,
  importJobStatuses,
  type ImportError,
  type ImportErrorType,
  type ImportJob,
  type ImportJobDetails,
  type ImportJobStatus,
} from '../types/import';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_IMPORT_RESPONSE',
    message: 'A resposta de importação recebida é incompatível.',
    status: 502,
  });
}

function readRequiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    incompatibleResponse();
  }

  return value.trim();
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readCounter(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  incompatibleResponse();
}

function readOptionalInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value)
    ? value
    : undefined;
}

function readEnum<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
): TValue {
  if (typeof value !== 'string' || !allowed.includes(value as TValue)) {
    incompatibleResponse();
  }

  return value as TValue;
}

export function mapImportJob(payload: unknown): ImportJob {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const importFileId = readOptionalString(payload.importFileId);
  const startedAt = readOptionalString(payload.startedAt);
  const finishedAt = readOptionalString(payload.finishedAt);
  const createdAt = readOptionalString(payload.createdAt);
  const updatedAt = readOptionalString(payload.updatedAt);

  return Object.freeze({
    id: readRequiredString(payload.id),
    ...(importFileId ? { importFileId } : {}),
    status: readEnum<ImportJobStatus>(payload.status, importJobStatuses),
    totalRecords: readCounter(payload.totalRecords),
    processedRecords: readCounter(payload.processedRecords),
    successCount: readCounter(payload.successCount),
    errorCount: readCounter(payload.errorCount),
    ...(startedAt ? { startedAt } : {}),
    ...(finishedAt ? { finishedAt } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  });
}

/**
 * `ImportErrorResponse` publica `rawContent` com a linha original do arquivo.
 * Esse campo é deliberadamente ignorado: o conteúdo bruto nunca entra no
 * modelo interno e, portanto, nunca chega à interface.
 */
export function mapImportError(payload: unknown): ImportError {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const id = readOptionalString(payload.id);
  const lineNumber = readOptionalInteger(payload.lineNumber);
  const createdAt = readOptionalString(payload.createdAt);
  const errorType =
    typeof payload.errorType === 'string' &&
    importErrorTypes.includes(payload.errorType as ImportErrorType)
      ? (payload.errorType as ImportErrorType)
      : undefined;

  return Object.freeze({
    ...(id ? { id } : {}),
    ...(lineNumber === undefined ? {} : { lineNumber }),
    ...(errorType ? { errorType } : {}),
    message:
      readOptionalString(payload.errorMessage) ??
      readOptionalString(payload.message) ??
      'Não foi possível processar este registro.',
    ...(createdAt ? { createdAt } : {}),
  });
}

export function mapImportJobDetails(payload: unknown): ImportJobDetails {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const errors = Array.isArray(payload.errors) ? payload.errors : [];

  return Object.freeze({
    job: mapImportJob(payload.job),
    errors: Object.freeze(errors.map(mapImportError)),
  });
}

/**
 * Extrai apenas o identificador do job a partir do header `Location`.
 *
 * O valor é tratado como dado não confiável: qualquer URL absoluta de outro
 * host é descartada, o caminho precisa terminar em `/jobs/{id}` e o segmento
 * final não pode conter separadores. Nunca é usado para navegação direta.
 */
export function readJobIdFromLocation(
  location: string | null,
): string | undefined {
  if (!location?.trim()) {
    return undefined;
  }

  let pathname: string;

  try {
    const parsed = new URL(location, 'http://localhost');
    pathname = parsed.pathname;
  } catch {
    return undefined;
  }

  const match = /\/jobs\/([^/?#]+)$/.exec(pathname);
  const candidate = match?.[1] ? decodeURIComponent(match[1]).trim() : '';

  return candidate && !candidate.includes('/') ? candidate : undefined;
}

/**
 * Anexa aos detalhes do erro o identificador do job já existente, quando o
 * conflito trouxe um `Location` utilizável. Compartilhado por Mock e API para
 * que os dois modos produzam exatamente o mesmo `ApiError`.
 */
export function attachExistingJobId(apiError: ApiError): ApiError {
  const jobId = readJobIdFromLocation(apiError.location ?? null);

  if (!jobId) {
    return apiError;
  }

  const currentDetails =
    apiError.details && typeof apiError.details === 'object' && !Array.isArray(apiError.details)
      ? (apiError.details as Record<string, unknown>)
      : {};

  return { ...apiError, details: { ...currentDetails, jobId } };
}
