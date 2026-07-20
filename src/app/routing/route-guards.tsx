import { useEffect, type ReactNode } from 'react';
import { useSession } from '../providers/SessionProvider';
import { navigate } from './router';

function RouteRedirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to);
  }, [to]);

  return (
    <div aria-live="polite" className="route-redirect" role="status">
      Redirecionando…
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();

  return isAuthenticated ? children : <RouteRedirect to="/login" />;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();

  return isAuthenticated ? <RouteRedirect to="/" /> : children;
}

type AccessGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type RoleGuardProps = AccessGuardProps & {
  requiredRoles: readonly string[];
};

export function RoleGuard({
  children,
  fallback = null,
  requiredRoles,
}: RoleGuardProps) {
  const { currentUser } = useSession();
  const hasEveryRole =
    currentUser !== null &&
    requiredRoles.every((role) => currentUser.roles.includes(role));

  return hasEveryRole ? children : fallback;
}

type PermissionGuardProps = AccessGuardProps & {
  requiredPermissions: readonly string[];
};

export function PermissionGuard({
  children,
  fallback = null,
  requiredPermissions,
}: PermissionGuardProps) {
  const { currentUser } = useSession();
  const hasEveryPermission =
    currentUser !== null &&
    requiredPermissions.every((permission) =>
      currentUser.permissions.includes(permission),
    );

  return hasEveryPermission ? children : fallback;
}
