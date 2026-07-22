import {
  formatCurrency,
  fromCents,
  toDecimalString,
} from '../../../services/money/money';
import type {
  InsightType,
  MetricType,
  PeriodGranularity,
} from '../types/insights';

/**
 * Formatação centralizada das métricas.
 *
 * Todo valor monetário passa pelo Money Adapter da Etapa 1 e nenhum componente
 * faz `/ 100`, `toFixed` ou `Intl.NumberFormat` por conta própria. Nenhum valor
 * é recalculado: o backend é a única fonte dos números.
 */

const metricLabels: Record<MetricType, string> = {
  TOTAL_SPENT: 'Total gasto',
  INCOME: 'Receitas',
  SAVINGS_RATE: 'Taxa de economia',
};

const metricHelperTexts: Record<MetricType, string> = {
  TOTAL_SPENT: 'Saídas consolidadas no período',
  INCOME: 'Entradas consolidadas no período',
  SAVINGS_RATE: 'Proporção economizada no período',
};

export function metricLabel(metricType: MetricType): string {
  return metricLabels[metricType];
}

export function metricHelperText(metricType: MetricType): string {
  return metricHelperTexts[metricType];
}

export function formatMetricMoney(
  valueCents: number,
  currency: string,
): string {
  return formatCurrency(fromCents(valueCents, currency));
}

/**
 * `SAVINGS_RATE` também trafega no value object `Money`, com escala 2. O
 * decimal é lido pelo Money Adapter e apenas recebe o sufixo percentual.
 */
export function formatMetricPercentage(
  valueCents: number,
  currency: string,
  locale = 'pt-BR',
): string {
  const decimal = Number(toDecimalString(fromCents(valueCents, currency)));

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(decimal)}%`;
}

export function formatMetricValue(
  metricType: MetricType,
  valueCents: number,
  currency: string,
): string {
  return metricType === 'SAVINGS_RATE'
    ? formatMetricPercentage(valueCents, currency)
    : formatMetricMoney(valueCents, currency);
}

const insightTypeLabels: Record<InsightType, string> = {
  SPENDING_BREAKDOWN: 'Composição de gastos',
  CASHFLOW: 'Fluxo de caixa',
  ANOMALY: 'Movimentação atípica',
};

const granularityLabels: Record<PeriodGranularity, string> = {
  DAY: 'Diário',
  WEEK: 'Semanal',
  MONTH: 'Mensal',
};

export function insightTypeLabel(type: InsightType): string {
  return insightTypeLabels[type];
}

export function granularityLabel(granularity: PeriodGranularity): string {
  return granularityLabels[granularity];
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** `LocalDate` (`YYYY-MM-DD`) apresentado sem deslocamento de fuso. */
export function formatLocalDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? '—' : dateFormatter.format(parsed);
}

/** `Instant` do contrato, sempre em UTC. Nunca produz "Invalid Date". */
export function formatInstant(value?: string): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed);
}
