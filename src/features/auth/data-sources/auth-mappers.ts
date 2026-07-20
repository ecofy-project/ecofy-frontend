import { ApiErrorException } from '../../../services/errors/api-error';
import type {
  AuthenticatedUser,
  TokenResponse,
} from '../types/auth';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_AUTH_RESPONSE',
    message: 'A resposta de autenticação recebida é incompatível.',
    status: 502,
  });
}

export function mapTokenResponse(payload: unknown): TokenResponse {
  if (
    !isRecord(payload) ||
    !isNonEmptyString(payload.tokenType) ||
    !isNonEmptyString(payload.accessToken) ||
    !isNonEmptyString(payload.refreshToken) ||
    typeof payload.expiresIn !== 'number' ||
    !Number.isFinite(payload.expiresIn) ||
    payload.expiresIn < 0
  ) {
    incompatibleResponse();
  }

  return {
    tokenType: payload.tokenType,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn,
  };
}

export function mapAuthenticatedUser(payload: unknown): AuthenticatedUser {
  if (
    !isRecord(payload) ||
    !isNonEmptyString(payload.id) ||
    !isNonEmptyString(payload.email) ||
    !isNonEmptyString(payload.fullName) ||
    !isNonEmptyString(payload.status) ||
    typeof payload.emailVerified !== 'boolean' ||
    !isStringArray(payload.roles) ||
    !isStringArray(payload.permissions)
  ) {
    incompatibleResponse();
  }

  return {
    id: payload.id,
    email: payload.email,
    fullName: payload.fullName,
    status: payload.status,
    emailVerified: payload.emailVerified,
    roles: payload.roles,
    permissions: payload.permissions,
  };
}
