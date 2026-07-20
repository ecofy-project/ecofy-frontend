import type { MockAuthScenario } from '../../services/config/env';
import {
  adaptApiError,
  ApiErrorException,
} from '../../services/errors/api-error';
import type { AuthDataSource } from '../../features/auth/data-sources/auth-data-source';
import type {
  AuthenticatedUser,
  AuthenticationResult,
  ConfirmEmailInput,
  LoginCredentials,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  RegisterUserInput,
} from '../../features/auth/types/auth';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockAuthDataSourceOptions = {
  scenario: MockAuthScenario;
  delayMs: number;
  roles?: readonly string[];
  permissions?: readonly string[];
};

function throwMockError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Array<{ field: string; message: string }>,
): never {
  throw new ApiErrorException(
    adaptApiError(
      {
        status,
        error: code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
      { status },
    ),
  );
}

function throwScenarioError(scenario: MockAuthScenario): void {
  if (scenario === 'rate_limited') {
    throwMockError(
      429,
      'RATE_LIMITED',
      'Muitas tentativas foram feitas. Aguarde antes de tentar novamente.',
    );
  }

  if (scenario === 'server_error') {
    throwMockError(
      500,
      'AUTH_SERVICE_UNAVAILABLE',
      'Detalhe interno exclusivamente mock.',
    );
  }

  if (scenario === 'invalid_request') {
    throwMockError(
      400,
      'INVALID_REQUEST',
      'Revise os dados informados e tente novamente.',
    );
  }
}

export class MockAuthDataSource implements AuthDataSource {
  constructor(private readonly options: MockAuthDataSourceOptions) {}

  async login(
    credentials: LoginCredentials,
  ): Promise<AuthenticationResult> {
    await simulateMockLatency(this.options.delayMs);

    if (this.options.scenario === 'invalid_credentials') {
      throwMockError(
        401,
        'INVALID_CREDENTIALS',
        'E-mail/usuário ou senha inválidos.',
      );
    }

    throwScenarioError(this.options.scenario);

    const email = credentials.username.includes('@')
      ? credentials.username
      : 'pessoa.mock@ecofy.local';

    return {
      tokens: {
        tokenType: 'Bearer',
        accessToken: 'mock-access-token-for-local-development',
        refreshToken: 'mock-refresh-token-for-local-development',
        expiresIn: 3600,
      },
      currentUser: {
        id: 'mock-user-id',
        email,
        fullName: 'Pessoa EcoFy (Mock)',
        status: 'MOCK_ACTIVE',
        emailVerified: true,
        roles: this.options.roles ?? [],
        permissions: this.options.permissions ?? [],
      },
    };
  }

  async register(input: RegisterUserInput): Promise<void> {
    await simulateMockLatency(this.options.delayMs);

    if (this.options.scenario === 'invalid_request') {
      throwMockError(
        400,
        'VALIDATION_ERROR',
        'Revise os dados informados e tente novamente.',
        [{ field: 'email', message: 'Use outro e-mail para este cenário.' }],
      );
    }

    void input;
    throwScenarioError(this.options.scenario);
  }

  async confirmEmail(input: ConfirmEmailInput): Promise<void> {
    void input;
    await simulateMockLatency(this.options.delayMs);
    throwScenarioError(this.options.scenario);
  }

  async requestPasswordReset(
    input: PasswordResetRequestInput,
  ): Promise<void> {
    void input;
    await simulateMockLatency(this.options.delayMs);
    throwScenarioError(this.options.scenario);
  }

  async confirmPasswordReset(
    input: PasswordResetConfirmInput,
  ): Promise<void> {
    void input;
    await simulateMockLatency(this.options.delayMs);
    throwScenarioError(this.options.scenario);
  }

  async getCurrentUser(): Promise<AuthenticatedUser> {
    await simulateMockLatency(this.options.delayMs);
    throwScenarioError(this.options.scenario);

    return {
      id: 'mock-user-id',
      email: 'pessoa.mock@ecofy.local',
      fullName: 'Pessoa EcoFy (Mock)',
      status: 'MOCK_ACTIVE',
      emailVerified: true,
      roles: this.options.roles ?? [],
      permissions: this.options.permissions ?? [],
    };
  }
}
