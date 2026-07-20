export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterUserInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type ConfirmEmailInput = {
  token: string;
};

export type PasswordResetRequestInput = {
  email: string;
};

export type PasswordResetConfirmInput = {
  token: string;
  newPassword: string;
};

export type TokenResponse = {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  emailVerified: boolean;
  roles: readonly string[];
  permissions: readonly string[];
};

export type AuthenticationResult = {
  tokens: TokenResponse;
  currentUser?: AuthenticatedUser;
};
