import { useId, type ReactNode } from 'react';
import { AppLink } from '../../../app/routing/router';

type DashboardSectionProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  children: ReactNode;
};

/** Cabeçalho e moldura comuns às seções do dashboard. */
export function DashboardSection({
  actionLabel,
  actionTo,
  children,
  description,
  title,
}: DashboardSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="dashboard-section">
      <div className="dashboard-section__heading">
        <div>
          <h2 id={headingId}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actionLabel && actionTo ? (
          <AppLink className="dashboard-section__action" to={actionTo}>
            {actionLabel}
          </AppLink>
        ) : null}
      </div>
      {children}
    </section>
  );
}
