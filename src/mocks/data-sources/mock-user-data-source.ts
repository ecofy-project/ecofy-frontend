import type { UserDataSource } from '../../features/users/data-sources/user-data-source';
import type {
  CreateUserConnectionInput,
  UpdateUserPreferencesInput,
  UpdateUserProfileInput,
  UserConnection,
  UserPreferences,
  UserProfile,
} from '../../features/users/types/user';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockUserDataSourceOptions = {
  scenario: MockScenario;
  delayMs: number;
};

export class MockUserDataSource implements UserDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockUserDataSourceOptions,
  ) {}

  private async prepare(userId: string) {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;

    await simulateMockLatency(delay);
    if (!userId.trim()) {
      throw new ApiErrorException({
        code: 'USER_ID_REQUIRED',
        message: 'A sessão atual não possui um usuário associado.',
        status: 400,
      });
    }

    if (this.options.scenario === 'error') {
      throw new ApiErrorException({
        code: 'USER_DATA_UNAVAILABLE',
        message: 'Não foi possível carregar os dados da conta.',
        status: 503,
      });
    }
  }

  async getProfile(userId: string): Promise<UserProfile> {
    await this.prepare(userId);
    const profile = this.store.getState().profile;
    return this.options.scenario === 'profile-incomplete'
      ? Object.freeze({ ...profile, phone: '' })
      : Object.freeze({ ...profile });
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    await this.prepare(userId);
    const state = this.store.update((draft) => {
      draft.profile = { ...input };
      draft.user = {
        ...draft.user,
        fullName: input.fullName,
        email: input.email,
      };
    });
    return Object.freeze({ ...state.profile });
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    await this.prepare(userId);
    return this.options.scenario === 'preferences-empty'
      ? Object.freeze({})
      : Object.freeze({ ...this.store.getState().preferences });
  }

  async updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferences> {
    await this.prepare(userId);
    const state = this.store.update((draft) => {
      draft.preferences = { ...input.preferences };
    });
    return Object.freeze({ ...state.preferences });
  }

  async listConnections(userId: string): Promise<readonly UserConnection[]> {
    await this.prepare(userId);
    if (
      this.options.scenario === 'connections-empty' ||
      this.options.scenario === 'empty'
    ) {
      return Object.freeze([]);
    }

    const connections = this.store.getState().connections;
    return Object.freeze(
      connections.map((connection) => Object.freeze({ ...connection })),
    );
  }

  async createConnection(
    userId: string,
    input: CreateUserConnectionInput,
  ): Promise<UserConnection> {
    await this.prepare(userId);
    const connection = Object.freeze({
      type: input.type,
      provider: input.provider,
    });
    this.store.update((state) => {
      state.connections.push(connection);
    });
    return connection;
  }
}
