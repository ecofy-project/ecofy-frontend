import { StatusBadge, type BadgeTone } from '../ui/data-display';

type FinancialStatusBadgeProps = {
  label: string;
  tone: BadgeTone;
};

export function FinancialStatusBadge({
  label,
  tone,
}: FinancialStatusBadgeProps) {
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
