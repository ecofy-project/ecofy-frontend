export type UserProfile = Readonly<{
  fullName: string;
  email: string;
  phone: string;
}>;

export type UpdateUserProfileInput = UserProfile;

export type UserPreferences = Readonly<Record<string, string>>;

export type UpdateUserPreferencesInput = Readonly<{
  preferences: UserPreferences;
}>;

export const connectionTypes = [
  'BANK_API',
  'CSV_IMPORT',
  'OPEN_FINANCE',
  'MANUAL',
] as const;

export type ConnectionType = (typeof connectionTypes)[number];

export const connectionProviders = [
  'ITAU',
  'NUBANK',
  'BRADESCO',
  'SANTANDER',
  'CAIXA',
  'BANCO_DO_BRASIL',
  'INTER',
  'C6',
  'OTHER',
] as const;

export type ConnectionProvider = (typeof connectionProviders)[number];

export type UserConnection = Readonly<{
  type: string;
  provider: string;
}>;

export type CreateUserConnectionInput = Readonly<{
  type: ConnectionType;
  provider: ConnectionProvider;
}>;
