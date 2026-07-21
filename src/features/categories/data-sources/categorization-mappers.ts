import { ApiErrorException } from '../../../services/errors/api-error';
import {
  matchOperators,
  ruleStatuses,
  suggestionStatuses,
  type CategorizationRule,
  type CategorizationSuggestion,
  type Category,
  type ManualCategorizationResult,
  type MatchOperator,
  type RuleCondition,
  type RuleStatus,
  type SuggestionStatus,
} from '../types/categorization';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_CATEGORIZATION_RESPONSE',
    message: 'A resposta de categorização recebida é incompatível.',
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
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    incompatibleResponse();
  }

  return value;
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

export function mapCategory(payload: unknown): Category {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const color = readOptionalString(payload.color);

  return Object.freeze({
    id: readRequiredString(payload.id),
    name: readRequiredString(payload.name),
    ...(color ? { color } : {}),
    active: payload.active !== false,
  });
}

export function mapCategories(payload: unknown): readonly Category[] {
  if (!Array.isArray(payload)) {
    incompatibleResponse();
  }

  return Object.freeze(payload.map(mapCategory));
}

function mapRuleCondition(payload: unknown): RuleCondition {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const weight = payload.weight;

  return Object.freeze({
    field: readRequiredString(payload.field),
    operator: readEnum<MatchOperator>(payload.operator, matchOperators),
    value: typeof payload.value === 'string' ? payload.value : incompatibleResponse(),
    ...(typeof weight === 'number' && Number.isFinite(weight)
      ? { weight }
      : {}),
  });
}

export function mapRule(payload: unknown): CategorizationRule {
  if (!isRecord(payload) || !Array.isArray(payload.conditions)) {
    incompatibleResponse();
  }

  const createdAt = readOptionalString(payload.createdAt);
  const updatedAt = readOptionalString(payload.updatedAt);

  return Object.freeze({
    id: readRequiredString(payload.id),
    categoryId: readRequiredString(payload.categoryId),
    name: readRequiredString(payload.name),
    status: readEnum<RuleStatus>(payload.status, ruleStatuses),
    priority: readInteger(payload.priority),
    conditions: Object.freeze(payload.conditions.map(mapRuleCondition)),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  });
}

export function mapRules(payload: unknown): readonly CategorizationRule[] {
  if (!Array.isArray(payload)) {
    incompatibleResponse();
  }

  return Object.freeze(payload.map(mapRule));
}

export function mapManualCategorizationResult(
  payload: unknown,
): ManualCategorizationResult {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const categoryId = readOptionalString(payload.categoryId);
  const suggestionId = readOptionalString(payload.suggestionId);
  const decision = readOptionalString(payload.decision);

  return Object.freeze({
    transactionId: readRequiredString(payload.transactionId),
    categorized: payload.categorized === true,
    ...(categoryId ? { categoryId } : {}),
    ...(suggestionId ? { suggestionId } : {}),
    ...(decision ? { decision } : {}),
    score: readInteger(payload.score),
  });
}

export function mapSuggestion(payload: unknown): CategorizationSuggestion {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const categoryId = readOptionalString(payload.categoryId);
  const ruleId = readOptionalString(payload.ruleId);
  const rationale = readOptionalString(payload.rationale);

  return Object.freeze({
    id: readRequiredString(payload.id),
    transactionId: readRequiredString(payload.transactionId),
    ...(categoryId ? { categoryId } : {}),
    ...(ruleId ? { ruleId } : {}),
    status: readEnum<SuggestionStatus>(payload.status, suggestionStatuses),
    score: readInteger(payload.score),
    ...(rationale ? { rationale } : {}),
  });
}
