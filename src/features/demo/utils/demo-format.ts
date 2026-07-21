import { formatCurrency, fromCents, fromDecimalString, toCents } from '../../../services/money/money';
import type { DemoMoney } from '../types/demo';

export function formatDemoMoney(money: DemoMoney) {
  return formatCurrency(fromCents(money.cents, money.currency));
}

export function parseDemoMoney(value: string, currency: string): DemoMoney {
  const compact = value.trim().replace(/\s/g, '');
  const normalized = compact.includes(',')
    ? compact.replace(/\./g, '').replace(',', '.')
    : compact;
  const cents = toCents(fromDecimalString(normalized, currency));

  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Informe um valor monetário positivo e válido.');
  }

  return { cents: Number(cents), currency };
}

export function formatDemoDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
