import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';

export type InsightsMutationResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ApiError }>;

/** Todo erro da feature passa pelo Error Adapter antes de chegar à UI. */
export function normalizeInsightsError(error: unknown): ApiError {
  return error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);
}

const degradedReason = 'EXTERNAL_DATA_UNAVAILABLE';

function readReason(error: ApiError): string | undefined {
  const details = error.details;

  if (typeof details !== 'object' || details === null || Array.isArray(details)) {
    return undefined;
  }

  const reason = (details as Record<string, unknown>).reason;
  return typeof reason === 'string' ? reason : undefined;
}

/**
 * Estado degradado.
 *
 * O `ms-insights` responde `503` com `details.reason = EXTERNAL_DATA_UNAVAILABLE`
 * quando uma dependência externa habilitada está fora. A identificação usa
 * status e código normalizados — nunca o texto da mensagem — e não deve ser
 * confundida com estado vazio.
 */
export function isDegradedError(error: ApiError): boolean {
  return (
    error.status === 503 &&
    (error.code === degradedReason || readReason(error) === degradedReason)
  );
}

export function readInsightsFieldErrors<TField extends string>(
  error: ApiError,
  allowedFields: readonly TField[],
): Partial<Record<TField, string>> {
  const allowed = new Set<string>(allowedFields);

  return Object.fromEntries(
    (error.fieldErrors ?? [])
      .filter((fieldError) => allowed.has(fieldError.field))
      .map((fieldError) => [fieldError.field, fieldError.message]),
  ) as Partial<Record<TField, string>>;
}
