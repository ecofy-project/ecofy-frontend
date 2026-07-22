import { useState, type ReactNode } from 'react';
import {
  Button,
  Drawer,
  Dropdown,
  DropdownItem,
  Icon,
  IconButton,
  Modal,
  Tooltip,
} from '../../components/ui';
import { NotificationDropdown } from '../../features/notifications/components/NotificationDropdown';
import { useDemo } from '../providers/DemoProvider';
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
  pageSubtitle?: string;
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
  const { currentUser } = useSession();
  const { enabled } = useDemo();
  const displayName = currentUser?.fullName || currentUser?.email || 'Conta EcoFy';
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'EF';

  return (
    <aside
      aria-label="Navegação principal"
      className="sidebar"
      data-collapsed={collapsed}
    >
      <AppLink aria-label="EcoFy — início" className="sidebar__brand" to="/">
        <Brand />
        {enabled ? <span className="demo-mode-badge">Demo</span> : null}
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
        <div className="sidebar-account">
          <span className="profile-menu__avatar">{initials}</span>
          <span className="sidebar-account__copy">
            <strong>{displayName}</strong>
            <small>{currentUser?.email}</small>
          </span>
        </div>
        <IconButton
          icon="collapse"
          label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          onClick={onToggle}
        />
      </div>
    </aside>
  );
}

function Topbar({
  onRequestReset,
  pageSubtitle,
  pageTitle,
}: {
  onRequestReset: () => void;
  pageSubtitle?: string;
  pageTitle: string;
}) {
  const { currentUser, logout } = useSession();
  const { enabled } = useDemo();
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
        <span className="topbar__title">
          {pageTitle}
          {enabled ? <span className="demo-mode-badge demo-mode-badge--topbar">Demo</span> : null}
        </span>
        {pageSubtitle ? (
          <span className="topbar__subtitle">{pageSubtitle}</span>
        ) : null}
      </div>
      <div className="topbar__actions">
        <ThemeMenu />
        <NotificationDropdown />
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
          {enabled ? (
            <DropdownItem onSelect={onRequestReset}>
              <Icon name="theme" size={17} />
              Restaurar demonstração
            </DropdownItem>
          ) : null}
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

export function AppShell({
  children,
  pageSubtitle,
  pageTitle,
}: AppShellProps) {
  const pathname = usePathname();
  const { resetDemo } = useDemo();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  function handleReset() {
    resetDemo();
    setResetOpen(false);
    navigate('/login');
  }

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
        <Topbar
          onRequestReset={() => setResetOpen(true)}
          pageSubtitle={pageSubtitle}
          pageTitle={pageTitle}
        />
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BottomNavigation pathname={pathname} />
      <Modal
        footer={
          <>
            <Button onClick={() => setResetOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button onClick={handleReset} variant="danger">
              Restaurar demonstração
            </Button>
          </>
        }
        onClose={() => setResetOpen(false)}
        open={resetOpen}
        title="Restaurar dados da demonstração?"
      >
        <p>
          Categorias, orçamentos, metas e preferências voltarão ao cenário
          inicial. Esta ação remove somente os dados locais da demo.
        </p>
      </Modal>
    </div>
  );
}
