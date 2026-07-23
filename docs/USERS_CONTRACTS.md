# Contratos de conta consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente de `UserProfileController`,
`PreferencesController`, `ConnectionsController`, dos DTOs de requisição e
resposta, dos enums de domínio, do `RestExceptionHandler` de `ms-users` e das
rotas do `api-gateway`. Nenhum campo, enum ou endpoint foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `GET` | `/users/api/users/v1/profile/{userId}` | Dados do perfil |
| `PUT` | `/users/api/users/v1/profile/{userId}` | Atualização do perfil |
| `GET` | `/users/api/users/v1/preferences/{userId}` | Preferências da conta |
| `PUT` | `/users/api/users/v1/preferences/{userId}` | Atualização das preferências |
| `GET` | `/users/api/users/v1/connections?userId=&limit=` | Listagem de conexões |
| `POST` | `/users/api/users/v1/connections` | Criação de conexão |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma porta
ou URL direta do microsserviço é utilizada. As escritas (`PUT` e `POST`) enviam o
header `Idempotency-Key`, gerado por operação.

## Endpoints publicados que o frontend não consome

| Método | Caminho | Por que não é consumido |
| --- | --- | --- |
| `POST` | `/api/users/v1/profile` | O perfil é criado pelo próprio serviço ao consumir o evento de cadastro do `ms-auth` |
| vários | `InternalUsersSyncController` | Rota interna de sincronização entre serviços. O frontend **nunca** chama caminhos internos |

## Contratos confirmados

### Perfil

`UserProfileResponse`: `id`, `externalAuthId`, `fullName`, `email`, `phone`,
`status`, `createdAt` e `updatedAt`.

O modelo interno (`UserProfile`) mapeia apenas `fullName`, `email` e `phone`.
Os demais são publicados e deliberadamente ignorados: `id` e `externalAuthId`
são identificadores técnicos, e `status`, `createdAt` e `updatedAt` não são
apresentados em nenhuma tela.

`UpdateProfileRequest`: `fullName`, `email`, `phone` e `status`, todos opcionais
no DTO. O frontend envia `fullName` e `email` sempre, `phone` apenas quando
preenchido, e **nunca envia `status`**: alterar o estado da conta não é uma ação
do usuário na interface.

`PUT` responde **200 OK** com o perfil atualizado.

### Preferências

`UserPreferencesResponse`: `userId` e `preferences`, um `Map<String, String>`.

`UpdatePreferencesRequest`: `preferences` (`@NotEmpty`). O envio é sempre o mapa
completo, não um patch parcial.

`PreferenceKey` declara as chaves reconhecidas pelo domínio:
`DEFAULT_CURRENCY`, `LOCALE`, `NOTIFY_CHANNELS`, `TIMEZONE`, `DATE_FORMAT` e
`THEME`.

O contrato trafega um mapa aberto de strings, então o modelo interno também é
`Readonly<Record<string, string>>`. O `userId` da resposta não é exibido.

### Conexões

`ConnectionResponse`: `id`, `userId`, `type`, `provider`, `metadata`
(`Map<String, Object>`) e `createdAt`.

O modelo interno (`UserConnection`) mapeia apenas `type` e `provider`. O
`metadata` é conteúdo livre e pode carregar dados de integração, então não é
mapeado nem exibido; `id`, `userId` e `createdAt` também ficam de fora.

`CreateConnectionRequest`: `userId` (`@NotNull`), `type` (`@NotBlank`),
`provider` (`@NotBlank`) e `metadata` (opcional). O frontend não envia
`metadata`.

`POST` responde **201 Created** com `Location` e o corpo da conexão.

`GET /connections` aceita `userId` (obrigatório) e `limit`, com padrão 50 e teto
200 aplicados no servidor (`clamp`). A resposta é uma **lista simples**, sem
envelope de paginação, então o modelo interno também é uma lista.

### Enums de domínio

