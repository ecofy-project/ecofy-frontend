import { useState, type ReactNode } from 'react';
import {
  Drawer,
  Dropdown,
  DropdownItem,
  Icon,
  IconButton,
  Tooltip,
} from '../../components/ui';
import { useSession } from '../providers/SessionProvider';
import { AppLink, usePathname } from '../routing/router';
import { navigate } from '../routing/router';
import { Brand } from './Brand';
import { ThemeMenu } from './ThemeMenu';
import {
  mobileMoreNavigation,
  mobilePrimaryNavigation,
  navigationGroups,
  type NavigationItem,
} from './navigation';

type AppShellProps = {
  children: ReactNode;
  pageTitle: string;
};

function NavLink({
  collapsed,
  item,
  pathname,
  onNavigate,
}: {
  collapsed?: boolean;
  item: NavigationItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const link = (
    <AppLink
      aria-current={pathname === item.path ? 'page' : undefined}
      className="nav-item"
      onClick={onNavigate}
      to={item.path}
    >
      <span className="nav-item__icon">
        <Icon name={item.icon} size={19} />
      </span>
      <span className="nav-item__label">{item.label}</span>
    </AppLink>
  );

  return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link;
}

function Sidebar({
  collapsed,
  onToggle,
  pathname,
}: {
  collapsed: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  return (
    <aside
      aria-label="Navegação principal"
      className="sidebar"
      data-collapsed={collapsed}
    >
      <AppLink aria-label="EcoFy — início" className="sidebar__brand" to="/">
        <Brand />
      </AppLink>
      <nav className="sidebar__nav">
        {navigationGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-group__label">{group.label}</span>
            <ul className="nav-group__list">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    collapsed={collapsed}
                    item={item}
                    pathname={pathname}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="sidebar__footer">
        <IconButton
          icon="collapse"
          label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          onClick={onToggle}
        />
      </div>
    </aside>
  );
}

function Topbar({ pageTitle }: { pageTitle: string }) {
  const { currentUser, logout } = useSession();
  const displayName = currentUser?.fullName || currentUser?.email || 'Conta';
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'EF';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="topbar">
      <div className="topbar__context">
        <span className="topbar__eyebrow">EcoFy / Fundação</span>
        <span className="topbar__title">{pageTitle}</span>
      </div>
      <div className="topbar__actions">
        <ThemeMenu />
        <Tooltip content="Notificações serão conectadas em uma etapa futura">
          <span className="topbar__notifications">
            <IconButton
              disabled
              icon="bell"
              label="Notificações ainda não disponíveis"
            />
          </span>
        </Tooltip>
        <Dropdown
          label="Conta"
          trigger={
            <button
              aria-label={`Abrir menu da conta de ${displayName}`}
              className="profile-menu__trigger"
              type="button"
            >
              <span className="profile-menu__avatar">{initials}</span>
              <span className="profile-menu__copy">
                <strong>{displayName}</strong>
                <small>{currentUser?.email}</small>
              </span>
              <Icon name="chevron-down" size={16} />
            </button>
          }
        >
          <DropdownItem onSelect={handleLogout}>
            <Icon name="chevron-left" size={17} />
            Sair da conta
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

function BottomNavigation({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreIsCurrent = mobileMoreNavigation.some(
    (item) => item.path === pathname,
  );

  return (
    <>
      <nav aria-label="Navegação móvel" className="bottom-nav">
        <ul className="bottom-nav__list">
          {mobilePrimaryNavigation.map((item) => (
            <li key={item.path}>
              <AppLink
                aria-current={pathname === item.path ? 'page' : undefined}
                className="bottom-nav__item"
                to={item.path}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </AppLink>
            </li>
          ))}
          <li>
            <button
              aria-current={moreIsCurrent ? 'page' : undefined}
              className="bottom-nav__item"
              onClick={() => setMoreOpen(true)}
              type="button"
            >
              <Icon name="more" size={20} />
              <span>Mais</span>
            </button>
          </li>
        </ul>
      </nav>
      <Drawer
        onClose={() => setMoreOpen(false)}
        open={moreOpen}
        title="Mais opções"
      >
        <ul className="mobile-more__list">
          {mobileMoreNavigation.map((item) => (
            <li key={item.path}>
              <NavLink
                item={item}
                onNavigate={() => setMoreOpen(false)}
                pathname={pathname}
              />
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}

export function AppShell({ children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
        pathname={pathname}
      />
      <div className="app-frame">
        <Topbar pageTitle={pageTitle} />
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNavigation pathname={pathname} />
    </div>
  );
}
