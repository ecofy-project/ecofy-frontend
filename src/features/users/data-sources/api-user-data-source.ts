import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
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
  mapUserConnections,
  mapUserPreferences,
  mapUserProfile,
} from './user-mappers';

const usersGatewayPath = '/users/api/users/v1';

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
    const response = await this.httpClient.request<unknown>(
      `${usersGatewayPath}/connections`,
      { query: { userId, limit: 50 } },
    );

    return mapUserConnections(response.data);
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
