import { useEffect, type ReactNode } from 'react';
import { ErrorState } from '../components/ui';
import { FoundationPage } from '../features/foundation/pages/FoundationPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { BudgetsPage } from '../features/budgets/pages/BudgetsPage';
import { CategoriesPage } from '../features/categories/pages/CategoriesPage';
import { ManualCategorizationPage } from '../features/categories/pages/ManualCategorizationPage';
import { SuggestionsPage } from '../features/categories/pages/SuggestionsPage';
import { GoalsPage } from '../features/goals/pages/GoalsPage';
import { ImportsPage } from '../features/imports/pages/ImportsPage';
import { InsightsPage } from '../features/insights/pages/InsightsPage';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { ConfirmEmailPage } from '../features/auth/pages/ConfirmEmailPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { ConnectionsPage } from '../features/users/pages/ConnectionsPage';
import { PreferencesPage } from '../features/users/pages/PreferencesPage';
import { ProfilePage } from '../features/users/pages/ProfilePage';
import { AppShell } from './layout/AppShell';
import { navigationGroups } from './layout/navigation';
import { AppProviders } from './providers/AppProviders';
import {
  ProtectedRoute,
  PublicRoute,
} from './routing/route-guards';
import { usePathname } from './routing/router';

const routeSubtitles: Record<string, string> = {
  '/': 'Seu resumo financeiro em um só lugar',
  '/design-system': 'Fundamentos e componentes da interface',
  '/imports': 'Envie e acompanhe suas movimentações',
  '/categories': 'Organize transações com categorias e regras',
  '/categorization/manual': 'Aplique uma categoria diretamente em uma transação',
  '/categorization/suggestions': 'Consulte as sugestões registradas pelo serviço',
  '/budgets': 'Acompanhe seus limites por categoria',
  '/goals': 'Construa seus objetivos financeiros',
  '/insights': 'Análises para decisões mais conscientes',
  '/notifications': 'Atualizações importantes da sua conta',
  '/profile': 'Seus dados pessoais e de acesso',
  '/preferences': 'Ajuste a experiência do EcoFy',
  '/connections': 'Gerencie integrações da sua conta',
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
    content = <DashboardPage />;
  } else if (pathname === '/design-system') {
    content = <FoundationPage />;
  } else if (pathname === '/profile') {
    content = <ProfilePage />;
  } else if (pathname === '/preferences') {
    content = <PreferencesPage />;
  } else if (pathname === '/connections') {
    content = <ConnectionsPage />;
  } else if (pathname === '/imports') {
    content = <ImportsPage />;
  } else if (pathname === '/categories') {
    content = <CategoriesPage />;
  } else if (pathname === '/categorization/manual') {
    content = <ManualCategorizationPage />;
  } else if (pathname === '/categorization/suggestions') {
    content = <SuggestionsPage />;
  } else if (pathname === '/budgets') {
    content = <BudgetsPage />;
  } else if (pathname === '/goals') {
    content = <GoalsPage />;
  } else if (pathname === '/insights') {
    content = <InsightsPage />;
  } else if (pathname === '/notifications') {
    content = <NotificationsPage />;
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
      <AppShell pageSubtitle={routeSubtitles[pathname]} pageTitle={title}>
        {content}
      </AppShell>
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
