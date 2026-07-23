# Contratos de autenticação consumidos pelo frontend

Todos os contratos abaixo foram lidos diretamente de `AuthController`,
`RegistrationController`, `PasswordController`, `UserProfileController`, dos DTOs
de requisição e resposta, do enum `AuthErrorCode`, dos enums de domínio e das
rotas do `api-gateway`. Nenhum campo, código de erro ou endpoint foi inventado.

## Endpoints utilizados

| Método | Caminho | Uso no frontend |
| --- | --- | --- |
| `POST` | `/auth/api/auth/token` | Login e obtenção dos tokens |
| `POST` | `/auth/api/register` | Cadastro de usuário |
| `POST` | `/auth/api/register/confirm-email` | Confirmação de e-mail |
| `POST` | `/auth/api/password/reset-request` | Solicitação de redefinição de senha |
| `POST` | `/auth/api/password/reset-confirm` | Confirmação da nova senha |
| `GET` | `/auth/api/user/me` | Dados do usuário autenticado |

Todas as chamadas passam pelo HTTP Client apontado ao API Gateway. Nenhuma porta
ou URL direta do microsserviço é utilizada.

## Endpoints publicados que o frontend não consome

O `ms-auth` publica mais recursos do que a interface utiliza. Estão listados aqui
para deixar claro que a ausência é deliberada, não um esquecimento:

| Método | Caminho | Por que não é consumido |
| --- | --- | --- |
| `POST` | `/api/auth/refresh` | O refresh automático de token ainda não foi implementado na interface |
| `POST` | `/api/auth/revoke` | O logout atual apenas descarta a sessão local |
| `POST` | `/api/auth/validate` | A validação de token é responsabilidade do gateway e dos serviços |
| `GET` | `/.well-known/jwks.json` | Recurso de infraestrutura, consumido entre serviços |
| vários | `AdminUserController`, `ClientApplicationController` | Não há área administrativa no frontend |

## Contratos confirmados

### Login

`LoginRequest`: `clientId` (`@NotBlank`), `clientSecret`, `username`
(`@NotBlank`), `password` (`@NotBlank`) e `scope`.

O frontend envia apenas `clientId`, `username` e `password`. O `clientId` vem de
`VITE_AUTH_CLIENT_ID`; quando ausente, a origem de dados falha antes da
requisição, com `AUTH_CLIENT_ID_NOT_CONFIGURED` (503).

`TokenResponse`: `tokenType`, `accessToken`, `refreshToken` e `expiresIn`
(`long`, em segundos). Os quatro campos são obrigatórios no mapper: qualquer
ausência resulta em `INCOMPATIBLE_AUTH_RESPONSE` (502).

### Cadastro e confirmação

`RegisterUserRequest`: `email` (`@Email`, `@NotBlank`), `password`
(`@NotBlank`, entre 8 e 100 caracteres), `firstName` (`@NotBlank`), `lastName`
(`@NotBlank`) e `locale` (opcional). O frontend não envia `locale`.

`POST /register` responde **201 Created**, com `Location` apontando para
`/api/user/me` e o corpo em `UserResponse`. O frontend ignora o corpo: após o
cadastro, o fluxo segue para a confirmação de e-mail.

`ConfirmEmailRequest`: `token`. Responde **200 OK** com `UserResponse`.

### Redefinição de senha

`PasswordResetRequest`: `email`. Responde **202 Accepted**, sem corpo.

`PasswordResetConfirmRequest`: `token` e `newPassword`. Responde
**204 No Content**.

Ambos devolvem resposta vazia, então o frontend trata apenas o status.

### Usuário autenticado

`UserResponse`: `id`, `email`, `fullName`, `status`, `emailVerified`, `roles`,
`permissions`, `createdAt`, `updatedAt` e `lastLoginAt`.

O modelo interno (`AuthenticatedUser`) mapeia os sete primeiros. `createdAt`,
`updatedAt` e `lastLoginAt` são publicados mas não consumidos: nenhuma tela os
apresenta hoje.

### Enums de domínio

- `AuthUserStatus`: `PENDING_EMAIL_CONFIRMATION`, `ACTIVE`, `LOCKED`, `BLOCKED`,
  `DELETED`.
- `GrantType`: `AUTHORIZATION_CODE`, `CLIENT_CREDENTIALS`, `PASSWORD`,
  `REFRESH_TOKEN`.
- `TokenType` e `ClientType` existem no domínio, mas não trafegam nos contratos
  consumidos pela interface.

### Erros

O corpo segue
`{ timestamp, status, errorCode, message, path, traceId, details[] }`, com cada
detalhe no formato `{ field, code, message }`.

O `errorCode` fica na **raiz** da resposta, e é exatamente o formato que o Error
Adapter da Etapa 1 já lê primeiro. Os detalhes por campo alimentam os
`fieldErrors` usados nos formulários.

