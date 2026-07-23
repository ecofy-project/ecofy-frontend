# Contratos de orçamento consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente de `BudgetController`, dos DTOs
de requisição e resposta, dos enums de domínio e do `RestExceptionHandler` de
`ms-budgeting`, além das rotas do `api-gateway`. Nenhum campo, enum, filtro ou
endpoint foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `GET` | `/budgeting/api/budgeting/v1/budgets?userId=` | Listagem de orçamentos |
| `POST` | `/budgeting/api/budgeting/v1/budgets` | Criação |
| `GET` | `/budgeting/api/budgeting/v1/budgets/{id}` | Consulta individual |
| `PUT` | `/budgeting/api/budgeting/v1/budgets/{id}` | Atualização |
| `DELETE` | `/budgeting/api/budgeting/v1/budgets/{id}` | Remoção |
| `GET` | `/budgeting/api/budgeting/v1/budgets/overview?userId=` | Consumo consolidado |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma porta
ou URL direta do microsserviço é utilizada. `POST`, `PUT` e `DELETE` enviam o
header `Idempotency-Key`, aceito pelo controller.

## Contratos confirmados

- `CreateBudgetRequest`: `userId` (`@NotNull`), `categoryId` (`@NotNull`),
  `periodType` (`@NotNull`), `periodStart` e `periodEnd` (`LocalDate`,
  `@NotNull`), `limitAmount` (`BigDecimal`, `@NotNull`, `@DecimalMin("0.01")`),
  `currency` (`@NotBlank`) e `status` (opcional).
- `UpdateBudgetRequest`: `newLimitAmount` (`@DecimalMin("0.01")`), `currency` e
  `status`, todos opcionais. Campos nulos permanecem inalterados.
- `BudgetResponse`: `id`, `userId`, `categoryId`, `periodType`, `periodStart`,
  `periodEnd`, `status`, `currency`, `limitAmount` (decimal em string),
  `createdAt`, `updatedAt`.
- `BudgetOverviewResponse`: `userId`, `consumptions` e `alerts`. Cada consumo
  (`BudgetConsumptionResult`) publica `budgetId`, `consumedAmount`,
  `limitAmount` e `consumedPct`.
- `BudgetStatus`: `ACTIVE`, `PAUSED`, `ARCHIVED`.
- `BudgetPeriodType`: `MONTHLY`, `WEEKLY`, `CUSTOM`.
- Criação sem `status` é ativada pelo próprio serviço
  (`BudgetCommandService` aplica `BudgetStatus.ACTIVE` quando o campo é nulo).
- Erros: o `RestExceptionHandler` responde `400` para validação e regra de
  negócio, `404` para orçamento inexistente, `409` para
  `BUDGET_ALREADY_EXISTS` e `IDEMPOTENCY_VIOLATION` (ambos em `details.reason`)
  e `500` para falhas internas, sempre sem stack trace.

## Decisões e divergências documentadas

1. **A listagem não é paginada no servidor.** `GET /budgets` recebe apenas
   `userId` e devolve `List<BudgetResponse>`. Não existem `page`, `size`, `sort`
   nem filtros. Para manter um contrato interno único, a feature trabalha com
   `Page<Budget>` e a projeção (filtro, ordenação e paginação) acontece em
   `features/budgets/utils/budget-projection.ts`, compartilhada pelo Mock e pela
   API, de modo que as regras são idênticas nos dois modos e nenhuma query inexistente é
   enviada. Se o backend passar a paginar, basta mover a projeção para a query.
2. **Os filtros de status e categoria são aplicados sobre a coleção recebida.**
   Não há filtro server-side no contrato atual. A ordenação usa exclusivamente
   propriedades reais do recurso: `createdAt`, `updatedAt`, `periodStart`,
   `periodEnd`, `status` e `categoryId`.
3. **`userId` é resolvido pela sessão, nunca pelo formulário.** O contrato ainda
   exige `userId` explícito na criação, na listagem e no overview. O valor vem do
   usuário autenticado (`SessionStore.getUserId`), não é exibido em nenhum lugar
   da interface e não é usado como fonte de autorização. Essa continua sendo
   responsabilidade do backend, a partir do JWT.
4. **`version` não é publicado por `BudgetResponse`.** O modelo interno mantém
   `version` como campo opcional: ele é preservado quando existir, nunca é
   gerado pelo frontend e não é enviado no `PUT` enquanto o contrato não
   publicar o campo. O Mock Mode mantém a versão para reproduzir o fluxo de
   conflito.
5. **`BUDGET_CONCURRENT_UPDATE` ainda não é emitido pelo serviço.** Os motivos de
   `409` publicados hoje são `BUDGET_ALREADY_EXISTS` e `IDEMPOTENCY_VIOLATION`.
   A interface interpreta o `409` pelo motivo, nunca assumindo que todo `409` é
   conflito de versão, e trata os três casos com o mesmo fluxo seguro:
   informar, recarregar o orçamento atual, apresentar os dados e exigir um novo
   envio explícito. O Mock Mode reproduz `BUDGET_CONCURRENT_UPDATE` de forma
   determinística para validar esse fluxo.
6. **O overview é um objeto, não uma lista.** `BudgetOverviewResponse` devolve
   `{ userId, consumptions, alerts }`. O modelo interno projeta apenas
   `consumptions`; `userId` não é exibido e os alertas chegam ao usuário por
   notificações, então nenhuma tela de alertas foi criada.
7. **O consumo nunca é calculado no frontend.** `consumedAmount`, `limitAmount` e
   `consumedPct` são exibidos exatamente como recebidos. Quando o percentual
   ultrapassa 100, a barra de progresso limita apenas a largura visual e o texto
   continua informando o valor real.
8. **Valores monetários usam decimal, não centavos.** `limitAmount` trafega como
   string decimal e só é convertido para `Money` na apresentação, pelo Money
   Adapter da Etapa 1.
9. **Rota do API Gateway.** O frontend usa `/budgeting/api/budgeting/v1/...`,
   mantendo o padrão de `auth`, `users` e `categorization`. O gateway declara o
   predicado público `/api/v1/budgeting/**`, que reescreve para esse mesmo
   caminho de destino, e também mantém a rota legada `/budgeting/**`. A
   divergência entre caminho público e de destino é comum a todas as features e
   deve ser resolvida de forma global.
