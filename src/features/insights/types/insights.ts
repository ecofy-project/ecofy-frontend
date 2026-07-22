/**
 * Contratos analíticos confirmados em `ms-insights`.
 *
 * Todos os campos e enums abaixo foram lidos diretamente de `InsightsController`,
 * `InsightsBundleResponse`, `InsightResponse`, `MetricSnapshotResponse`,
 * `GenerateInsightsRequest`, dos enums de domínio e do `RestExceptionHandler`.
 * Nada foi inventado. As divergências entre o contrato real e a especificação da
 * etapa estão documentadas em `docs/INSIGHTS_CONTRACTS.md`.
 */

import type { Page } from '../../../services/pagination/pagination';
import type { Goal } from '../../goals/types/goal';

/** `MetricType` publicado pelo domínio. São exatamente estas três métricas. */
export const metricTypes = ['TOTAL_SPENT', 'INCOME', 'SAVINGS_RATE'] as const;

export type MetricType = (typeof metricTypes)[number];

/** `InsightType` publicado pelo domínio. */
export const insightTypes = [
  'SPENDING_BREAKDOWN',
  'CASHFLOW',
  'ANOMALY',
] as const;

export type InsightType = (typeof insightTypes)[number];

/** `PeriodGranularity` aceita por `POST /generate`. */
export const periodGranularities = ['DAY', 'WEEK', 'MONTH'] as const;

export type PeriodGranularity = (typeof periodGranularities)[number];

/**
 * Snapshot de métrica. O valor chega sempre como `valueCents` + `currency`
 * (o value object `Money` do domínio), inclusive para `SAVINGS_RATE`. A
 * conversão acontece apenas na apresentação, pelo Money Adapter.
 */
export type MetricSnapshot = Readonly<{
  id: string;
  metricType: MetricType;
  valueCents: number;
  currency: string;
  createdAt?: string;
}>;

/**
 * Período do insight, lido das chaves confirmadas de `payload`
 * (`periodStart`, `periodEnd`, `granularity`), gravadas por
 * `InsightGenerationService`. Nenhuma outra chave é interpretada.
 */
export type InsightPeriod = Readonly<{
  start?: string;
  end?: string;
  granularity?: PeriodGranularity;
}>;

/**
 * Insight publicado por `InsightResponse`. `score` faz parte do contrato e é
 * preservado no modelo, mas não é apresentado como julgamento analítico na
 * interface.
 */
export type Insight = Readonly<{
  id: string;
  type: InsightType;
  score: number;
  title: string;
  summary: string;
  period: InsightPeriod;
  createdAt?: string;
}>;

/** `InsightsBundleResponse`: a única fonte confirmada de insights e métricas. */
export type InsightsBundle = Readonly<{
  insights: readonly Insight[];
  metrics: readonly MetricSnapshot[];
  goals: readonly Goal[];
}>;

export type GenerateInsightsInput = Readonly<{
  start: string;
  end: string;
  granularity: PeriodGranularity;
}>;

export type InsightListParams = Readonly<{
  page: number;
  size: number;
  /** Ausente significa "todos": nenhum recorte é aplicado. */
  type?: InsightType;
}>;

export type InsightPage = Page<Insight>;

/**
 * Reconstrução de análises ausentes.
 *
 * O `ms-insights` ainda não publica endpoints de rebuild, então este contrato é
 * exclusivamente do Mock Mode: o Data Source de API omite os métodos e a
 * interface esconde a ação, em vez de chamar um endpoint inexistente. Apenas o
 * modo `MISSING` existe — `FORCE` não é oferecido.
 */
export const rebuildModes = ['MISSING'] as const;

export type RebuildMode = (typeof rebuildModes)[number];

export type RebuildRun = Readonly<{
  runId: string;
  status: 'PROCESSING' | 'COMPLETED';
}>;

export function isRebuildFinished(run: RebuildRun): boolean {
  return run.status === 'COMPLETED';
}
