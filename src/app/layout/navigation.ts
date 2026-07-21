import type { IconName } from '../../components/ui';

export type NavigationItem = {
  label: string;
  path: string;
  icon: IconName;
  badge?: number;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Sistema',
    items: [
      {
        label: 'Design System',
        path: '/design-system',
        icon: 'theme',
      },
    ],
  },
  {
    label: 'Visão geral',
    items: [{ label: 'Dashboard', path: '/', icon: 'dashboard' }],
  },
  {
    label: 'Finanças',
    items: [
      { label: 'Importações', path: '/imports', icon: 'imports' },
      {
        label: 'Categorias & Regras',
        path: '/categories',
        icon: 'categories',
      },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { label: 'Orçamentos', path: '/budgets', icon: 'wallet' },
      { label: 'Metas', path: '/goals', icon: 'goal' },
    ],
  },
  {
    label: 'Inteligência',
    items: [{ label: 'Insights', path: '/insights', icon: 'insights' }],
  },
  {
    label: 'Atividade',
    items: [
      {
        label: 'Notificações',
        path: '/notifications',
        icon: 'notifications',
        badge: 3,
      },
    ],
  },
  {
    label: 'Conta',
    items: [
      { label: 'Perfil', path: '/profile', icon: 'profile' },
      { label: 'Preferências', path: '/preferences', icon: 'settings' },
      { label: 'Conexões', path: '/connections', icon: 'connections' },
    ],
  },
];

export const mobilePrimaryNavigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Importações', path: '/imports', icon: 'imports' },
  { label: 'Orçamentos', path: '/budgets', icon: 'wallet' },
  { label: 'Insights', path: '/insights', icon: 'insights' },
];

export const mobileMoreNavigation = navigationGroups
  .flatMap((group) => group.items)
  .filter(
    (item) =>
      !mobilePrimaryNavigation.some(
        (primaryItem) => primaryItem.path === item.path,
      ),
  );
