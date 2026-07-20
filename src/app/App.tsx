import { useEffect, type ReactNode } from 'react';
import { ErrorState } from '../components/ui';
import { FoundationPage } from '../features/foundation/pages/FoundationPage';
import { ConfirmEmailPage } from '../features/auth/pages/ConfirmEmailPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { AppShell } from './layout/AppShell';
import { navigationGroups } from './layout/navigation';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { AppProviders } from './providers/AppProviders';
import {
  ProtectedRoute,
  PublicRoute,
} from './routing/route-guards';
import { usePathname } from './routing/router';

const placeholderDescriptions: Record<string, string> = {
  '/imports':
    'A navegação e o espaço da feature estão prontos; a importação funcional permanece fora desta etapa.',
  '/categories':
    'A navegação e o espaço da feature estão prontos; categorias e regras serão implementadas posteriormente.',
  '/budgets':
    'A navegação e o espaço da feature estão prontos; nenhum orçamento ou contrato foi antecipado.',
  '/goals':
    'A navegação e o espaço da feature estão prontos; metas e cálculos permanecem fora desta etapa.',
  '/insights':
    'A navegação e o espaço da feature estão prontos, inclusive para estados degradados futuros.',
  '/notifications':
    'A navegação e o espaço da feature estão prontos; não existem chamadas de notificação nesta etapa.',
  '/profile':
    'A navegação e o espaço da feature estão prontos; dados de perfil ainda não são solicitados.',
  '/preferences':
    'O tema local já funciona; preferências integradas à conta pertencem a uma etapa futura.',
  '/connections':
    'A navegação e o espaço da feature estão prontos; nenhuma conexão externa foi criada.',
};

const routeTitles = Object.fromEntries(
  navigationGroups
    .flatMap((group) => group.items)
    .map((item) => [item.path, item.label]),
);

const publicRouteTitles: Record<string, string> = {
  '/login': 'Entrar',
  '/register': 'Criar conta',
  '/forgot-password': 'Esqueci minha senha',
  '/reset-password': 'Redefinir senha',
  '/confirm-email': 'Confirmar e-mail',
  '/auth/reset-password': 'Redefinir senha',
  '/auth/confirm-email': 'Confirmar e-mail',
};

function PublicPage({ pathname }: { pathname: string }) {
  let page: ReactNode;

  switch (pathname) {
    case '/login':
      page = <LoginPage />;
      break;
    case '/register':
      page = <RegisterPage />;
      break;
    case '/forgot-password':
      page = <ForgotPasswordPage />;
      break;
    case '/reset-password':
    case '/auth/reset-password':
      page = <ResetPasswordPage />;
      break;
    case '/confirm-email':
    case '/auth/confirm-email':
      page = <ConfirmEmailPage />;
      break;
    default:
      page = null;
  }

  return <PublicRoute>{page}</PublicRoute>;
}

function ProtectedPage({ pathname }: { pathname: string }) {
  const title = routeTitles[pathname] ?? 'Página não encontrada';
  let content: ReactNode;

  if (pathname === '/') {
    content = <FoundationPage />;
  } else if (placeholderDescriptions[pathname]) {
    content = (
      <PlaceholderPage
        description={placeholderDescriptions[pathname]}
        title={title}
      />
    );
  } else {
    content = (
      <ErrorState
        description="A rota informada não existe nesta fundação."
        title="Página não encontrada"
      />
    );
  }

  return (
    <ProtectedRoute>
      <AppShell pageTitle={title}>{content}</AppShell>
    </ProtectedRoute>
  );
}

function RoutedApplication() {
  const pathname = usePathname();
  const title =
    publicRouteTitles[pathname] ??
    routeTitles[pathname] ??
    'Página não encontrada';
  const isPublicRoute = pathname in publicRouteTitles;

  useEffect(() => {
    document.title = `${title} · EcoFy`;
  }, [title]);

  return isPublicRoute ? (
    <PublicPage pathname={pathname} />
  ) : (
    <ProtectedPage pathname={pathname} />
  );
}

export function App() {
  return (
    <AppProviders>
      <RoutedApplication />
    </AppProviders>
  );
}
