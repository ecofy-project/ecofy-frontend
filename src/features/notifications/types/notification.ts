/**
 * Contratos de notificação confirmados em `ms-notification`.
 *
 * Lidos diretamente de `NotificationController`, `NotificationResponse`,
 * `SendNotificationRequest`, `ResendRequest` e dos enums de domínio. Nada foi
 * inventado. As divergências entre o contrato real e a especificação da etapa
 * estão documentadas em `docs/NOTIFICATION_CONTRACTS.md`.
 */

/** `NotificationChannel` publicado pelo domínio. */
export const notificationChannels = ['EMAIL', 'WHATSAPP', 'PUSH'] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

/** `NotificationStatus` publicado pelo domínio. */
export const notificationStatuses = [
  'PENDING',
  'SENT',
  'FAILED',
  'CANCELED',
] as const;

export type NotificationStatus = (typeof notificationStatuses)[number];

/** `DomainEventType`: os únicos eventos que originam notificações hoje. */
export const domainEventTypes = ['BUDGET_ALERT', 'INSIGHT_CREATED'] as const;

export type DomainEventType = (typeof domainEventTypes)[number];

/**
 * Modelo interno de notificação.
 *
 * `NotificationResponse` também publica `userId`, `destination` e `payload`. O
 * destino é um dado pessoal (e-mail ou telefone) e o payload é conteúdo bruto:
 * nenhum dos três é mapeado, portanto não chegam à interface.
 *
 * O contrato não possui campo de leitura, prioridade, categoria ou título
 * próprio — apenas `subject` e `body`.
 */
export type Notification = Readonly<{
  id: string;
  eventType: DomainEventType;
  channel: NotificationChannel;
  subject?: string;
  body?: string;
  status: NotificationStatus;
  attemptCount: number;
  createdAt?: string;
  updatedAt?: string;
}>;

/**
 * A listagem é limitada, não paginada: o backend aceita apenas `limit`, com
 * padrão 50 e teto 200, e devolve uma lista simples. Por isso o modelo interno
 * não usa `Page<T>`.
 */
export const defaultNotificationLimit = 50;
export const maxNotificationLimit = 200;

export type NotificationListParams = Readonly<{
  limit: number;
}>;

export function clampNotificationLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) {
    return defaultNotificationLimit;
  }

  return Math.min(limit, maxNotificationLimit);
}

/** `SendNotificationRequest` sem `userId`: ele é resolvido a partir da sessão. */
export type SendNotificationInput = Readonly<{
  eventType: DomainEventType;
  channel: NotificationChannel;
  destinationOverride?: string;
  payload?: Readonly<Record<string, unknown>>;
}>;

export type ResendNotificationInput = Readonly<{
  notificationId: string;
}>;
