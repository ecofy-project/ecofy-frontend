import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import { normalizePage } from '../../../services/pagination/pagination';
import type {
  CreateUserConnectionInput,
  UpdateUserPreferencesInput,
  UpdateUserProfileInput,
  UserConnection,
  UserPreferences,
  UserProfile,
} from '../types/user';
import type { UserDataSource } from './user-data-source';
import {
  mapUserConnection,
  mapUserPreferences,
  mapUserProfile,
} from './user-mappers';

/**
 * Prefixo versionado do API Gateway. A rota `/api/v1/**` reescreve para o mesmo
 * downstream da rota legada (`/users/api/users/v1`), com CircuitBreaker, Retry e
 * fallback que a rota legada não tem.
 */
const usersGatewayPath = '/api/v1/users';

/**
 * Teto de página do `ms-users` (`max-size`). A tela de conexões apenas lista
 * tudo, sem filtro nem paginação própria, então uma página cheia basta. Um
 * usuário tem poucas conexões, bem abaixo desse teto.
 */
const connectionsServerMaxSize = 100;

function userPath(resource: 'profile' | 'preferences', userId: string) {
  return `${usersGatewayPath}/${resource}/${encodeURIComponent(userId)}`;
}

export class ApiUserDataSource implements UserDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const response = await this.httpClient.request<unknown>(
      userPath('profile', userId),
    );

    return mapUserProfile(response.data);
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    const response = await this.httpClient.request<unknown>(
      userPath('profile', userId),
      {
        method: 'PUT',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          fullName: input.fullName,
          email: input.email,
          ...(input.phone ? { phone: input.phone } : {}),
        },
      },
    );

    return mapUserProfile(response.data);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const response = await this.httpClient.request<unknown>(
      userPath('preferences', userId),
    );

    return mapUserPreferences(response.data);
  }

  async updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferences> {
    const response = await this.httpClient.request<unknown>(
      userPath('preferences', userId),
      {
        method: 'PUT',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: { preferences: input.preferences },
      },
    );

    return mapUserPreferences(response.data);
  }

  async listConnections(userId: string): Promise<readonly UserConnection[]> {
    /* `GET /connections` devolve `PagedResponse<ConnectionResponse>` e lê
       `page`/`size`/`sort` (não `limit`); `userId` continua obrigatório e é
       validado no servidor. A resposta é normalizada e reduzida ao conteúdo. */
    const response = await this.httpClient.request<unknown>(
      `${usersGatewayPath}/connections`,
      { query: { userId, size: connectionsServerMaxSize } },
    );

    return normalizePage(response.data, mapUserConnection).content;
  }

  async createConnection(
    userId: string,
    input: CreateUserConnectionInput,
  ): Promise<UserConnection> {
    const response = await this.httpClient.request<unknown>(
      `${usersGatewayPath}/connections`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          userId,
          type: input.type,
          provider: input.provider,
        },
      },
    );

    return mapUserConnection(response.data);
  }
}
