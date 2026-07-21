import type {
  CreateUserConnectionInput,
  UpdateUserPreferencesInput,
  UpdateUserProfileInput,
  UserConnection,
  UserPreferences,
  UserProfile,
} from '../types/user';

export interface UserDataSource {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile>;
  getPreferences(userId: string): Promise<UserPreferences>;
  updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferences>;
  listConnections(userId: string): Promise<readonly UserConnection[]>;
  createConnection(
    userId: string,
    input: CreateUserConnectionInput,
  ): Promise<UserConnection>;
}
