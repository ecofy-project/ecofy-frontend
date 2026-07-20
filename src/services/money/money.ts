export type Money = Readonly<{
  amount: bigint;
  currency: string;
  scale: number;
}>;

const isoCurrencyPattern = /^[A-Z]{3}$/;

function normalizeCurrency(currency: string) {
  const normalized = currency.trim().toUpperCase();

  if (!isoCurrencyPattern.test(normalized)) {
    throw new Error('A moeda deve ser informada como um código ISO de três letras.');
  }

  return normalized;
}

function parseInteger(value: bigint | number | string) {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error('O valor monetário numérico deve ser um inteiro seguro.');
    }

    return BigInt(value);
  }

  if (!/^-?\d+$/.test(value.trim())) {
    throw new Error('O valor monetário deve ser um inteiro válido.');
  }

  return BigInt(value.trim());
}

export function createMoney(
  amount: bigint | number | string,
  currency: string,
  scale = 2,
): Money {
  if (!Number.isInteger(scale) || scale < 0 || scale > 8) {
    throw new Error('A escala monetária deve ser um inteiro entre 0 e 8.');
  }

  return Object.freeze({
    amount: parseInteger(amount),
    currency: normalizeCurrency(currency),
    scale,
  });
}

export function fromCents(
  cents: bigint | number | string,
  currency = 'BRL',
) {
  return createMoney(cents, currency, 2);
}

export function toCents(money: Money): bigint {
  if (money.scale === 2) {
    return money.amount;
  }

  if (money.scale < 2) {
    return money.amount * 10n ** BigInt(2 - money.scale);
  }

  const divisor = 10n ** BigInt(money.scale - 2);

  if (money.amount % divisor !== 0n) {
    throw new Error('O valor possui precisão maior que centavos.');
  }

  return money.amount / divisor;
}

export function fromDecimalString(
  decimal: string,
  currency = 'BRL',
  scale = 2,
): Money {
  const normalized = decimal.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized);

  if (!match) {
    throw new Error('O valor decimal deve usar ponto como separador.');
  }

  const [, sign, integer = '0', fraction = ''] = match;

  if (fraction.length > scale) {
    throw new Error(`O valor possui mais de ${scale} casas decimais.`);
  }

  const paddedFraction = fraction.padEnd(scale, '0');
  const units = BigInt(`${integer}${paddedFraction}` || '0');
  return createMoney(sign === '-' ? -units : units, currency, scale);
}

export function toDecimalString(money: Money): string {
  const negative = money.amount < 0n;
  const absolute = negative ? -money.amount : money.amount;

  if (money.scale === 0) {
    return `${negative ? '-' : ''}${absolute}`;
  }

  const digits = absolute.toString().padStart(money.scale + 1, '0');
  const integer = digits.slice(0, -money.scale);
  const fraction = digits.slice(-money.scale);
  return `${negative ? '-' : ''}${integer}.${fraction}`;
}

export function formatCurrency(money: Money, locale = 'pt-BR'): string {
  const decimal = toDecimalString(money);
  const value = Number(decimal);

  if (!Number.isFinite(value)) {
    throw new Error('O valor é grande demais para ser formatado neste ambiente.');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: money.scale,
    maximumFractionDigits: money.scale,
  }).format(value);
}
