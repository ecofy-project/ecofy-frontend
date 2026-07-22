import {
  formatCurrency,
  fromDecimalString,
  type Money,
} from '../../../services/money/money';

/**
 * Toda leitura e escrita monetária desta feature passa pelo Money Adapter da
 * Etapa 1. Nenhum componente usa `parseFloat`, `Number` ou `toFixed` em valores
 * financeiros, e nenhum cálculo de regra de negócio acontece aqui: o consumo e o
 * percentual são sempre os recebidos do backend.
 *
 * O budgeting trabalha com decimal (`"1000.00"`), não com centavos, então os
 * valores trafegam como string decimal e só viram `Money` na apresentação.
 */

/** `@DecimalMin("0.01")` em `CreateBudgetRequest` e `UpdateBudgetRequest`. */
const minimumLimitUnits = 1n;

export class BudgetAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetAmountError';
  }
}

export function toMoney(decimal: string, currency: string): Money {
  return fromDecimalString(decimal, currency);
}

export function formatBudgetAmount(decimal: string, currency: string): string {
  return formatCurrency(toMoney(decimal, currency));
}

/**
 * Converte o texto digitado (pt-BR ou decimal simples) no decimal esperado pelo
 * contrato. A validação replica apenas o mínimo publicado pelo backend, que
 * permanece a autoridade final.
 */
export function parseLimitAmountInput(
  rawValue: string,
  currency: string,
): string {
  const compact = rawValue.trim().replace(/\s/g, '');

  if (!compact) {
    throw new BudgetAmountError('Informe o limite do orçamento.');
  }

  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;

  let money: Money;

  try {
    money = fromDecimalString(normalized, currency);
  } catch {
    throw new BudgetAmountError(
      'Informe um valor válido, com até duas casas decimais.',
    );
  }

  if (money.amount < minimumLimitUnits) {
    throw new BudgetAmountError('O limite deve ser de no mínimo 0,01.');
  }

  return normalized;
}

/** Converte o decimal do contrato no texto localizado exibido no formulário. */
export function toLimitAmountInput(decimal: string): string {
  const [integer = '0', fraction = '00'] = decimal.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped},${fraction.padEnd(2, '0')}`;
}

export function formatPercentage(percentage: number, locale = 'pt-BR'): string {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(percentage)}%`;
}
