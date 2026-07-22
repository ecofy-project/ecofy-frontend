import type { BadgeTone } from '../../../components/ui';
import {
  formatCurrency,
  fromCents,
  fromDecimalString,
  toCents,
} from '../../../services/money/money';
import type { GoalStatus } from '../types/goal';

/**
 * Formatação e leitura de valores de meta.
 *
 * `targetCents` passa sempre pelo Money Adapter da Etapa 1 — nenhum componente
 * divide por 100 nem usa `toFixed` em valores financeiros.
 */

const statusLabels: Record<GoalStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  ARCHIVED: 'Arquivada',
};

const statusTones: Record<GoalStatus, BadgeTone> = {
  ACTIVE: 'success',
  PAUSED: 'paused',
  ARCHIVED: 'neutral',
};

export function goalStatusLabel(status: GoalStatus): string {
  return statusLabels[status];
}

export function goalStatusTone(status: GoalStatus): BadgeTone {
  return statusTones[status];
}

export function formatGoalTarget(
  targetCents: number,
  currency: string,
): string {
  return formatCurrency(fromCents(targetCents, currency));
}

/** Converte o decimal do contrato no texto localizado do formulário. */
export function toGoalTargetInput(targetCents: number): string {
  const negative = targetCents < 0;
  const digits = Math.abs(targetCents).toString().padStart(3, '0');
  const integer = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}${integer},${digits.slice(-2)}`;
}

export class GoalAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoalAmountError';
  }
}

/**
 * Converte o texto digitado (pt-BR ou decimal simples) em cents. A validação
 * replica apenas o mínimo publicado pelo contrato (`@Positive`); o backend
 * continua sendo a autoridade final.
 */
export function parseGoalTargetInput(
  rawValue: string,
  currency: string,
): number {
  const compact = rawValue.trim().replace(/\s/g, '');

  if (!compact) {
    throw new GoalAmountError('Informe o valor alvo da meta.');
  }

  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;

  let cents: bigint;

  try {
    cents = toCents(fromDecimalString(normalized, currency));
  } catch {
    throw new GoalAmountError(
      'Informe um valor válido, com até duas casas decimais.',
    );
  }

  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new GoalAmountError('O valor alvo deve ser maior que zero.');
  }

  return Number(cents);
}
