export type SessionAdapter = {
  getAccessToken: () => string | null | Promise<string | null>;
  /**
   * Chamado quando uma requisição fora dos endpoints de autenticação recebe um
   * `401`. Deve devolver `true` quando a sessão foi renovada e a requisição
   * original pode ser repetida uma vez, ou `false` quando a sessão foi
   * encerrada e o `401` deve seguir para a interface.
   */
  handleUnauthorized?: () => boolean | Promise<boolean>;
};

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type HttpRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  correlationId?: string;
};

export type HttpResponse<T> = {
  data: T;
  status: number;
  correlationId: string;
  headers: Headers;
};

export type HttpClientOptions = {
  baseUrl: string;
  session?: SessionAdapter;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
};
