import { useEffect, type RefObject } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (!container) {
      return undefined;
    }

    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector),
    );
    (focusables[0] ?? container).focus();

    function handleTab(event: KeyboardEvent) {
      if (event.key !== 'Tab') {
        return;
      }

      const available = Array.from(
        container?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );

      if (available.length === 0) {
        event.preventDefault();
        container?.focus();
        return;
      }

      const first = available[0];
      const last = available.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      previouslyFocused?.focus();
    };
  }, [active, containerRef]);
}
