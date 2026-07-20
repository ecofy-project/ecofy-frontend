export type ApiFieldError = {
  field: string;
  message: string;
  code?: string;
};

export type ApiError = {
  code?: string;
  message: string;
  status?: number;
  traceId?: string;
  retryAfter?: string;
  fieldErrors?: ApiFieldError[];
  details?: unknown;
};

export type ApiErrorContext = {
  status?: number;
  headers?: Headers;
  correlationId?: string;
};

const internalDetailKeys = new Set([
  'stack',
  'stacktrace',
  'stackTrace',
  'exception',
  'cause',
  'debug',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown> | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function sanitizeDetails(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeDetails(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !internalDetailKeys.has(key))
        .map(([key, item]) => [key, sanitizeDetails(item, depth + 1)])
        .filter(([, item]) => item !== undefined),
    );
  }

  return undefined;
}

function parseFieldErrors(value: unknown): ApiFieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const fieldErrors = value.flatMap((item): ApiFieldError[] => {
    if (!isRecord(item)) {
      return [];
    }

    const field = readString(item, ['field', 'property', 'path']);
    const message = readString(item, ['message', 'defaultMessage', 'error']);

    if (!field || !message) {
      return [];
    }

    const code = readString(item, ['errorCode', 'code']);
    return [{ field, message, ...(code ? { code } : {}) }];
  });

  return fieldErrors.length ? fieldErrors : undefined;
}

function fallbackMessage(status?: number) {
  switch (status) {
    case 400:
      return 'Revise os dados enviados e tente novamente.';
    case 401:
      return 'Sua sessão precisa ser renovada.';
    case 403:
      return 'Você não tem permissão para acessar este recurso.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'A operação entrou em conflito com o estado atual.';
    case 413:
      return 'O arquivo excede o limite permitido.';
    case 415:
      return 'O formato enviado não é suportado.';
    case 422:
      return 'Os dados enviados não puderam ser processados.';
    case 429:
      return 'Muitas tentativas foram feitas. Aguarde antes de tentar novamente.';
    case 503:
      return 'O serviço está temporariamente indisponível.';
    default:
      return status && status >= 500
        ? 'Não foi possível concluir a operação.'
        : 'Ocorreu um erro inesperado.';
  }
}

export function adaptApiError(
  payload: unknown,
  context: ApiErrorContext = {},
): ApiError {
  const root = isRecord(payload) ? payload : undefined;
  const detailsRecord = isRecord(root?.details) ? root.details : undefined;
  const status =
    context.status ??
    (typeof root?.status === 'number' ? root.status : undefined);
  const code =
    readString(root, ['errorCode', 'code', 'error']) ??
    readString(detailsRecord, ['errorCode', 'code']) ??
    'UNKNOWN_ERROR';
  const unsafeMessage = readString(root, ['message', 'title']);
  const message =
    status && status >= 500
      ? fallbackMessage(status)
      : (unsafeMessage ?? fallbackMessage(status));
  const traceId =
    readString(root, ['traceId', 'correlationId']) ??
    readString(detailsRecord, ['traceId', 'correlationId']) ??
    context.headers?.get('x-trace-id') ??
    context.headers?.get('x-correlation-id') ??
    context.correlationId;
  const retryAfter = context.headers?.get('retry-after')?.trim() || undefined;
  const fieldErrors =
    parseFieldErrors(root?.fieldErrors) ??
    parseFieldErrors(detailsRecord?.fieldErrors) ??
    parseFieldErrors(root?.errors);
  const rawDetails = root?.details;
  const details = rawDetails === undefined ? undefined : sanitizeDetails(rawDetails);

  return {
    message,
    code,
    ...(status ? { status } : {}),
    ...(traceId ? { traceId } : {}),
    ...(retryAfter ? { retryAfter } : {}),
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(details !== undefined ? { details } : {}),
  };
}

export class ApiErrorException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiErrorException';
    this.apiError = apiError;
  }
}
