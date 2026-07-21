import type { UserDataSource } from '../data-sources/user-data-source';
import type {
  CreateUserConnectionInput,
  UpdateUserPreferencesInput,
  UpdateUserProfileInput,
} from '../types/user';

export class UserService {
  constructor(private readonly dataSource: UserDataSource) {}

  getProfile(userId: string) {
    return this.dataSource.getProfile(userId);
  }

  updateProfile(userId: string, input: UpdateUserProfileInput) {
    return this.dataSource.updateProfile(userId, input);
  }

  getPreferences(userId: string) {
    return this.dataSource.getPreferences(userId);
  }

  updatePreferences(userId: string, input: UpdateUserPreferencesInput) {
    return this.dataSource.updatePreferences(userId, input);
  }

  listConnections(userId: string) {
    return this.dataSource.listConnections(userId);
  }

  createConnection(userId: string, input: CreateUserConnectionInput) {
    return this.dataSource.createConnection(userId, input);
  }
}
