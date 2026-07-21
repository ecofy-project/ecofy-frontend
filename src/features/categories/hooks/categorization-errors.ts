import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';

export type CategorizationMutationResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ApiError }>;

/** Todo erro da feature passa por aqui antes de chegar à UI. */
export function normalizeCategorizationError(error: unknown): ApiError {
  return error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);
}

export function readCategorizationFieldErrors<TField extends string>(
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
