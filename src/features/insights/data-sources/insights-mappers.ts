import { ApiErrorException } from '../../../services/errors/api-error';
import { mapGoals } from '../../goals/data-sources/goal-mappers';
import {
  insightTypes,
  metricTypes,
  periodGranularities,
  type Insight,
  type InsightPeriod,
  type InsightType,
  type InsightsBundle,
  type MetricSnapshot,
  type MetricType,
  type PeriodGranularity,
} from '../types/insights';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_INSIGHTS_RESPONSE',
    message: 'A resposta de insights recebida é incompatível.',
    status: 502,
  });
}

function readRequiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    incompatibleResponse();
  }

  return value.trim();
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readInteger(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  incompatibleResponse();
}

function readEnum<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
): TValue {
  if (typeof value !== 'string' || !allowed.includes(value as TValue)) {
    incompatibleResponse();
  }

  return value as TValue;
}

export function mapMetricSnapshot(payload: unknown): MetricSnapshot {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const createdAt = readOptionalString(payload.createdAt);

  return Object.freeze({
    id: readRequiredString(payload.id),
    metricType: readEnum<MetricType>(payload.metricType, metricTypes),
    valueCents: readInteger(payload.valueCents),
    currency: readRequiredString(payload.currency),
    ...(createdAt ? { createdAt } : {}),
  });
}

/**
 * Lê apenas as chaves confirmadas de `payload` (`periodStart`, `periodEnd` e
 * `granularity`), gravadas por `InsightGenerationService`. Qualquer outra chave
 * é ignorada e o payload bruto nunca chega à interface.
 */
function mapInsightPeriod(payload: unknown): InsightPeriod {
  if (!isRecord(payload)) {
    return Object.freeze({});
  }

  const start = readOptionalString(payload.periodStart);
  const end = readOptionalString(payload.periodEnd);
  const rawGranularity = readOptionalString(payload.granularity);
  const granularity = periodGranularities.includes(
    rawGranularity as PeriodGranularity,
  )
    ? (rawGranularity as PeriodGranularity)
    : undefined;

  return Object.freeze({
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
    ...(granularity ? { granularity } : {}),
  });
}

export function mapInsight(payload: unknown): Insight {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const createdAt = readOptionalString(payload.createdAt);

  return Object.freeze({
    id: readRequiredString(payload.id),
    type: readEnum<InsightType>(payload.type, insightTypes),
    score: readInteger(payload.score),
    title: readRequiredString(payload.title),
    summary: readOptionalString(payload.summary) ?? '',
    period: mapInsightPeriod(payload.payload),
    ...(createdAt ? { createdAt } : {}),
  });
}

export function mapInsights(payload: unknown): readonly Insight[] {
  if (!Array.isArray(payload)) {
    incompatibleResponse();
  }

  return Object.freeze(payload.map(mapInsight));
}

export function mapInsightsBundle(payload: unknown): InsightsBundle {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const metrics = Array.isArray(payload.metrics) ? payload.metrics : [];

  return Object.freeze({
    insights: mapInsights(payload.insights ?? []),
    metrics: Object.freeze(metrics.map(mapMetricSnapshot)),
    goals: mapGoals(payload.goals ?? []),
  });
}
