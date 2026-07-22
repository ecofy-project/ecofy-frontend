import { ApiErrorException } from '../../../services/errors/api-error';
import {
  domainEventTypes,
  notificationChannels,
  notificationStatuses,
  type DomainEventType,
  type Notification,
  type NotificationChannel,
  type NotificationStatus,
} from '../types/notification';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function incompatibleResponse(): never {
  throw new ApiErrorException({
    code: 'INCOMPATIBLE_NOTIFICATION_RESPONSE',
    message: 'A resposta de notificações recebida é incompatível.',
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
 * `userId`, `destination` e `payload` são publicados pelo contrato e
 * deliberadamente ignorados: o destino é dado pessoal e o payload é conteúdo
 * bruto. Nenhum dos três entra no modelo interno.
 */
export function mapNotification(payload: unknown): Notification {
  if (!isRecord(payload)) {
    incompatibleResponse();
  }

  const subject = readOptionalString(payload.subject);
  const body = readOptionalString(payload.body);
  const createdAt = readOptionalString(payload.createdAt);
  const updatedAt = readOptionalString(payload.updatedAt);
  const attemptCount = payload.attemptCount;

  return Object.freeze({
    id: readRequiredString(payload.id),
    eventType: readEnum<DomainEventType>(payload.eventType, domainEventTypes),
    channel: readEnum<NotificationChannel>(
      payload.channel,
      notificationChannels,
    ),
    ...(subject ? { subject } : {}),
    ...(body ? { body } : {}),
    status: readEnum<NotificationStatus>(payload.status, notificationStatuses),
    attemptCount:
      typeof attemptCount === 'number' && Number.isInteger(attemptCount)
        ? attemptCount
        : 0,
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  });
}

export function mapNotifications(payload: unknown): readonly Notification[] {
  if (!Array.isArray(payload)) {
    incompatibleResponse();
  }

  return Object.freeze(payload.map(mapNotification));
}