- `ConnectionType`: `BANK_API`, `CSV_IMPORT`, `OPEN_FINANCE`, `MANUAL`.
- `AccountProvider`: `ITAU`, `NUBANK`, `BRADESCO`, `SANTANDER`, `CAIXA`,
  `BANCO_DO_BRASIL`, `INTER`, `C6`, `OTHER`.
- `PreferenceKey`: `DEFAULT_CURRENCY`, `LOCALE`, `NOTIFY_CHANNELS`, `TIMEZONE`,
  `DATE_FORMAT`, `THEME`.
- `UserStatus`: `ACTIVE`, `PENDING`, `BLOCKED`. Publicado no perfil, mas não
  consumido pela interface.

### Erros

O corpo segue `{ code, message, timestamp, path }`, com o código na **raiz**,
que é o primeiro campo lido pelo Error Adapter da Etapa 1.

| Situação | Código | Status |
| --- | --- | --- |
| Perfil não encontrado | `USER_NOT_FOUND` | 404 |
| Conexão não encontrada | `CONNECTION_NOT_FOUND` | 404 |
| Violação de idempotência | `IDEMPOTENCY_VIOLATION` | 409 |
| Regra de negócio violada | `BUSINESS_VALIDATION` | 400 |
| Payload inválido | `INVALID_PAYLOAD` | 400 |
| Falha interna | `INTERNAL_ERROR` | 500 |

Diferente de outros serviços do EcoFy, o `ms-users` **não publica erros por
campo**: `MethodArgumentNotValidException` é convertida num `INVALID_PAYLOAD`
genérico, sem a lista de campos. A interface, portanto, não recebe `fieldErrors`
deste serviço e apresenta a validação de formulário a partir das próprias regras
de UX.

## Decisões e divergências documentadas

1. **`userId` vai no caminho, vindo da sessão.** Perfil e preferências usam o
   identificador na URL, e conexões o recebem como parâmetro e no corpo. O valor
   vem sempre do usuário autenticado (`UserResponse.id`, do `ms-auth`), nunca de
   formulário, e não é exibido. A autorização real permanece no backend.
2. **Campos técnicos não são mapeados.** `id`, `externalAuthId`, `userId`,
   `createdAt` e `updatedAt` são publicados nos três recursos e ficam fora do
   modelo interno, para que não haja como vazarem para a interface.
3. **`metadata` de conexão nunca é lido.** É um mapa aberto que pode conter
   dados de integração com a instituição financeira. O mapper o ignora, então
   não existe no modelo interno.
4. **O frontend não altera `status`.** `UpdateProfileRequest` aceita o campo,
   mas mudar o estado da conta não é ação do usuário: o valor não é enviado.
5. **As preferências são enviadas inteiras.** O contrato exige o mapa completo
   (`@NotEmpty`), então a atualização substitui o conjunto, e não apenas a chave
   alterada.
6. **Conexões não são paginadas.** O recurso aceita apenas `limit`, então o
   Pagination Adapter não é aplicado aqui. O frontend solicita o padrão de 50.
7. **Não há remoção nem edição de conexão.** O serviço publica apenas criação e
   listagem, então a interface não oferece essas ações.
8. **O perfil não é criado pelo frontend.** `POST /profile` existe, mas o perfil
   nasce do evento de cadastro publicado pelo `ms-auth` e consumido por
   `AuthUserCreatedEventMessage`. A interface apenas lê e atualiza.
9. **Rotas internas não são acessadas.** `InternalUsersSyncController` é
   comunicação entre serviços. O frontend não chama caminhos `/internal/**` nem
   envia `X-Internal-Token`.
10. **Rota do API Gateway.** O frontend usa `/users/api/users/v1/...`, apoiado na
    rota legada `Path=/users/**`. O gateway também declara o predicado versionado
    `/api/v1/users/**`, que reescreve para o mesmo destino. A divergência entre
    caminho público e de destino é comum a todas as features e deve ser resolvida
    de forma global.
