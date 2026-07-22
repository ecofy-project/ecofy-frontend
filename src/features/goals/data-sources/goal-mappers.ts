import { ApiErrorException } from '../../../services/errors/api-error';
import { goalStatuses, type Goal, type GoalStatus } from '../types/goal';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_GOAL_RESPONSE',
    message: 'A resposta de metas recebida é incompatível.',
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

export function mapGoal(payload: unknown): Goal {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const targetCents = payload.targetCents;

  if (typeof targetCents !== 'number' || !Number.isFinite(targetCents)) {
    incompatibleResponse();
  }

  const createdAt = readOptionalString(payload.createdAt);
  const updatedAt = readOptionalString(payload.updatedAt);

  return Object.freeze({
    id: readRequiredString(payload.id),
    name: readRequiredString(payload.name),
    targetCents,
    currency: readRequiredString(payload.currency),
    status:
      typeof payload.status === 'string' &&
      goalStatuses.includes(payload.status as GoalStatus)
        ? (payload.status as GoalStatus)
        : incompatibleResponse(),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  });
}

export function mapGoals(payload: unknown): readonly Goal[] {
  if (!Array.isArray(payload)) {
    incompatibleResponse();
  }

  return Object.freeze(payload.map(mapGoal));
}
