import { ApiErrorException } from '../../../services/errors/api-error';
import type { HttpClient } from '../../../services/http';
import { createCorrelationId } from '../../../services/http';
import {
  clampNotificationLimit,
  type Notification,
  type NotificationListParams,
  type ResendNotificationInput,
  type SendNotificationInput,
} from '../types/notification';
import type { NotificationDataSource } from './notification-data-source';
import { mapNotification, mapNotifications } from './notification-mappers';

/**
 * Prefixo versionado do API Gateway. A rota `/api/v1/**` reescreve para o mesmo
 * downstream da rota legada (`/notification/api/notification/v1/notifications`),
 * com CircuitBreaker, Retry e fallback que a rota legada não tem.
 */
const notificationGatewayPath = '/api/v1/notification/notifications';

/**
 * Resolve o dono das notificações a partir da sessão autenticada. O contrato
 * exige `userId` explícito na listagem e no envio; o valor nunca é pedido em
 * formulário nem exibido. A autorização real permanece no backend.
 */
export type CurrentUserProvider = Readonly<{
  getUserId: () => string | null;
}>;

export class ApiNotificationDataSource implements NotificationDataSource {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly currentUser: CurrentUserProvider,
  ) {}

  private requireUserId(): string {
    const userId = this.currentUser.getUserId();

    if (!userId) {
      throw new ApiErrorException({
        code: 'SESSION_REQUIRED',
        message: 'Sua sessão precisa ser renovada.',
        status: 401,
      });
    }

    return userId;
  }

  /**
   * O endpoint aceita apenas `userId` e `limit`, com teto de 200 aplicado
   * também no servidor. Não há paginação por páginas neste recurso.
   */
  async listNotifications(
    params: NotificationListParams,
  ): Promise<readonly Notification[]> {
    const response = await this.httpClient.request<unknown>(
      notificationGatewayPath,
      {
        query: {
          userId: this.requireUserId(),
          limit: clampNotificationLimit(params.limit),
        },
      },
    );

    return mapNotifications(response.data);
  }

  async sendNotification(input: SendNotificationInput): Promise<Notification> {
    const response = await this.httpClient.request<unknown>(
      notificationGatewayPath,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: {
          userId: this.requireUserId(),
          eventType: input.eventType,
          channel: input.channel,
          ...(input.destinationOverride
            ? { destinationOverride: input.destinationOverride }
            : {}),
          ...(input.payload ? { payload: input.payload } : {}),
        },
      },
    );

    return mapNotification(response.data);
  }

  async resendNotification(
    input: ResendNotificationInput,
  ): Promise<Notification> {
    const response = await this.httpClient.request<unknown>(
      `${notificationGatewayPath}/resend`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': createCorrelationId() },
        body: { notificationId: input.notificationId },
      },
    );

    return mapNotification(response.data);
  }
}
