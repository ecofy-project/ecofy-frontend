import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { LoginCredentials } from '../../features/auth/types/auth';
import type { UserProfile } from '../../features/users/types/user';
import type { SessionSnapshot } from '../../services/session/session-store';
import { useAppDependencies } from './AppDependenciesProvider';

type SessionContextValue = SessionSnapshot & {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateCurrentUserDetails: (
    details: Pick<UserProfile, 'fullName' | 'email'>,
  ) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { authService, sessionStore } = useAppDependencies();
  const snapshot = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getSnapshot,
  );

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await authService.login(credentials);
      sessionStore.establishSession(result);

      if (!result.currentUser) {
        try {
          const currentUser = await authService.getCurrentUser();
          sessionStore.setCurrentUser(currentUser);
        } catch (error) {
          sessionStore.clearSession();
          throw error;
        }
      }
    },
    [authService, sessionStore],
  );

  const logout = useCallback(() => {
    /* Revoga o refresh token no servidor sem bloquear o encerramento local: a
       sessão é limpa imediatamente, independentemente do resultado da revogação. */
    const refreshToken = sessionStore.getRefreshToken();

    if (refreshToken) {
      void authService.revoke(refreshToken).catch(() => undefined);
    }

    sessionStore.clearSession();
  }, [authService, sessionStore]);

  const updateCurrentUserDetails = useCallback(
    (details: Pick<UserProfile, 'fullName' | 'email'>) => {
      if (!snapshot.currentUser) {
        return;
      }

      sessionStore.setCurrentUser({
        ...snapshot.currentUser,
        fullName: details.fullName,
        email: details.email,
      });
    },
    [sessionStore, snapshot.currentUser],
  );

  const value = useMemo(
    () => ({ ...snapshot, login, logout, updateCurrentUserDetails }),
    [login, logout, snapshot, updateCurrentUserDetails],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession deve ser utilizado dentro de SessionProvider.');
  }

  return context;
}