Códigos publicados por `AuthErrorCode` que alcançam os fluxos da interface:

| Situação | Código | Status |
| --- | --- | --- |
| Credenciais inválidas | `INVALID_CREDENTIALS` | 401 |
| E-mail já cadastrado | `EMAIL_ALREADY_REGISTERED` | 409 |
| E-mail já confirmado | `EMAIL_ALREADY_CONFIRMED` | 409 |
| Usuário não encontrado | `USER_NOT_FOUND` | 404 |
| Usuário bloqueado | `USER_BLOCKED` | 403 |
| Usuário travado | `USER_LOCKED` | 403 |
| E-mail não verificado | `EMAIL_NOT_VERIFIED` | 403 |
| Token de confirmação inválido | `EMAIL_CONFIRMATION_TOKEN_INVALID` | 400 |
| Token de confirmação expirado | `EMAIL_CONFIRMATION_TOKEN_EXPIRED` | 400 |
| Token de redefinição inválido | `PASSWORD_RESET_TOKEN_INVALID` | 400 |
| Token de redefinição expirado | `PASSWORD_RESET_TOKEN_EXPIRED` | 400 |
| Token de redefinição já usado | `PASSWORD_RESET_TOKEN_ALREADY_USED` | 400 |
| Política de senha violada | `PASSWORD_POLICY_VIOLATION` | 400 |
| Senha fraca | `WEAK_PASSWORD` | 400 |
| Dados de cadastro inválidos | `INVALID_REGISTRATION_DATA` | 400 |
| Sessão não autenticada | `CURRENT_USER_NOT_AUTHENTICATED` | 401 |
| Token expirado | `TOKEN_EXPIRED` | 401 |
| Limite de tentativas excedido | `RATE_LIMIT_EXCEEDED` | 429 |
| Autenticação bloqueada temporariamente | `AUTHENTICATION_TEMPORARILY_BLOCKED` | 429 |
| Cliente sem permissão para o grant | `CLIENT_NOT_ALLOWED_FOR_GRANT_TYPE` | 403 |

`AuthErrorCode` declara outros códigos ligados a JWKS, revogação de token e
gestão de clientes. Eles não alcançam os fluxos da interface e, por isso, não
recebem tratamento específico: caem na apresentação genérica do Error Adapter.

## Decisões e divergências documentadas

1. **`clientSecret` nunca é enviado.** `LoginRequest` aceita o campo, mas ele é
   um segredo e não pode existir num bundle público. O carregador de
   configuração (`services/config/env.ts`) recusa qualquer variável `VITE_*`
   cujo nome contenha `CLIENT_SECRET`, `INTERNAL_TOKEN` ou `PRIVATE_KEY`, e a
   verificação do bundle confirma que nenhum valor desses é publicado.
2. **O login não devolve o usuário.** `POST /token` responde apenas com os
   tokens. Por isso o `SessionProvider` encadeia uma segunda chamada a
   `GET /user/me` logo após o login e, se ela falhar, desfaz a sessão em vez de
   deixar o usuário autenticado sem identidade.
3. **Não há refresh automático de token.** `POST /refresh` existe no contrato,
   mas a interface ainda não o utiliza: quando o `accessToken` expira, a
   resposta `401` leva ao fluxo de sessão global. `expiresIn` é recebido e
   preservado, ficando pronto para quando o refresh for implementado.
4. **O logout é local.** `POST /revoke` não é chamado: a sessão é descartada no
   cliente. Enquanto o refresh token não for revogado no servidor, o encerramento
   permanece sendo apenas do lado do navegador.
5. **A sessão do modo API vive em `sessionStorage`.** O `SessionStore` usa
   `sessionStorage` quando `VITE_APP_DATA_MODE=api` e `localStorage` apenas no
   Mock Mode, onde os dados são fictícios por definição.
6. **`userId` vem sempre da sessão.** Os serviços de budgeting, insights e
   notification ainda exigem `userId` explícito em alguns contratos. Esse valor é
   lido de `SessionStore.getUserId`, derivado do `UserResponse.id`, e nunca é
   pedido em formulário nem exibido. A autorização real permanece no backend, a
   partir do JWT.
7. **Rota do API Gateway.** O frontend usa `/auth/api/...`, apoiado na rota
   legada `Path=/auth/**`. O gateway também declara o predicado versionado
   `/api/v1/auth/**`, que reescreve para `/auth/api/v1/auth...`. Os controllers
   respondem nos dois prefixos (`/api/v1/auth` e `/api/auth`). A divergência
   entre caminho público e de destino é comum a todas as features e deve ser
   resolvida de forma global.
8. **Cenários de falha no Mock Mode.** `VITE_MOCK_AUTH_SCENARIO` reproduz
   `success`, `invalid_credentials`, `invalid_request`, `rate_limited` e
   `server_error`, todos com o mesmo `ApiError` do modo API, de modo que a
   interface reage de forma idêntica nos dois modos.
