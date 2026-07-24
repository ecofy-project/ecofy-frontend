import type { AuthDataSource } from '../data-sources/auth-data-source';
import type {
  ConfirmEmailInput,
  LoginCredentials,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  RegisterUserInput,
} from '../types/auth';

export class AuthService {
  constructor(private readonly dataSource: AuthDataSource) {}

  login(credentials: LoginCredentials) {
    return this.dataSource.login(credentials);
  }

  register(input: RegisterUserInput) {
    return this.dataSource.register(input);
  }

  confirmEmail(input: ConfirmEmailInput) {
    return this.dataSource.confirmEmail(input);
  }

  requestPasswordReset(input: PasswordResetRequestInput) {
    return this.dataSource.requestPasswordReset(input);
  }

  confirmPasswordReset(input: PasswordResetConfirmInput) {
    return this.dataSource.confirmPasswordReset(input);
  }

  getCurrentUser() {
    return this.dataSource.getCurrentUser();
  }

  refresh(refreshToken: string) {
    return this.dataSource.refresh(refreshToken);
  }

  revoke(refreshToken: string) {
    return this.dataSource.revoke(refreshToken);
  }
}
