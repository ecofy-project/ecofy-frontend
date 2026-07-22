import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../../../services/errors/api-error';

export type BudgetMutationResult<T> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ApiError }>;

/** Todo erro da feature passa pelo Error Adapter antes de chegar à UI. */
export function normalizeBudgetError(error: unknown): ApiError {
  return error instanceof ApiErrorException
    ? error.apiError
    : adaptApiError(error);
}

export function readBudgetFieldErrors<TField extends string>(
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

/**
 * Motivos de conflito reconhecidos.
 *
 * `BUDGET_ALREADY_EXISTS` e `IDEMPOTENCY_VIOLATION` são publicados pelo
 * `RestExceptionHandler` do `ms-budgeting` em `details.reason`.
 * `BUDGET_CONCURRENT_UPDATE` cobre o conflito de versão previsto para o
 * recurso; o Mock Mode o reproduz para validar o fluxo de resolução.
 */
const concurrentUpdateReason = 'BUDGET_CONCURRENT_UPDATE';
const conflictReasons = new Set([
  concurrentUpdateReason,
  'BUDGET_ALREADY_EXISTS',
  'IDEMPOTENCY_VIOLATION',
]);

function readConflictReason(error: ApiError): string | undefined {
  const details = error.details;
  const reason =
    typeof details === 'object' && details !== null && !Array.isArray(details)
      ? (details as Record<string, unknown>).reason
      : undefined;

  if (typeof reason === 'string' && conflictReasons.has(reason)) {
    return reason;
  }

  return error.code && conflictReasons.has(error.code) ? error.code : undefined;
}

/**
 * Nem todo 409 é conflito de versão: o motivo é lido explicitamente antes de a
 * UI decidir como reagir.
 */
export function isBudgetConflict(error: ApiError): boolean {
  return error.status === 409 && readConflictReason(error) !== undefined;
}

export function isConcurrentUpdateConflict(error: ApiError): boolean {
  return (
    error.status === 409 && readConflictReason(error) === concurrentUpdateReason
  );
}
