import {
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react';

const navigationEvent = 'ecofy:navigation';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(navigationEvent, callback);

  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(navigationEvent, callback);
  };
}

function getPathname() {
  return window.location.pathname;
}

function getSearch() {
  return window.location.search;
}

export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname, () => '/');
}

export function useSearchParam(name: string) {
  const search = useSyncExternalStore(subscribe, getSearch, () => '');
  const value = new URLSearchParams(search).get(name)?.trim();

  return value || null;
}

export function navigate(path: string) {
  const currentPath = `${window.location.pathname}${window.location.search}`;

  if (currentPath === path) {
    return;
  }

  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event(navigationEvent));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
};

export function AppLink({ onClick, to, ...props }: AppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(to);
  }

  return <a href={to} onClick={handleClick} {...props} />;
}
