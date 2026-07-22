export type AppEnvironment =
  | 'development'
  | 'test'
  | 'staging'
  | 'production'
  | 'demo';
export type AppDataMode = 'mock' | 'api';
export type MockScenario =
  | 'default'
  | 'empty'
  | 'error'
  | 'loading'
  | 'degraded'
  | 'processing'
  | 'profile-incomplete'
  | 'preferences-empty'
  | 'connections-empty'
  | 'connections-multiple'
  | 'categories-empty'
  | 'category-create-error'
  | 'manual-error'
  | 'budgets-empty'
  | 'budget-single'
  | 'budgets-multiple'
  | 'budget-paused'
  | 'budget-archived'
  | 'consumption-partial'
  | 'consumption-full'
  | 'budget-conflict'
  | 'budget-error'
  | 'imports-empty'
  | 'import-completed'
  | 'import-completed-with-errors'
  | 'import-failed'
  | 'import-pending'
  | 'import-running'
  | 'import-already-processed'
  | 'import-idempotency-mismatch'
  | 'import-file-too-large'
  | 'import-unsupported-type'
  | 'import-invalid-header'
  | 'import-error';
export type MockAuthScenario =
  | 'success'
  | 'invalid_credentials'
  | 'invalid_request'
  | 'rate_limited'
  | 'server_error';

export type FrontendConfig = Readonly<{
  apiGatewayUrl?: string;
  dataMode: AppDataMode;
  authClientId?: string;
  appEnv: AppEnvironment;
  mockScenario: MockScenario;
  mockAuthScenario: MockAuthScenario;
  mockUserRoles: readonly string[];
  mockUserPermissions: readonly string[];
  mockDelayMs: number;
  /**
   * Limite de tamanho usado nas validações preliminares de importação. O padrão
   * acompanha `ING_STORAGE_MAX_FILE_SIZE` do ambiente de desenvolvimento do
   * `ms-ingestion` (10 MB); em produção o serviço aceita 20 MB. O backend
   * continua sendo a autoridade final.
   */
  maxImportFileSizeBytes: number;
}>;

type EnvironmentSource = Record<string, string | boolean | undefined>;

const supportedAppEnvironments = new Set<AppEnvironment>([
  'development',
  'test',
  'staging',
  'production',
  'demo',
]);

const supportedDataModes = new Set<AppDataMode>(['mock', 'api']);
const supportedMockScenarios = new Set<MockScenario>([
  'default',
  'empty',
  'error',
  'loading',
  'degraded',
  'processing',
  'profile-incomplete',
  'preferences-empty',
  'connections-empty',
  'connections-multiple',
  'categories-empty',
  'category-create-error',
  'manual-error',
  'budgets-empty',
  'budget-single',
  'budgets-multiple',
  'budget-paused',
  'budget-archived',
  'consumption-partial',
  'consumption-full',
  'budget-conflict',
  'budget-error',
  'imports-empty',
  'import-completed',
  'import-completed-with-errors',
  'import-failed',
  'import-pending',
  'import-running',
  'import-already-processed',
  'import-idempotency-mismatch',
  'import-file-too-large',
  'import-unsupported-type',
  'import-invalid-header',
  'import-error',
]);
const supportedMockAuthScenarios = new Set<MockAuthScenario>([
  'success',
  'invalid_credentials',
  'invalid_request',
  'rate_limited',
  'server_error',
]);

function readDataMode(value: string | undefined): AppDataMode {
  const normalized = value?.trim().toLowerCase() ?? 'mock';

  if (!supportedDataModes.has(normalized as AppDataMode)) {
    throw new Error(
      `VITE_APP_DATA_MODE inválido: "${normalized}". Use mock ou api.`,
    );
  }

  return normalized as AppDataMode;
}

function readAppEnvironment(value: string | undefined): AppEnvironment {
  const normalized = value?.trim().toLowerCase() ?? 'development';

  if (!supportedAppEnvironments.has(normalized as AppEnvironment)) {
    throw new Error(
      `VITE_APP_ENV inválido: "${normalized}". Use development, test, staging, production ou demo.`,
    );
  }

  return normalized as AppEnvironment;
}

function readMockScenario(value: string | undefined): MockScenario {
  const normalized = value?.trim().toLowerCase() ?? 'default';

  if (!supportedMockScenarios.has(normalized as MockScenario)) {
    throw new Error(
      `VITE_MOCK_SCENARIO inválido: "${normalized}". Valores aceitos: ${[
        ...supportedMockScenarios,
      ].join(', ')}.`,
    );
  }

  return normalized as MockScenario;
}

function readMockAuthScenario(value: string | undefined): MockAuthScenario {
  const normalized = value?.trim().toLowerCase() ?? 'success';

  if (!supportedMockAuthScenarios.has(normalized as MockAuthScenario)) {
    throw new Error(
      `VITE_MOCK_AUTH_SCENARIO inválido: "${normalized}". Use success, invalid_credentials, invalid_request, rate_limited ou server_error.`,
    );
  }

  return normalized as MockAuthScenario;
}

