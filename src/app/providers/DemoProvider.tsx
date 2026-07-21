import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { demoCredentials } from '../../mocks/demo/demo-seed';
import { useAppDependencies } from './AppDependenciesProvider';
import { useSession } from './SessionProvider';
import { useTheme } from './ThemeProvider';

type DemoContextValue = Readonly<{
  enabled: boolean;
  unreadCount: number;
  credentials: typeof demoCredentials;
  enterDemo: () => Promise<void>;
  resetDemo: () => void;
}>;

const DemoContext = createContext<DemoContextValue | null>(null);
const subscribeDisabled = () => () => undefined;
const getDisabledSnapshot = () => 0;

export function DemoProvider({ children }: { children: ReactNode }) {
  const { demoEnabled, demoStore } = useAppDependencies();
  const { login, logout } = useSession();
  const { setPreference } = useTheme();
  const unreadCount = useSyncExternalStore(
    demoStore?.subscribe ?? subscribeDisabled,
    demoStore
      ? () =>
          demoStore
            .getState()
            .notifications.filter((notification) => !notification.read).length
      : getDisabledSnapshot,
    getDisabledSnapshot,
  );

  const enterDemo = useCallback(
    () => login(demoCredentials),
    [login],
  );
  const resetDemo = useCallback(() => {
    demoStore?.reset();
    setPreference('system');
    logout();
  }, [demoStore, logout, setPreference]);
  const value = useMemo(
    () => ({
      enabled: demoEnabled,
      unreadCount,
      credentials: demoCredentials,
      enterDemo,
      resetDemo,
    }),
    [demoEnabled, enterDemo, resetDemo, unreadCount],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error('useDemo deve ser utilizado dentro de DemoProvider.');
  }

  return context;
}
