export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type PageRequest = {
  page: number;
  size: number;
  sort?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
) {
  const value = record[key];

  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Resposta paginada inválida: "${key}" deve ser um inteiro.`);
  }

  return value as number;
}

export function normalizePage<T>(
  payload: unknown,
  mapItem: (item: unknown, index: number) => T,
): Page<T> {
  if (!isRecord(payload) || !Array.isArray(payload.content)) {
    throw new Error('Resposta paginada inválida: "content" deve ser um array.');
  }

  const page = readNonNegativeInteger(payload, 'page');
  const size = readNonNegativeInteger(payload, 'size');
  const totalElements = readNonNegativeInteger(payload, 'totalElements');
  const totalPages = readNonNegativeInteger(payload, 'totalPages');

  if (typeof payload.first !== 'boolean' || typeof payload.last !== 'boolean') {
    throw new Error(
      'Resposta paginada inválida: "first" e "last" devem ser booleanos.',
    );
  }

  return {
    content: payload.content.map(mapItem),
    page,
    size,
    totalElements,
    totalPages,
    first: payload.first,
    last: payload.last,
  };
}

export function toPageSearchParams(request: PageRequest): URLSearchParams {
  if (
    !Number.isInteger(request.page) ||
    request.page < 0 ||
    !Number.isInteger(request.size) ||
    request.size <= 0
  ) {
    throw new Error('Parâmetros de paginação inválidos.');
  }

  const params = new URLSearchParams({
    page: String(request.page),
    size: String(request.size),
  });

  request.sort?.forEach((sort) => params.append('sort', sort));
  return params;
}
