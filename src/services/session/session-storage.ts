import type {
  AuthenticatedUser,
  TokenResponse,
} from '../../features/auth/types/auth';

export type PersistedSession = {
  tokens: TokenResponse;
  currentUser: AuthenticatedUser | null;
};

export interface SessionPersistence {
  read(): PersistedSession | null;
  write(session: PersistedSession): void;
  clear(): void;
}

const storageKey = 'ecofy.auth.session.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.fullName === 'string' &&
    typeof value.status === 'string' &&
    typeof value.emailVerified === 'boolean' &&
    isStringArray(value.roles) &&
    isStringArray(value.permissions)
  );
}

function parsePersistedSession(value: string): PersistedSession | null {
  try {
    const session: unknown = JSON.parse(value);

    if (
      !isRecord(session) ||
      !isRecord(session.tokens) ||
      typeof session.tokens.tokenType !== 'string' ||
      typeof session.tokens.accessToken !== 'string' ||
      typeof session.tokens.refreshToken !== 'string' ||
      typeof session.tokens.expiresIn !== 'number'
    ) {
      return null;
    }

    const currentUser = session.currentUser;

    if (
      currentUser !== null &&
      !isAuthenticatedUser(currentUser)
    ) {
      return null;
    }

    return {
      tokens: {
        tokenType: session.tokens.tokenType,
        accessToken: session.tokens.accessToken,
        refreshToken: session.tokens.refreshToken,
        expiresIn: session.tokens.expiresIn,
      },
      currentUser:
        currentUser === null
          ? null
          : {
              id: currentUser.id,
              email: currentUser.email,
              fullName: currentUser.fullName,
              status: currentUser.status,
              emailVerified: currentUser.emailVerified,
              roles: currentUser.roles,
              permissions: currentUser.permissions,
            },
    };
  } catch {
    return null;
  }
}

export function createSessionStoragePersistence(): SessionPersistence {
  let memoryFallback: PersistedSession | null = null;

  return {
    read() {
      try {
        const storedValue = window.sessionStorage.getItem(storageKey);
        return storedValue
          ? (parsePersistedSession(storedValue) ?? memoryFallback)
          : memoryFallback;
      } catch {
        return memoryFallback;
      }
    },
    write(session) {
      memoryFallback = session;

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(session));
      } catch {
        // O fallback em memória mantém a sessão enquanto esta aba existir.
      }
    },
    clear() {
      memoryFallback = null;

      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // A limpeza em memória ainda garante logout para a aplicação atual.
      }
    },
  };
}
