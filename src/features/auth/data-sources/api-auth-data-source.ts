import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import type {
  AuthenticatedUser,
  AuthenticationResult,
  ConfirmEmailInput,
  LoginCredentials,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  RegisterUserInput,
  TokenResponse,
} from '../types/auth';
import type { AuthDataSource } from './auth-data-source';
import {
  mapAuthenticatedUser,
  mapTokenResponse,
} from './auth-mappers';

export class ApiAuthDataSource implements AuthDataSource {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly clientId?: string,
  ) {}

  async login(
    credentials: LoginCredentials,
  ): Promise<AuthenticationResult> {
    if (!this.clientId) {
      throw new ApiErrorException({
        code: 'AUTH_CLIENT_ID_NOT_CONFIGURED',
        message:
          'O identificador público do cliente de autenticação não está configurado.',
        status: 503,
      });
    }

    const response = await this.httpClient.request<unknown>(
      '/auth/api/auth/token',
      {
        method: 'POST',
        body: {
          clientId: this.clientId,
          username: credentials.username,
          password: credentials.password,
        },
      },
    );

    return { tokens: mapTokenResponse(response.data) };
  }

  async register(input: RegisterUserInput): Promise<void> {
    await this.httpClient.request<unknown>('/auth/api/register', {
      method: 'POST',
      body: {
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
  }

  async confirmEmail(input: ConfirmEmailInput): Promise<void> {
    await this.httpClient.request<unknown>(
      '/auth/api/register/confirm-email',
      {
        method: 'POST',
        body: { token: input.token },
      },
    );
  }

  async requestPasswordReset(
    input: PasswordResetRequestInput,
  ): Promise<void> {
    await this.httpClient.request<void>(
      '/auth/api/password/reset-request',
      {
        method: 'POST',
        body: { email: input.email },
      },
    );
  }

  async confirmPasswordReset(
    input: PasswordResetConfirmInput,
  ): Promise<void> {
    await this.httpClient.request<void>(
      '/auth/api/password/reset-confirm',
      {
        method: 'POST',
        body: {
          token: input.token,
          newPassword: input.newPassword,
        },
      },
    );
  }

  async getCurrentUser(): Promise<AuthenticatedUser> {
    const response = await this.httpClient.request<unknown>(
      '/auth/api/user/me',
    );

    return mapAuthenticatedUser(response.data);
  }

  async refresh(refreshToken: string): Promise<TokenResponse> {
    if (!this.clientId) {
      throw new ApiErrorException({
        code: 'AUTH_CLIENT_ID_NOT_CONFIGURED',
        message:
          'O identificador público do cliente de autenticação não está configurado.',
        status: 503,
      });
    }

    const response = await this.httpClient.request<unknown>(
      '/auth/api/auth/refresh',
      {
        method: 'POST',
        body: {
          clientId: this.clientId,
          refreshToken,
        },
      },
    );

    return mapTokenResponse(response.data);
  }

  async revoke(refreshToken: string): Promise<void> {
    /* `refreshToken: true` indica ao serviço que o token enviado é um refresh
       token e deve ser revogado como tal. */
    await this.httpClient.request<void>('/auth/api/auth/revoke', {
      method: 'POST',
      body: {
        token: refreshToken,
        refreshToken: true,
      },
    });
  }
}
