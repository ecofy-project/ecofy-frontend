import type { HTMLAttributes, ReactNode } from 'react';
import { IconButton } from './actions';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

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
