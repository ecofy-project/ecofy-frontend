import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { LoginCredentials } from '../../features/auth/types/auth';
import type { SessionSnapshot } from '../../services/session/session-store';
import { useAppDependencies } from './AppDependenciesProvider';

type SessionContextValue = SessionSnapshot & {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
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
    sessionStore.clearSession();
  }, [sessionStore]);

  const value = useMemo(
    () => ({ ...snapshot, login, logout }),
    [login, logout, snapshot],
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
