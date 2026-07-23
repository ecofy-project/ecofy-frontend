# Contratos de notificação consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente de `NotificationController`,
`NotificationResponse`, `SendNotificationRequest`, `ResendRequest`, dos enums de
domínio e das rotas do `api-gateway`. Nenhum campo, enum ou estado foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `GET` | `/notification/api/notification/v1/notifications?userId=&limit=` | Listagem limitada |
| `POST` | `/notification/api/notification/v1/notifications/resend` | Reenvio |
| `POST` | `/notification/api/notification/v1/notifications` | Envio (Data Source preparado, sem interface) |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma porta
ou URL direta do microsserviço é utilizada.

## Contratos confirmados

- `GET` aceita `userId` (obrigatório) e `limit`, com padrão 50 e teto 200
  aplicados também no servidor (`clamp`). A resposta é uma **lista simples**, sem
  envelope de paginação.
- `NotificationResponse`: `id`, `userId`, `eventType`, `channel`, `destination`,
  `subject`, `body`, `status`, `attemptCount`, `payload`, `createdAt`,
  `updatedAt`.
- `SendNotificationRequest`: `userId`, `eventType`, `channel` (obrigatórios),
  `destinationOverride`, `payload` e `idempotencyKey` (opcionais). O header
  `Idempotency-Key` também é aceito e tem precedência.
- `ResendRequest`: `notificationId` (obrigatório) e `idempotencyKey`.
- `NotificationChannel`: `EMAIL`, `WHATSAPP`, `PUSH`.
- `NotificationStatus`: `PENDING`, `SENT`, `FAILED`, `CANCELED`.
- `DomainEventType`: `BUDGET_ALERT`, `INSIGHT_CREATED`, os únicos eventos que
  originam notificações.

## Decisões e divergências documentadas

1. **Não existe marcação de leitura.** `NotificationResponse` não publica `read`
   nem `unread`. Por isso não há contador de não lidas na Topbar nem na
   navegação, não há ação "marcar como lida" e o acesso usa apenas o ícone,
   como orienta a própria especificação quando o campo não existe.
2. **Sem paginação por páginas.** O recurso aceita apenas `limit`, então o
   modelo interno usa uma lista e o Pagination Adapter não é aplicado aqui.
3. **`destination` e `payload` não são mapeados.** O destino é dado pessoal
   (e-mail ou telefone) e o payload é conteúdo bruto; nenhum dos dois entra no
   modelo interno e, portanto, não chega à interface. `userId` também é omitido.
4. **Não há título próprio.** O card usa `subject` quando presente e, na
   ausência, o rótulo do `eventType`. Prioridade, categoria e agrupamento não
   existem no contrato e não foram inventados.
5. **Sem agrupamento por período.** O contrato não garante um recorte confiável
   para "Hoje / Ontem / Esta semana", então a lista respeita a ordem devolvida
   pelo serviço.
6. **Códigos de falha detalhados não existem.** `TEMPORARY_FAILURE`,
   `PERMANENT_FAILURE`, `INVALID_DESTINATION`, `PROVIDER_BLOCKED` e
   `RATE_LIMITED` não são publicados. A interface apresenta apenas o
   `NotificationStatus` real e o `attemptCount`.
7. **Envio manual não é exposto.** `POST /notifications` está confirmado e o
   Data Source o implementa, mas não há área administrativa nem regra de produto
   que justifique oferecer envio avulso ao usuário comum, então nenhum
   formulário aparece na navegação.
8. **Reenvio é oferecido apenas em notificações com status `FAILED`.** É a única
   situação em que a ação faz sentido para o usuário, e usa exclusivamente o
   contrato confirmado.
9. **Sem polling.** A carga acontece na montagem e em ações explícitas
   (abrir a página, botão "Atualizar"), evitando requisições contínuas.
10. **Nenhum provider é executado no frontend.** Envio e reenvio apenas
    encaminham a solicitação ao serviço; no Mock Mode atualizam metadados
    demonstrativos, sem qualquer comunicação externa.
