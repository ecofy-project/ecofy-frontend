import type { HTMLAttributes, ReactNode } from 'react';
import { IconButton } from './actions';

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'near-limit'
  | 'danger'
  | 'processing'
  | 'paused'
  | 'info';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  children,
  className = '',
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`badge ${tone === 'neutral' ? '' : `badge--${tone}`} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge(props: BadgeProps) {
  return <Badge {...props} className={`status-badge ${props.className ?? ''}`} />;
}

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div';
  interactive?: boolean;
  children: ReactNode;
};

export function Card({
  as: Component = 'div',
  children,
  className = '',
  interactive = false,
  ...props
}: CardProps) {
  return (
    <Component
      className={`card ${interactive ? 'card--interactive' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

type ProgressProps = {
  value: number;
  label: string;
  tone?: BadgeTone;
};

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function ProgressBar({
  label,
  tone = 'success',
  value,
}: ProgressProps) {
  const percentage = clampPercentage(value);

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percentage}
      className={`progress-bar progress-bar--${tone}`}
      role="progressbar"
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

export function ProgressRing({
  label,
  tone = 'success',
  value,
}: ProgressProps) {
  const percentage = clampPercentage(value);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`progress-ring progress-ring--${tone}`}>
      <svg
        aria-label={`${label}: ${percentage}%`}
        role="img"
        viewBox="0 0 72 72"
      >
        <circle className="progress-ring__track" cx="36" cy="36" r={radius} />
        <circle
          className="progress-ring__value"
          cx="36"
          cy="36"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percentage / 100)}
        />
      </svg>
      <strong className="numeric">{percentage}%</strong>
    </div>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
};

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const pages = new Set([0, totalPages - 1, page - 1, page, page + 1]);
  return [...pages]
    .filter((candidate) => candidate >= 0 && candidate < totalPages)
    .sort((a, b) => a - b);
}

export function Pagination({
  onPageChange,
  page,
  totalElements,
  totalPages,
}: PaginationProps) {
  const visiblePages = getVisiblePages(page, totalPages);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação" className="pagination">
      <span className="pagination__summary numeric">
        {totalElements === undefined
          ? `Página ${page + 1} de ${totalPages}`
          : `${totalElements} itens · página ${page + 1} de ${totalPages}`}
      </span>
      <div className="pagination__controls">
        <IconButton
          disabled={page === 0}
          icon="chevron-left"
          label="Página anterior"
          onClick={() => onPageChange(page - 1)}
          size="sm"
        />
        {visiblePages.map((visiblePage, index) => {
          const previous = visiblePages[index - 1];
          const hasGap = previous !== undefined && visiblePage - previous > 1;

          return (
            <span className="pagination__controls" key={visiblePage}>
              {hasGap ? <span aria-hidden="true">…</span> : null}
              <button
                aria-current={visiblePage === page ? 'page' : undefined}
                aria-label={`Ir para a página ${visiblePage + 1}`}
                className="icon-button icon-button--sm pagination__page"
                onClick={() => onPageChange(visiblePage)}
                type="button"
              >
                {visiblePage + 1}
              </button>
            </span>
          );
        })}
        <IconButton
          disabled={page >= totalPages - 1}
          icon="chevron-right"
          label="Próxima página"
          onClick={() => onPageChange(page + 1)}
          size="sm"
        />
      </div>
    </nav>
  );
}
