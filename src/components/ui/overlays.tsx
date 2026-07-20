import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../shared/dom/useFocusTrap';
import { IconButton } from './actions';

type OverlayBaseProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

type ModalProps = OverlayBaseProps & {
  footer?: ReactNode;
};

function useOverlayBehavior(
  open: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLElement | null>,
) {
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, open]);
}

export function Modal({
  children,
  footer,
  onClose,
  open,
  title,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehavior(open, onClose, panelRef);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className="modal" ref={panelRef} tabIndex={-1}>
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="close" label="Fechar modal" onClick={onClose} />
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  children,
  onClose,
  open,
  title,
}: OverlayBaseProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehavior(open, onClose, panelRef);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="overlay overlay--drawer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className="drawer" ref={panelRef} tabIndex={-1}>
        <div className="drawer__header">
          <h2 id={titleId}>{title}</h2>
          <IconButton icon="close" label="Fechar painel" onClick={onClose} />
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

type DropdownProps = {
  trigger: ReactElement<{
    onClick?: React.MouseEventHandler;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'menu';
    'aria-controls'?: string;
  }>;
  children: ReactNode;
  label: string;
};

export function Dropdown({ children, label, trigger }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function handleOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('pointerdown', handleOutsidePointer);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const enhancedTrigger = isValidElement(trigger)
    ? cloneElement(trigger, {
        'aria-controls': menuId,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        onClick: (event) => {
          trigger.props.onClick?.(event);
          setOpen((current) => !current);
        },
      })
    : trigger;

  return (
    <div className="dropdown" ref={rootRef}>
      {enhancedTrigger}
      {open ? (
        <div
          aria-label={label}
          className="dropdown__menu"
          id={menuId}
          onClick={() => setOpen(false)}
          role="menu"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type DropdownItemProps = {
  children: ReactNode;
  onSelect?: () => void;
};

export function DropdownItem({ children, onSelect }: DropdownItemProps) {
  return (
    <button
      className="dropdown__item"
      onClick={onSelect}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  );
}

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ children, content }: TooltipProps) {
  const id = useId();

  return (
    <span className="tooltip">
      <span aria-describedby={id}>{children}</span>
      <span className="tooltip__bubble text-caption" id={id} role="tooltip">
        {content}
      </span>
    </span>
  );
}