function readStringList(value: string | undefined): readonly string[] {
  if (!value?.trim()) {
    return Object.freeze([]);
  }

  return Object.freeze(
    [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))],
  );
}

function readMockDelay(value: string | undefined): number {
  if (!value?.trim()) {
    return 450;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10_000) {
    throw new Error(
      'VITE_MOCK_DELAY_MS deve ser um inteiro entre 0 e 10000.',
    );
  }

  return parsed;
}

const defaultMaxImportFileSizeBytes = 10 * 1024 * 1024;
const maximumSupportedImportFileSizeBytes = 100 * 1024 * 1024;

function readMaxImportFileSize(value: string | undefined): number {
  if (!value?.trim()) {
    return defaultMaxImportFileSizeBytes;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0 ||
    parsed > maximumSupportedImportFileSizeBytes
  ) {
    throw new Error(
      'VITE_MAX_IMPORT_FILE_SIZE_BYTES deve ser um inteiro positivo de até 104857600.',
    );
  }

  return parsed;
}

function normalizeGatewayUrl(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('VITE_API_GATEWAY_URL deve ser uma URL absoluta válida.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('VITE_API_GATEWAY_URL deve utilizar HTTP ou HTTPS.');
  }

  const disallowedLocalPorts = new Set([
    '8081',
    '8082',
    '8083',
    '8084',
    '8085',
    '8086',
    '8087',
  ]);

  if (
    ['localhost', '127.0.0.1'].includes(parsed.hostname) &&
    disallowedLocalPorts.has(parsed.port)
  ) {
    throw new Error(
      'VITE_API_GATEWAY_URL aponta para um microsserviço. Utilize o API Gateway.',
    );
  }

  return parsed.toString().replace(/\/$/, '');
}

function assertNoFrontendSecrets(source: EnvironmentSource) {
  const secretPattern = /(CLIENT_SECRET|INTERNAL_TOKEN|PRIVATE_KEY)/i;
  const exposedSecret = Object.entries(source).find(
    ([key, value]) => key.startsWith('VITE_') && secretPattern.test(key) && value,
  );

  if (exposedSecret) {
    throw new Error(
      `A variável ${exposedSecret[0]} parece conter uma credencial e não pode ser exposta no frontend.`,
    );
  }
}

export function loadFrontendConfig(
  source: EnvironmentSource = import.meta.env,
): FrontendConfig {
  assertNoFrontendSecrets(source);
  const dataMode = readDataMode(
    typeof source.VITE_APP_DATA_MODE === 'string'
      ? source.VITE_APP_DATA_MODE
      : undefined,
  );
  const appEnv = readAppEnvironment(
    typeof source.VITE_APP_ENV === 'string'
      ? source.VITE_APP_ENV
      : undefined,
  );
  const configuredGateway =
    typeof source.VITE_API_GATEWAY_URL === 'string'
      ? source.VITE_API_GATEWAY_URL.trim()
      : '';
  const gateway = configuredGateway || undefined;

  if (dataMode === 'api' && !gateway) {
    throw new Error(
      'VITE_API_GATEWAY_URL é obrigatória quando VITE_APP_DATA_MODE=api.',
    );
  }

  const authClientId =
    typeof source.VITE_AUTH_CLIENT_ID === 'string'
      ? source.VITE_AUTH_CLIENT_ID.trim() || undefined
      : undefined;
  const mockScenario = readMockScenario(
    typeof source.VITE_MOCK_SCENARIO === 'string'
      ? source.VITE_MOCK_SCENARIO
      : undefined,
  );
  const mockAuthScenario = readMockAuthScenario(
    typeof source.VITE_MOCK_AUTH_SCENARIO === 'string'
      ? source.VITE_MOCK_AUTH_SCENARIO
      : undefined,
  );
  const mockUserRoles = readStringList(
    typeof source.VITE_MOCK_USER_ROLES === 'string'
      ? source.VITE_MOCK_USER_ROLES
      : undefined,
  );
  const mockUserPermissions = readStringList(
    typeof source.VITE_MOCK_USER_PERMISSIONS === 'string'
      ? source.VITE_MOCK_USER_PERMISSIONS
      : undefined,
  );
  const mockDelayMs = readMockDelay(
    typeof source.VITE_MOCK_DELAY_MS === 'string'
      ? source.VITE_MOCK_DELAY_MS
      : undefined,
  );
  const maxImportFileSizeBytes = readMaxImportFileSize(
    typeof source.VITE_MAX_IMPORT_FILE_SIZE_BYTES === 'string'
      ? source.VITE_MAX_IMPORT_FILE_SIZE_BYTES
      : undefined,
  );

  return Object.freeze({
    ...(gateway ? { apiGatewayUrl: normalizeGatewayUrl(gateway) } : {}),
    dataMode,
    authClientId,
    appEnv,
    mockScenario,
    mockAuthScenario,
    mockUserRoles,
    mockUserPermissions,
    mockDelayMs,
    maxImportFileSizeBytes,
  });
}

let cachedConfig: FrontendConfig | undefined;

export function getFrontendConfig(): FrontendConfig {
  cachedConfig ??= loadFrontendConfig();
  return cachedConfig;
}
