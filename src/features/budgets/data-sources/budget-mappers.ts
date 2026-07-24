import { ApiErrorException } from '../../../services/errors/api-error';
import {
  budgetPeriodTypes,
  budgetStatuses,
  type Budget,
  type BudgetConsumption,
  type BudgetOverview,
  type BudgetPeriodType,
  type BudgetStatus,
} from '../types/budget';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_BUDGET_RESPONSE',
    message: 'A resposta de orçamentos recebida é incompatível.',
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

function readEnum<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
): TValue {
  if (typeof value !== 'string' || !allowed.includes(value as TValue)) {
    incompatibleResponse();
  }

  return value as TValue;
}

/**
 * `limitAmount` chega como `BigDecimal.toPlainString()`. `consumedAmount` e
 * `consumedPct` são `BigDecimal` serializados pelo Jackson, que podem chegar
 * como número ou string dependendo da configuração do serviço. Nos dois casos o
 * valor é apenas normalizado — nunca recalculado.
 */
function readDecimalString(value: unknown): string {
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }

  incompatibleResponse();
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  incompatibleResponse();
}

export function mapBudget(payload: unknown): Budget {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const createdAt = readOptionalString(payload.createdAt);
  const updatedAt = readOptionalString(payload.updatedAt);
  const version = payload.version;

  return Object.freeze({
    id: readRequiredString(payload.id),
    categoryId: readRequiredString(payload.categoryId),
    periodType: readEnum<BudgetPeriodType>(
      payload.periodType,
      budgetPeriodTypes,
    ),
    periodStart: readRequiredString(payload.periodStart),
    periodEnd: readRequiredString(payload.periodEnd),
    limitAmount: readDecimalString(payload.limitAmount),
    currency: readRequiredString(payload.currency),
    status: readEnum<BudgetStatus>(payload.status, budgetStatuses),
    ...(typeof version === 'number' && Number.isInteger(version)
      ? { version }
      : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  });
}

function mapConsumption(payload: unknown): BudgetConsumption {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  return Object.freeze({
    budgetId: readRequiredString(payload.budgetId),
    consumedAmount: readDecimalString(payload.consumedAmount),
    limitAmount: readDecimalString(payload.limitAmount),
    percentage: readNumber(payload.consumedPct),
  });
}

/**
 * `BudgetOverviewResponse` publica `userId`, `consumptions` e `alerts`. O
 * `userId` não é exibido e os alertas chegam ao usuário por notificações, então
 * apenas os consumos são projetados para o modelo interno.
 */
export function mapBudgetOverview(payload: unknown): BudgetOverview {
  if (!isRecord(payload) || !Array.isArray(payload.consumptions)) {
    incompatibleResponse();
  }

  return Object.freeze({
    consumptions: Object.freeze(payload.consumptions.map(mapConsumption)),
  });
}
