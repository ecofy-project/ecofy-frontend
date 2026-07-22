import type { BadgeTone } from '../../../components/ui';
import type { BudgetPeriodType, BudgetStatus } from '../types/budget';

/**
 * Rótulos e tons puramente de apresentação. Nenhum deles cria status de domínio
 * novo: o valor recebido continua sendo `ACTIVE`, `PAUSED` ou `ARCHIVED`.
 */

const statusLabels: Record<BudgetStatus, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  ARCHIVED: 'Arquivado',
};

const statusTones: Record<BudgetStatus, BadgeTone> = {
  ACTIVE: 'success',
  PAUSED: 'paused',
  ARCHIVED: 'neutral',
};

const periodTypeLabels: Record<BudgetPeriodType, string> = {
  MONTHLY: 'Mensal',
  WEEKLY: 'Semanal',
  CUSTOM: 'Personalizado',
};

export function budgetStatusLabel(status: BudgetStatus): string {
  return statusLabels[status];
}

export function budgetStatusTone(status: BudgetStatus): BadgeTone {
  return statusTones[status];
}

export function budgetPeriodTypeLabel(periodType: BudgetPeriodType): string {
  return periodTypeLabels[periodType];
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Apresenta `LocalDate` (`YYYY-MM-DD`) sem deslocamento de fuso horário. */
export function formatLocalDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

export function formatPeriodRange(start: string, end: string): string {
  return `${formatLocalDate(start)} até ${formatLocalDate(end)}`;
}
