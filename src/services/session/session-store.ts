import type {
  AuthenticationResult,
  AuthenticatedUser,
  TokenResponse,
} from '../../features/auth/types/auth';
import type {
  PersistedSession,
  SessionPersistence,
} from './session-storage';

export type SessionSnapshot = Readonly<{
  currentUser: AuthenticatedUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: true;
}>;

type SessionListener = () => void;

const anonymousSnapshot: SessionSnapshot = Object.freeze({
  currentUser: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: true,
});

function createSnapshot(
  persistedSession: PersistedSession | null,
): SessionSnapshot {
  if (!persistedSession?.tokens.accessToken) {
    return anonymousSnapshot;
  }

  return Object.freeze({
    currentUser: persistedSession.currentUser,
    accessToken: persistedSession.tokens.accessToken,
    refreshToken: persistedSession.tokens.refreshToken,
    isAuthenticated: true,
    isInitialized: true,
  });
}

export class SessionStore {
  private readonly listeners = new Set<SessionListener>();
  private persistedSession: PersistedSession | null;
  private snapshot: SessionSnapshot;

  constructor(private readonly persistence: SessionPersistence) {
    this.persistedSession = this.persistence.read();
    this.snapshot = createSnapshot(this.persistedSession);
  }

  getSnapshot = () => this.snapshot;

  subscribe = (listener: SessionListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getAccessToken = () => this.snapshot.accessToken;

  getRefreshToken = () => this.snapshot.refreshToken;

  /**
   * Identificador do usuário autenticado. Serve para os contratos que ainda
   * exigem `userId` explícito; a autorização real permanece no backend, a partir
   * do JWT.
   */
  getUserId = () => this.snapshot.currentUser?.id ?? null;

  /**
   * Substitui os tokens preservando o usuário atual. Usado após uma renovação
   * bem-sucedida, sem exigir uma nova consulta ao perfil.
   */
  updateTokens(tokens: TokenResponse) {
    if (!this.persistedSession) {
      return;
    }

    this.persistedSession = {
      ...this.persistedSession,
      tokens,
    };
    this.persistence.write(this.persistedSession);
    this.setSnapshot(createSnapshot(this.persistedSession));
  }

  establishSession(result: AuthenticationResult) {
    const persistedSession: PersistedSession = {
      tokens: result.tokens,
      currentUser: result.currentUser ?? null,
    };

    this.persistedSession = persistedSession;
    this.persistence.write(persistedSession);
    this.setSnapshot(createSnapshot(persistedSession));
  }

  setCurrentUser(currentUser: AuthenticatedUser) {
    if (!this.persistedSession) {
      return;
    }

    this.persistedSession = {
      ...this.persistedSession,
      currentUser,
    };
    this.persistence.write(this.persistedSession);
    this.setSnapshot(createSnapshot(this.persistedSession));
  }

  clearSession() {
    this.persistedSession = null;
    this.persistence.clear();
    this.setSnapshot(anonymousSnapshot);
  }

  private setSnapshot(snapshot: SessionSnapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}
