import { ApiErrorException } from '../../../services/errors/api-error';
import type {
  UserConnection,
  UserPreferences,
  UserProfile,
} from '../types/user';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readProfileValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_USER_RESPONSE',
    message: 'A resposta de dados da conta recebida é incompatível.',
    status: 502,
  });
}

export function mapUserProfile(payload: unknown): UserProfile {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  return Object.freeze({
    fullName: readProfileValue(payload, 'fullName'),
    email: readProfileValue(payload, 'email'),
    phone: readProfileValue(payload, 'phone'),
  });
}

export function mapUserPreferences(payload: unknown): UserPreferences {
  if (!isRecord(payload) || !isRecord(payload.preferences)) {
    incompatibleResponse();
  }

  const entries = Object.entries(payload.preferences);

  if (
    entries.some(
      ([key, value]) => !key.trim() || typeof value !== 'string',
    )
  ) {
    incompatibleResponse();
  }

  return Object.freeze(
    Object.fromEntries(
      entries.map(([key, value]) => [key, value as string]),
    ),
  );
}

export function mapUserConnection(payload: unknown): UserConnection {
  if (
    !isRecord(payload) ||
    typeof payload.type !== 'string' ||
    !payload.type.trim() ||
    typeof payload.provider !== 'string' ||
    !payload.provider.trim()
  ) {
    incompatibleResponse();
  }

  return Object.freeze({
    type: payload.type.trim(),
    provider: payload.provider.trim(),
  });
}
