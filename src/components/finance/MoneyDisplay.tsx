import type { HTMLAttributes } from 'react';
import { formatCurrency, type Money } from '../../services/money/money';

type MoneyDisplayProps = HTMLAttributes<HTMLSpanElement> & {
  value: Money;
  locale?: string;
};

export function MoneyDisplay({
  className = '',
  locale = 'pt-BR',
  value,
  ...props
}: MoneyDisplayProps) {
  return (
    <span className={`money-display ${className}`.trim()} {...props}>
      {formatCurrency(value, locale)}
    </span>
  );
}
