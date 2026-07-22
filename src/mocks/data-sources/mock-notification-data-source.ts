import type { NotificationDataSource } from '../../features/notifications/data-sources/notification-data-source';
import {
  clampNotificationLimit,
  type Notification,
  type NotificationListParams,
  type ResendNotificationInput,
  type SendNotificationInput,
} from '../../features/notifications/types/notification';
import type { MockScenario } from '../../services/config/env';
import { ApiErrorException } from '../../services/errors/api-error';
import type { DemoStore } from '../demo/demo-store';
import { simulateMockLatency } from '../shared/mock-runtime';

type MockNotificationOptions = Readonly<{
  scenario: MockScenario;
  delayMs: number;
}>;

function createId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
  return `${prefix}-${randomId}`;
}

/**
 * Mock Mode de notificações, sobre o Mock Storage central.
 *
 * Nenhuma comunicação externa acontece: envio e reenvio apenas atualizam
 * metadados demonstrativos. Nenhum provider é executado.
 */
export class MockNotificationDataSource implements NotificationDataSource {
  constructor(
    private readonly store: DemoStore,
    private readonly options: MockNotificationOptions,
  ) {}

  private async prepare() {
    const delay =
      this.options.scenario === 'loading'
        ? Math.max(this.options.delayMs, 1_200)
        : this.options.delayMs;
    await simulateMockLatency(delay);

    if (
      this.options.scenario === 'error' ||
      this.options.scenario === 'notifications-error'
    ) {
      throw new ApiErrorException({
        code: 'NOTIFICATIONS_UNAVAILABLE',
        message: 'Não foi possível carregar as notificações.',
        status: 503,
      });
    }
  }

  async listNotifications(
    params: NotificationListParams,
  ): Promise<readonly Notification[]> {
    await this.prepare();

    if (
      this.options.scenario === 'empty' ||
      this.options.scenario === 'notifications-empty'
    ) {
      return [];
    }

    return this.store
      .getState()
      .notifications.slice(0, clampNotificationLimit(params.limit));
  }

  async sendNotification(input: SendNotificationInput): Promise<Notification> {
    await this.prepare();
    const now = new Date().toISOString();
    const created: Notification = {
      id: createId('notification'),
      eventType: input.eventType,
      channel: input.channel,
      status: 'PENDING',
      attemptCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.store.update((draft) => {
      draft.notifications = [created, ...draft.notifications];
    });

    return created;
  }

  /**
   * O reenvio simulado é determinístico: no cenário de falha o status
   * permanece `FAILED` e apenas a contagem de tentativas avança; nos demais, a
   * notificação passa a `SENT`.
   */
  async resendNotification(
    input: ResendNotificationInput,
  ): Promise<Notification> {
    await this.prepare();
    const current = this.store
      .getState()
      .notifications.find((item) => item.id === input.notificationId);

    if (!current) {
      throw new ApiErrorException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'A notificação informada não foi encontrada.',
        status: 404,
      });
    }

    if (this.options.scenario === 'notification-resend-error') {
      throw new ApiErrorException({
        code: 'BUSINESS_VALIDATION',
        message: 'O serviço não pôde processar o reenvio agora.',
        status: 400,
        details: { reason: 'BUSINESS_VALIDATION' },
      });
    }

    const updated: Notification = {
      ...current,
      status:
        this.options.scenario === 'notification-resend-failed'
          ? 'FAILED'
          : 'SENT',
      attemptCount: current.attemptCount + 1,
      updatedAt: new Date().toISOString(),
    };

    this.store.update((draft) => {
      draft.notifications = draft.notifications.map((item) =>
        item.id === updated.id ? updated : item,
      );
    });

    return updated;
  }
}
