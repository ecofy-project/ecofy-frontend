# Contratos analíticos consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente de `InsightsController`,
`GoalsController`, dos DTOs de requisição e resposta, dos enums de domínio, do
`RestExceptionHandler` e das rotas do `api-gateway`. Nenhum campo, enum,
endpoint ou métrica foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `GET` | `/insights/api/insights/v1/dashboard/{userId}` | Bundle do dashboard |
| `POST` | `/insights/api/insights/v1/generate` | Geração de análises |
| `GET` | `/insights/api/insights/v1/goals?userId=` | Listagem de metas |
| `POST` | `/insights/api/insights/v1/goals` | Criação de meta |
| `PUT` | `/insights/api/insights/v1/goals/{goalId}` | Atualização de meta |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma porta
ou URL direta do microsserviço é utilizada.

## Contratos confirmados

- `InsightsBundleResponse`: `insights`, `metrics` e `goals`.
- `MetricSnapshotResponse`: `id`, `userId`, `metricType`, `valueCents`,
  `currency`, `createdAt`.
- `InsightResponse`: `id`, `userId`, `type`, `score`, `title`, `summary`,
  `payload`, `createdAt`.
- `GoalResponse`: `id`, `userId`, `name`, `targetCents`, `currency`, `status`,
  `createdAt`, `updatedAt`.
- `GenerateInsightsRequest`: `userId`, `start`, `end` (`LocalDate`) e
  `granularity`, todos obrigatórios. O header `Idempotency-Key` é aceito.
- `CreateGoalRequest`: `userId`, `name` (`@NotBlank`, até 120 caracteres),
  `targetCents` (`@Positive`), `currency` (ISO de 3 letras) e `status`
  (opcional; o serviço aplica `ACTIVE` quando ausente).
- `UpdateGoalRequest`: `name`, `targetCents`, `currency` e `status`, todos
  opcionais e validados quando presentes.
- `MetricType`: `TOTAL_SPENT`, `INCOME`, `SAVINGS_RATE`.
- `InsightType`: `SPENDING_BREAKDOWN`, `CASHFLOW`, `ANOMALY`.
- `PeriodGranularity`: `DAY`, `WEEK`, `MONTH`.
- `GoalStatus`: `ACTIVE`, `PAUSED`, `ARCHIVED`.
- Chaves confirmadas de `InsightResponse.payload`, gravadas por
  `InsightGenerationService`: `periodStart`, `periodEnd`, `granularity`,
  `currency`, `totalSpentCents`, `totalIncomeCents`.
- Erros: corpo `{ timestamp, status, error, message, path, traceId, details }`,
  com o motivo em `details.reason`. Os motivos publicados são `GOAL_NOT_FOUND`
  (404), `INSIGHT_NOT_FOUND` (404), `IDEMPOTENCY_VIOLATION` (409),
  `BUSINESS_VALIDATION` (400), `CONSTRAINT_VIOLATION` (400),
  `MALFORMED_REQUEST` (400), `INVALID_ARGUMENT` (400) e
  **`EXTERNAL_DATA_UNAVAILABLE` (503)**, este último acompanhado de
  `details.source`.

## Decisões e divergências documentadas

1. **`SAVINGS_RATE` não é gerado pelo serviço.** O enum `MetricType` confirma a
   métrica, mas `InsightGenerationService` só grava snapshots de `TOTAL_SPENT` e
   `INCOME`. O dashboard apresenta os três cartões na ordem fixa do enum e, para
   a métrica ausente, informa "Ainda não informado pelo serviço". O valor nunca
   é calculado no frontend. O Mock Mode entrega a taxa pronta, no mesmo value
   object monetário do contrato (escala 2: `1840` representa 18,40%).
2. **Não existe listagem paginada de insights.** Os insights chegam apenas
   dentro do bundle do dashboard. Para manter um contrato interno único
   (`Page<Insight>`), a paginação e o recorte por tipo acontecem em
   `features/insights/utils/insight-projection.ts`, compartilhada por Mock e
   API, de modo que as regras são idênticas nos dois modos e nenhuma query inexistente é
   enviada. Assim a listagem funciona hoje em API Mode, usando a fonte real.
3. **Não existe filtro no contrato.** O recorte por `InsightType` usa o enum
   real e é aplicado sobre a coleção recebida, com o mesmo comportamento nos
   dois modos. O próprio controle informa isso ao usuário.
4. **Não existem endpoints de rebuild.** `POST /rebuild` e
   `GET /rebuild/{runId}` não são publicados. Implementá-los seria inventar
   contrato, então `requestRebuild` e `getRebuildStatus` são **opcionais** na
   interface: o Mock os implementa, permitindo validar confirmação,
   processamento e polling determinístico, e o Data Source de API os omite,
   fazendo a interface esconder a ação avançada nesse modo. O mesmo padrão já é
   usado em `CategorizationDataSource.listCategorizableTransactions`. Apenas o
   modo `MISSING` é oferecido; `FORCE` não existe.
5. **A geração é síncrona.** `POST /generate` responde `200 OK` com o bundle
   completo já atualizado, sem `202 Accepted` nem processamento pendente
   nesse fluxo.
6. **`GET /goals` não é paginado.** Devolve a lista completa do usuário, então o
   modelo interno também é uma lista, sem Pagination Adapter.
7. **Metas não possuem progresso.** `GoalResponse` publica apenas `targetCents`:
   não há valor acumulado, percentual nem data alvo. Por isso o `GoalCard` não
   apresenta barra nem anel de progresso, e nada é derivado de transações,
   orçamentos ou métricas.
8. **`score` é preservado, mas não exibido.** O campo pertence ao contrato e é
   mapeado para o modelo interno; a interface não o apresenta como julgamento
   analítico, e o `payload` bruto nunca é exibido.
9. **`userId` é resolvido pela sessão.** O contrato ainda exige `userId`
   explícito no dashboard, na geração, na listagem e na criação de metas. O
   valor vem do usuário autenticado, não é pedido em nenhum formulário e não é
   exibido. A autorização real permanece no backend.
10. **Não existe endpoint de atividade recente.** A lista é derivada do próprio
    bundle, ou seja, insights gerados (`createdAt`) e metas atualizadas (`updatedAt`),
    usando apenas carimbos de tempo do contrato. O comportamento é idêntico nos
    dois modos e nenhum endpoint fictício foi criado.
11. **Estado degradado.** É identificado por `status === 503` combinado com
    `details.reason === EXTERNAL_DATA_UNAVAILABLE`, através do Error Adapter,
    nunca pelo texto da mensagem, e nunca é apresentado como estado vazio.
    Quando já existem dados carregados, eles permanecem em tela e a degradação
    aparece como aviso.
