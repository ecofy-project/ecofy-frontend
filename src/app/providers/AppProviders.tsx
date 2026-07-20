import type { ReactNode } from 'react';
import { ToastProvider } from '../../components/ui';
import { AppDependenciesProvider } from './AppDependenciesProvider';
import { SessionProvider } from './SessionProvider';
import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppDependenciesProvider>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </AppDependenciesProvider>
    </ThemeProvider>
  );
}
