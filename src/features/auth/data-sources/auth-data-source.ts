import type {
  AuthenticatedUser,
  AuthenticationResult,
  ConfirmEmailInput,
  LoginCredentials,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  RegisterUserInput,
} from '../types/auth';

export interface AuthDataSource {
  login(credentials: LoginCredentials): Promise<AuthenticationResult>;
  register(input: RegisterUserInput): Promise<void>;
  confirmEmail(input: ConfirmEmailInput): Promise<void>;
  requestPasswordReset(input: PasswordResetRequestInput): Promise<void>;
  confirmPasswordReset(input: PasswordResetConfirmInput): Promise<void>;
  getCurrentUser(): Promise<AuthenticatedUser>;
}
