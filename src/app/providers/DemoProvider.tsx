import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { demoCredentials } from '../../mocks/demo/demo-seed';
import { useAppDependencies } from './AppDependenciesProvider';
import { useSession } from './SessionProvider';
import { useTheme } from './ThemeProvider';

/**
 * `NotificationResponse` não publica marcação de leitura, então não existe
 * contagem de não lidas — nem no Mock Mode, que reproduz o mesmo contrato.
 */
type DemoContextValue = Readonly<{
  enabled: boolean;
  credentials: typeof demoCredentials;
  enterDemo: () => Promise<void>;
  resetDemo: () => void;
}>;

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { demoEnabled, demoStore } = useAppDependencies();
  const { login, logout } = useSession();
  const { setPreference } = useTheme();

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
      credentials: demoCredentials,
      enterDemo,
      resetDemo,
    }),
    [demoEnabled, enterDemo, resetDemo],
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
