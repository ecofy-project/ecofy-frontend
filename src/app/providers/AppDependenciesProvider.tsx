import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import {
  createAppDependencies,
  type AppDependencies,
} from '../config/create-app-dependencies';

const AppDependenciesContext = createContext<AppDependencies | null>(null);

export function AppDependenciesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dependencies] = useState(createAppDependencies);

  return (
    <AppDependenciesContext.Provider value={dependencies}>
      {children}
    </AppDependenciesContext.Provider>
  );
}

export function useAppDependencies() {
  const context = useContext(AppDependenciesContext);

  if (!context) {
    throw new Error(
      'useAppDependencies deve ser utilizado dentro de AppDependenciesProvider.',
    );
  }

  return context;
}
