import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';

export type UserMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function normalizeUserError(error: unknown): ApiError {
  const normalized =
    error instanceof ApiErrorException
      ? error.apiError
      : adaptApiError(error);

  return normalized.code === 'VALIDATION_ERROR'
    ? {
        ...normalized,
        message: 'Revise os campos indicados e tente novamente.',
      }
    : normalized;
}

export function readUserFieldErrors<TField extends string>(
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
