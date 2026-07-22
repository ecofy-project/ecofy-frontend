import type { BadgeTone } from '../../../components/ui';
import type {
  DomainEventType,
  NotificationChannel,
  NotificationStatus,
} from '../types/notification';

/** Rótulos e tons de apresentação para os enums confirmados pelo domínio. */

const statusLabels: Record<NotificationStatus, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviada',
  FAILED: 'Falhou',
  CANCELED: 'Cancelada',
};

const statusTones: Record<NotificationStatus, BadgeTone> = {
  PENDING: 'processing',
  SENT: 'success',
  FAILED: 'danger',
  CANCELED: 'neutral',
};

const channelLabels: Record<NotificationChannel, string> = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
  PUSH: 'Push',
};

const eventTypeLabels: Record<DomainEventType, string> = {
  BUDGET_ALERT: 'Alerta de orçamento',
  INSIGHT_CREATED: 'Nova análise',
};

export function notificationStatusLabel(status: NotificationStatus): string {
  return statusLabels[status];
}

export function notificationStatusTone(status: NotificationStatus): BadgeTone {
  return statusTones[status];
}

export function notificationChannelLabel(
  channel: NotificationChannel,
): string {
  return channelLabels[channel];
}

export function notificationEventLabel(eventType: DomainEventType): string {
  return eventTypeLabels[eventType];
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** `Instant` do contrato, sempre em UTC. Nunca produz "Invalid Date". */
export function formatNotificationDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : dateTimeFormatter.format(parsed);
}
