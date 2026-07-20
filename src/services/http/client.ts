import {
  adaptApiError,
  ApiErrorException,
  type ApiError,
} from '../errors/api-error';
import { getFrontendConfig } from '../config/env';
import { createCorrelationId } from './correlation-id';
import type {
  HttpClientOptions,
  HttpRequestOptions,
  HttpResponse,
  QueryValue,
} from './types';

const defaultTimeoutMs = 15_000;

function appendQueryValue(
  params: URLSearchParams,
  key: string,
  value: QueryValue,
) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => params.append(key, String(item)));
    return;
  }

  params.set(key, String(value));
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: HttpRequestOptions['query'],
) {
  if (/^https?:\/\//i.test(path)) {
    throw new Error(
      'O cliente HTTP aceita somente caminhos relativos ao API Gateway.',
    );
  }

  const normalizedBase = `${baseUrl.replace(/\/$/, '')}/`;
  const normalizedPath = path.replace(/^\//, '');
  const url = new URL(normalizedPath, normalizedBase);

  Object.entries(query ?? {}).forEach(([key, value]) =>
    appendQueryValue(url.searchParams, key, value),
  );

  return url;
}

function isNativeBody(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer
  );
}

function serializeBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isNativeBody(body)) {
    return body;
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(body);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  }

  return text;
}

function createTransportError(
  error: unknown,
  timedOut: boolean,
  correlationId: string,
): ApiError {
  const aborted = error instanceof DOMException && error.name === 'AbortError';

  if (timedOut) {
    return {
      code: 'REQUEST_TIMEOUT',
      message: 'A solicitação demorou mais que o esperado.',
      traceId: correlationId,
    };
  }

  if (aborted) {
    return {
      code: 'REQUEST_ABORTED',
      message: 'A solicitação foi cancelada.',
      traceId: correlationId,
    };
  }

  return {
    code: 'NETWORK_ERROR',
    message: 'Não foi possível conectar ao serviço.',
    traceId: correlationId,
  };
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly session: HttpClientOptions['session'];
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.session = options.session;
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.fetchImplementation = options.fetchImplementation ?? fetch;
  }

  async request<T>(
    path: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const correlationId = options.correlationId ?? createCorrelationId();
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Correlation-Id', correlationId);

    const accessToken = await this.session?.getAccessToken();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const method = options.method ?? 'GET';
    const body =
      method === 'GET' || method === 'HEAD'
        ? undefined
        : serializeBody(options.body, headers);
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, options.timeoutMs ?? this.timeoutMs);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener('abort', abortFromCaller, { once: true });

    try {
      const response = await this.fetchImplementation(
        buildUrl(this.baseUrl, path, options.query),
        {
          method,
          headers,
          body,
          signal: controller.signal,
        },
      );
      const payload = await parseResponseBody(response);

      if (!response.ok) {
        throw new ApiErrorException(
          adaptApiError(payload, {
            status: response.status,
            headers: response.headers,
            correlationId,
          }),
        );
      }

      return {
        data: payload as T,
        status: response.status,
        correlationId:
          response.headers.get('x-correlation-id') ?? correlationId,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof ApiErrorException) {
        throw error;
      }

      throw new ApiErrorException(
        createTransportError(error, timedOut, correlationId),
      );
    } finally {
      window.clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', abortFromCaller);
    }
  }
}

export function createGatewayHttpClient(
  options: Omit<HttpClientOptions, 'baseUrl'> = {},
) {
  return new HttpClient({
    ...options,
    baseUrl: getFrontendConfig().apiGatewayUrl,
  });
}
