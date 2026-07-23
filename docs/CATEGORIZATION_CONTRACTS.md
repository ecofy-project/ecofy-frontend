# Contratos de categorização consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente dos controllers e enums de
`ms-categorization`. Nenhum campo, enum ou operador foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `GET` | `/categorization/api/categorization/v1/categories` | Listagem de categorias |
| `POST` | `/categorization/api/categorization/v1/categories` | Criação de categoria |
| `GET` | `/categorization/api/categorization/v1/rules` | Listagem de regras ativas |
| `POST` | `/categorization/api/categorization/v1/rules` | Criação de regra |
| `POST` | `/categorization/api/categorization/v1/manual` | Categorização manual |
| `GET` | `/categorization/api/categorization/v1/suggestions/{transactionId}` | Consulta de sugestão |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma URL
direta do microsserviço é utilizada.

## Contratos confirmados

- `CreateCategoryRequest`: `name` (obrigatório, `@NotBlank`), `color` (opcional).
- `CategoryResponse`: `id`, `name`, `color`, `active`.
- `CreateRuleRequest`: `categoryId`, `name`, `status`, `priority`, `conditions`
  (não vazio).
- `RuleResponse`: `id`, `categoryId`, `name`, `status`, `priority`, `conditions`,
  `createdAt`, `updatedAt`.
- `RuleCondition`: `field`, `operator`, `value`, `weight` (opcional, padrão 1).
- `RuleStatus`: `ACTIVE`, `INACTIVE`.
- `MatchOperator`: `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`, `REGEX`,
  `EQUALS_IGNORE_CASE`, `AMOUNT_GREATER_THAN`, `AMOUNT_LESS_THAN`,
  `CURRENCY_EQUALS`.
- Campos aceitos em `RuleCondition.field`: `description`, `merchant`,
  `currency`, `amount`.
- `ManualCategorizationRequest`: `transactionId`, `categoryId`, `rationale`
  (opcional).
- `CategorizationResponse`: `transactionId`, `categorized`, `categoryId`,
  `suggestionId`, `decision`, `score`.
- `SuggestionResponse`: `id`, `transactionId`, `categoryId`, `ruleId`, `status`,
  `score`, `rationale`.
- `SuggestionStatus`: `SUGGESTED`, `APPLIED_AUTO`, `APPLIED_MANUAL`, `REJECTED`,
  `UNMATCHED`.

## Pendências e decisões documentadas

1. **Não existe listagem de sugestões.** O serviço publica somente
   `GET /suggestions/{transactionId}`. A página de sugestões é, portanto, uma
   consulta sob demanda por transação, e não uma listagem.
2. **Não existe listagem de transações no gateway.** O contrato de
   categorização manual exige um `transactionId`, mas nenhum endpoint publica
   transações. `CategorizationDataSource.listCategorizableTransactions` é
   opcional: o Mock Mode a implementa a partir do Mock Storage e o API Mode a
   omite, fazendo a interface solicitar o identificador diretamente.
3. **`CURRENCY_EQUALS` não é oferecido na UI.** O valor existe no enum
   `MatchOperator`, mas o `RuleEngine` não o avalia em nenhum campo. Oferecê-lo
   permitiria criar regras que nunca correspondem. Os operadores exibidos por
   campo seguem as combinações efetivamente avaliadas pelo motor.
4. **Sem edição ou exclusão de categorias e regras.** O serviço não publica
   `PUT`, `PATCH` ou `DELETE` para esses recursos, então a interface não oferece
   essas ações.
5. **Rota do API Gateway.** O frontend usa o caminho
   `/categorization/api/categorization/v1/...`, mantendo o padrão já adotado por
   `auth` e `users`. A configuração atual do `api-gateway` declara o predicado
   público `/api/v1/categorization/**`, que reescreve para esse mesmo caminho de
   destino. A divergência entre o caminho público e o de destino é comum a todas
   as features e deve ser resolvida de forma global, não apenas nesta etapa.
