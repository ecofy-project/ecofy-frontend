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

export interface AuthDataSource {
  login(credentials: LoginCredentials): Promise<AuthenticationResult>;
  register(input: RegisterUserInput): Promise<void>;
  confirmEmail(input: ConfirmEmailInput): Promise<void>;
  requestPasswordReset(input: PasswordResetRequestInput): Promise<void>;
  confirmPasswordReset(input: PasswordResetConfirmInput): Promise<void>;
  getCurrentUser(): Promise<AuthenticatedUser>;
  /** Renova o par de tokens a partir do refresh token vigente. */
  refresh(refreshToken: string): Promise<TokenResponse>;
  /** Revoga o refresh token no servidor. Encerramento de sessão. */
  revoke(refreshToken: string): Promise<void>;
}
