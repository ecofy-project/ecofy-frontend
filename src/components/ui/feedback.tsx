import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button, IconButton } from './actions';
import { Icon, type IconName } from './Icon';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger';

type AlertProps = {
  title: string;
  children?: ReactNode;
  tone?: FeedbackTone;
  onDismiss?: () => void;
};

export function Alert({
  children,
  onDismiss,
  title,
  tone = 'info',
}: AlertProps) {
  return (
    <div
      className={`alert alert--${tone}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon name={tone === 'danger' ? 'alert' : 'info'} size={20} />
      <div className="alert__content">
        <p className="alert__title">{title}</p>
        {children ? <div className="alert__description">{children}</div> : null}
      </div>
      {onDismiss ? (
        <IconButton icon="close" label="Dispensar aviso" onClick={onDismiss} />
      ) : null}
    </div>
  );
}

type SkeletonProps = {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  circle?: boolean;
  className?: string;
};

export function Skeleton({
  circle = false,
  className = '',
  height,
  width,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${circle ? 'skeleton--circle' : ''} ${className}`.trim()}
      style={{ height, width }}
    />
  );
}

type StatePanelProps = {
  title: string;
  description: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatePanel({
  actionLabel,
  description,
  icon = 'info',
  onAction,
  title,
}: StatePanelProps) {
  return (
    <div className="state-panel">
      <span className="state-panel__icon">
        <Icon name={icon} size={24} />
      </span>
      <h2>{title}</h2>
      <p className="state-panel__description">{description}</p>
      {actionLabel && onAction ? (
        <div className="state-panel__action">
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState(props: Partial<StatePanelProps>) {
  return (
    <StatePanel
      description="Quando houver conteúdo, ele aparecerá aqui."
      icon="imports"
      title="Nada por aqui ainda"
      {...props}
    />
  );
}

export function ErrorState(props: Partial<StatePanelProps>) {
  return (
    <StatePanel
      description="Tente novamente. Se o problema continuar, use o código de referência fornecido pelo suporte."
      icon="alert"
      title="Não foi possível carregar"
      {...props}
    />
  );
}

export function ForbiddenState(props: Partial<StatePanelProps>) {
  return (
    <StatePanel
      description="Seu acesso atual não permite visualizar este conteúdo."
      icon="alert"
      title="Acesso não permitido"
      {...props}
    />
  );
}

export function NotFoundState(props: Partial<StatePanelProps>) {
  return (
    <StatePanel
      description="O conteúdo solicitado não foi encontrado."
      icon="info"
      title="Conteúdo não encontrado"
      {...props}
    />
  );
}

export function DegradedState(props: Partial<StatePanelProps>) {
  return (
    <StatePanel
      description="Parte do conteúdo está temporariamente indisponível."
      icon="alert"
      title="Serviço temporariamente degradado"
      {...props}
    />
  );
}

export function LoadingState({ label = 'Carregando conteúdo' }: { label?: string }) {
  return (
    <div aria-label={label} className="showcase-card" role="status">
      <span className="sr-only">{label}</span>
      <Skeleton height="1.5rem" width="42%" />
      <Skeleton height="1rem" width="88%" />
      <Skeleton height="1rem" width="72%" />
    </div>
  );
}

type Toast = {
  id: number;
  message: string;
  title: string;
  tone: 'info' | 'success' | 'danger';
};

type ToastInput = Omit<Toast, 'id'>;

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-atomic="false"
        aria-live="polite"
        className="toast-viewport"
        role="region"
      >
        {toasts.map((toast) => (
          <div className={`toast toast--${toast.tone}`} key={toast.id}>
            <div>
              <p className="text-label">{toast.title}</p>
              <p className="toast__message">{toast.message}</p>
            </div>
            <IconButton
              icon="close"
              label="Fechar notificação"
              onClick={() => dismiss(toast.id)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de ToastProvider.');
  }

  return context;
}
