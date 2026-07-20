import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';

export function normalizeFormError(error: unknown): ApiError {
  const normalizedError = error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);

  return normalizedError.code === 'VALIDATION_ERROR'
    ? {
        ...normalizedError,
        message: 'Revise os campos indicados e tente novamente.',
      }
    : normalizedError;
}

export function applyConfirmedErrorMessages(
  error: ApiError,
  messages: Readonly<Record<string, string>>,
): ApiError {
  const message = error.code ? messages[error.code] : undefined;

  return message ? { ...error, message } : error;
}

export function readFieldErrors<TField extends string>(
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
