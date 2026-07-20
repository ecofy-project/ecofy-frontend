import type { ReactNode } from 'react';
import { Card } from '../ui/data-display';

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helperText?: string;
  icon?: ReactNode;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
};

const accentTokens = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
} as const;

export function MetricCard({
  accent = 'primary',
  helperText,
  icon,
  label,
  value,
}: MetricCardProps) {
  return (
    <Card
      as="article"
      className="metric-card"
      style={
        {
          '--metric-accent': accentTokens[accent],
        } as React.CSSProperties
      }
    >
      <div className="metric-card__top">
        <span className="metric-card__label">{label}</span>
        {icon ? <span className="metric-card__icon">{icon}</span> : null}
      </div>
      <strong className="metric-card__value">{value}</strong>
      {helperText ? (
        <span className="metric-card__helper">{helperText}</span>
      ) : null}
    </Card>
  );
}
