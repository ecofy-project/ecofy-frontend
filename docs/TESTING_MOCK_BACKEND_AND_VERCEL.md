# EcoFy Frontend: Mock Mode, backend local e demo na Vercel

Este guia mostra como executar e validar o frontend do EcoFy em três situações:

1. Mock Mode para desenvolvimento sem backend;
2. integração com o backend local por meio do API Gateway;
3. build da demonstração pública usada na Vercel.

> Todos os comandos abaixo foram escritos para PowerShell no Windows. Neste projeto, use `npm.cmd` para evitar conflitos com a política de execução do PowerShell.

## 1. Pré-requisitos

Antes de começar, confirme que estão instalados:

- Node.js compatível com o projeto;
- npm;
- dependências do frontend;
- API Gateway local, somente quando for testar o modo API.

Na raiz do projeto, instale as dependências:

```powershell
npm.cmd install
```

Os comandos seguintes devem ser executados em:

```text
C:\Users\mathe\Desktop\ecofy\ecofy-frontend
```

## 2. Como o modo de dados é selecionado

O frontend utiliza `VITE_APP_DATA_MODE` para escolher as Data Sources:

| Valor | Comportamento |
| --- | --- |
| `mock` | Usa Data Sources locais, dados fictícios e persistência no navegador. |
| `api` | Usa as Data Sources HTTP conectadas ao API Gateway. |

A UI não seleciona mocks diretamente. A decisão acontece na composição das dependências da aplicação.

As variáveis `VITE_*` são incorporadas ao bundle pelo Vite. Sempre reinicie o servidor ou gere um novo build depois de alterar essas variáveis.

## 3. Executar o Mock Mode padrão

O projeto já possui um arquivo `.env.mock` com o cenário padrão.

Execute:

```powershell
npm.cmd run dev -- --mode mock
```

Acesse:

```text
http://localhost:5173
```

### Credenciais fictícias

```text
Usuário: demo@ecofy.app
Senha: demo
```

Também é possível entrar usando o botão **Explorar demonstração**, sem preencher o formulário.

Essas credenciais são públicas e exclusivamente demonstrativas. Elas não pertencem a uma conta ou backend real.

## 4. Testar o build exato da demonstração

Para reproduzir localmente o build configurado para a Vercel:

```powershell
npm.cmd run build:demo
npm.cmd run preview
```

Acesse:

```text
http://localhost:4173
```

O script `build:demo` executa:

```text
tsc -b && vite build --mode demo
```

O Vite carrega `.env.demo`, gera os arquivos estáticos em `dist` e não exige URL de backend.

## 5. Cenários Mock disponíveis

O cenário principal é selecionado por `VITE_MOCK_SCENARIO`.

| Cenário | Uso |
| --- | --- |
| `default` | Demonstração completa com dados coerentes. |
| `empty` | Validação de estados vazios. |
| `error` | Falhas controladas de carregamento. |
| `loading` | Latência maior para observar skeletons e loading states. |
| `degraded` | Indisponibilidade parcial, especialmente de insights. |
| `processing` | Importação que permanece em processamento. |
| `profile-incomplete` | Perfil sem todos os dados. |
| `preferences-empty` | Conta sem preferências disponibilizadas. |
| `connections-empty` | Conta sem conexões. |
| `connections-multiple` | Conta com múltiplas conexões. |
| `categories-empty` | Nenhuma categoria cadastrada. |
| `category-create-error` | Falha de validação ao criar categoria. |
| `manual-error` | Falha ao aplicar categorização manual. |
| `budgets-empty` | Nenhum orçamento cadastrado. |
| `budget-single` | Um único orçamento, para validar o layout centralizado. |
| `budgets-multiple` | Todos os orçamentos, com paginação, filtros e ordenação. |
| `budget-paused` | Somente orçamentos com status `PAUSED`. |
| `budget-archived` | Somente orçamentos com status `ARCHIVED`. |
| `consumption-partial` | Somente orçamentos com consumo abaixo do limite. |
| `consumption-full` | Consumo igual ou acima do limite, incluindo 100% e 108%. |
| `budget-conflict` | Conflito de versão determinístico na primeira atualização. |
| `budget-error` | Falha controlada ao listar, criar, atualizar ou remover orçamentos. |
| `imports-empty` | Nenhuma importação no histórico. |
| `import-completed` | Importação concluída, com contadores completos. |
| `import-completed-with-errors` | Sucesso parcial, com erros por linha. |
| `import-failed` | Falha global do processamento. |
| `import-pending` | Job em `PENDING`, avançando por polling até concluir. |
| `import-running` | Job em `RUNNING` com contadores parciais, até concluir. |
| `import-already-processed` | `409 IMPORT_ALREADY_PROCESSED`, com link para a importação existente. |
| `import-idempotency-mismatch` | `409 IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`. |
| `import-file-too-large` | `413 FILE_SIZE_LIMIT_EXCEEDED`. |
| `import-unsupported-type` | `415 UNSUPPORTED_FILE_TYPE`. |
| `import-invalid-header` | `422 INVALID_FILE_HEADER`. |
| `import-error` | Falha controlada ao listar ou consultar importações. |
| `dashboard-default` | Dashboard completo, com as três métricas confirmadas. |
| `dashboard-empty` | Bundle vazio: métricas sem valor e sem atividade recente. |
| `dashboard-error` | Falha controlada ao carregar o bundle. |
| `dashboard-degraded` | `503` com `EXTERNAL_DATA_UNAVAILABLE`. |
| `insights-empty` | Nenhuma análise registrada. |
| `insight-generation-success` | Geração concluída com um novo insight. |
| `insight-generation-error` | Falha de validação ao gerar análises. |
| `rebuild-processing` | Reconstrução em andamento, concluindo por polling. |
| `rebuild-completed` | Reconstrução concluída imediatamente. |
| `goals-empty` | Nenhuma meta cadastrada. |
| `goals-multiple` | Metas em todos os status do domínio. |
| `goal-error` | Falha controlada ao listar ou salvar metas. |
| `notifications-empty` | Nenhuma notificação registrada. |
| `notifications-error` | Falha controlada ao listar notificações. |
| `notification-resend-failed` | Reenvio processado, mas o envio volta a falhar. |
| `notification-resend-error` | Falha de validação ao solicitar o reenvio. |

Qualquer cenário é iniciado passando o argumento para `npm run dev:mock`:

```powershell
npm.cmd run dev:mock -- scenario=error
npm.cmd run dev:mock -- scenario=profile-incomplete
npm.cmd run dev:mock -- scenario=connections-empty
```

O script aceita `scenario`, `auth`, `delay`, `roles`, `permissions` e `mode`, e
os argumentos podem ser combinados:

```powershell
npm.cmd run dev:mock -- scenario=empty auth=rate_limited delay=400
```

### Cenários de orçamentos

Os cenários de budgeting também podem ser definidos diretamente pela variável de
ambiente, sem depender de arquivos adicionais:

```powershell
$env:VITE_APP_DATA_MODE="mock"
$env:VITE_MOCK_SCENARIO="budget-conflict"

npm.cmd run dev
```

No cenário `budget-conflict`, a primeira tentativa de salvar uma edição retorna
`409` com o código `BUDGET_CONCURRENT_UPDATE`. A interface recarrega o orçamento,
apresenta os dados atuais e exige que o usuário revise antes de reenviar. O
`PUT` nunca é repetido automaticamente. A segunda tentativa, já com a versão
nova, é concluída com sucesso. O conflito é determinístico e não afeta a
demonstração pública, que roda no cenário `default`.

### Cenários de importação

```powershell
$env:VITE_APP_DATA_MODE="mock"
$env:VITE_MOCK_SCENARIO="import-pending"

npm.cmd run dev
```

O arquivo escolhido serve apenas como gatilho: seu conteúdo não é lido,
transferido nem armazenado, e apenas metadados do job entram no Mock Storage.

Nos cenários `import-pending` e `import-running`, o job volta em estado não
terminal e avança de forma determinística a cada consulta, permitindo validar o
polling controlado e a sua parada em status terminal.

O limite usado nas validações preliminares vem de
`VITE_MAX_IMPORT_FILE_SIZE_BYTES` (padrão de 10 MB, o mesmo valor do ambiente de
desenvolvimento do `ms-ingestion`). O backend continua sendo a autoridade final.

### Cenários analíticos

```powershell
$env:VITE_APP_DATA_MODE="mock"
$env:VITE_MOCK_SCENARIO="dashboard-degraded"

npm.cmd run dev
```

No cenário `dashboard-degraded`, o bundle responde `503` com
`details.reason = EXTERNAL_DATA_UNAVAILABLE`. A interface apresenta a mensagem
específica de indisponibilidade parcial, nunca um estado vazio, e preserva os
dados já carregados de outros serviços, como os orçamentos.

Em `rebuild-processing`, a reconstrução permanece em andamento por duas
consultas antes de concluir, permitindo validar o polling controlado e a sua
parada em estado terminal. A ação de reconstrução só aparece em Mock Mode: o
`ms-insights` ainda não publica esses endpoints.

### Cenários de autenticação

`VITE_MOCK_AUTH_SCENARIO` aceita:

| Cenário | Resultado |
| --- | --- |
| `success` | Login permitido com as credenciais fictícias. |
| `invalid_credentials` | Retorna credenciais inválidas. |
| `invalid_request` | Simula requisição inválida. |
| `rate_limited` | Simula excesso de tentativas. |
| `server_error` | Simula indisponibilidade do serviço de autenticação. |

Exemplo:

```powershell
$env:VITE_APP_DATA_MODE="mock"
$env:VITE_MOCK_SCENARIO="default"
$env:VITE_MOCK_AUTH_SCENARIO="rate_limited"
$env:VITE_MOCK_DELAY_MS="400"

npm.cmd run dev
```

## 6. Limpar variáveis temporárias do PowerShell

Variáveis definidas com `$env:` continuam ativas na sessão atual do PowerShell. Remova-as antes de alternar de Mock Mode para API Mode:

```powershell
Remove-Item Env:VITE_APP_DATA_MODE -ErrorAction SilentlyContinue
Remove-Item Env:VITE_APP_ENV -ErrorAction SilentlyContinue
Remove-Item Env:VITE_API_GATEWAY_URL -ErrorAction SilentlyContinue
Remove-Item Env:VITE_AUTH_CLIENT_ID -ErrorAction SilentlyContinue
Remove-Item Env:VITE_MOCK_SCENARIO -ErrorAction SilentlyContinue
Remove-Item Env:VITE_MOCK_AUTH_SCENARIO -ErrorAction SilentlyContinue
Remove-Item Env:VITE_MOCK_USER_ROLES -ErrorAction SilentlyContinue
Remove-Item Env:VITE_MOCK_USER_PERMISSIONS -ErrorAction SilentlyContinue
Remove-Item Env:VITE_MOCK_DELAY_MS -ErrorAction SilentlyContinue
```

Fechar a janela do PowerShell também descarta essas variáveis temporárias.

## 7. Executar com o backend local

O frontend deve se comunicar somente com o API Gateway. Não aponte o frontend diretamente para os microsserviços.

Considerando o Gateway em `http://localhost:8080`:

```powershell
$env:VITE_APP_DATA_MODE="api"
$env:VITE_APP_ENV="development"
$env:VITE_API_GATEWAY_URL="http://localhost:8080"
$env:VITE_AUTH_CLIENT_ID="SEU_CLIENT_ID_PUBLICO"

npm.cmd run dev
```

Acesse:

```text
http://localhost:5173
```

Substitua `SEU_CLIENT_ID_PUBLICO` pelo identificador público configurado no serviço de autenticação local.

### Regras importantes

- O Gateway deve estar iniciado antes dos testes funcionais.
- A URL precisa ser absoluta e usar HTTP ou HTTPS.
- Portas de microsserviços como `8081` até `8087` são recusadas pela configuração do frontend.
- CORS deve permitir a origem `http://localhost:5173`.
- O client ID pode ser público; client secret não pode ser colocado no frontend.
- Use uma conta disponibilizada pelo ambiente local do backend.

## 8. Usar `.env.local` para o backend

Para evitar definir as variáveis em toda sessão, crie um `.env.local` na raiz do projeto:

```dotenv
VITE_APP_DATA_MODE=api
VITE_APP_ENV=development
VITE_API_GATEWAY_URL=http://localhost:8080
VITE_AUTH_CLIENT_ID=SEU_CLIENT_ID_PUBLICO
```

Depois execute:

```powershell
npm.cmd run dev
```

O `.env.local` já está ignorado pelo Git e não deve ser versionado.

Não coloque nestes arquivos:

```text
Client secret
Token interno
Senha real
Chave privada
Credenciais de banco
```

Tudo que utiliza o prefixo `VITE_` pode ser lido no bundle do navegador.

## 9. Validar o build no modo API

Com as variáveis do modo API ativas:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

O preview será disponibilizado em:

```text
http://localhost:4173
```

O build falhará intencionalmente se `VITE_APP_DATA_MODE=api` for utilizado sem `VITE_API_GATEWAY_URL`.

## 10. Alternar rapidamente entre Mock e API

### Ir para Mock Mode

```powershell
Remove-Item Env:VITE_API_GATEWAY_URL -ErrorAction SilentlyContinue
Remove-Item Env:VITE_AUTH_CLIENT_ID -ErrorAction SilentlyContinue
$env:VITE_APP_DATA_MODE="mock"
$env:VITE_APP_ENV="development"
$env:VITE_MOCK_SCENARIO="default"
$env:VITE_MOCK_AUTH_SCENARIO="success"
npm.cmd run dev
```

### Ir para API Mode

```powershell
$env:VITE_APP_DATA_MODE="api"
$env:VITE_APP_ENV="development"
$env:VITE_API_GATEWAY_URL="http://localhost:8080"
$env:VITE_AUTH_CLIENT_ID="SEU_CLIENT_ID_PUBLICO"
npm.cmd run dev
```

Encerre o servidor atual com `Ctrl+C` antes de iniciar o outro modo.

## 11. Variáveis da demo na Vercel

No painel da Vercel, abra:

```text
Project → Settings → Environment Variables
```

Cadastre para **Production** e **Preview**:

```dotenv
VITE_APP_DATA_MODE=mock
VITE_APP_ENV=demo
VITE_MOCK_SCENARIO=default
VITE_MOCK_AUTH_SCENARIO=success
VITE_MOCK_USER_ROLES=
VITE_MOCK_USER_PERMISSIONS=
VITE_MOCK_DELAY_MS=400
```

Não cadastre na demonstração pública:

```text
VITE_API_GATEWAY_URL
VITE_AUTH_CLIENT_ID
VITE_CLIENT_SECRET
Tokens ou senhas reais
URLs internas
Credenciais de banco
```

O arquivo `.env.demo` já contém as variáveis não sensíveis necessárias. Configurá-las também no painel da Vercel é opcional, mas torna o ambiente mais explícito e auditável.

Variáveis cadastradas no painel da Vercel prevalecem sobre os valores dos arquivos `.env` durante o build.

## 12. Configuração de build da Vercel

O `vercel.json` do projeto define:

```text
Framework: Vite
Build Command: npm run build:demo
Output Directory: dist
```

Também existe um rewrite de SPA:

```text
/(.*) → /index.html
```

Esse rewrite permite abrir e atualizar diretamente rotas como:

```text
/login
/budgets
/imports
/goals
/notifications
```

O arquivo também adiciona cabeçalhos defensivos, incluindo Content Security Policy, proteção contra framing, política de referência e bloqueio de câmera, microfone e geolocalização.

## 13. Checklist do Mock Mode

Depois de iniciar a aplicação, valide:

- login pelo botão **Explorar demonstração**;
- login manual com `demo@ecofy.app` e `demo`;
- exatamente três métricas no Dashboard;
- criação de categoria;
- criação ou edição de orçamento;
- seleção e simulação de importação;
- criação ou edição de meta;
- geração de insight;
- marcação das notificações como lidas;
- persistência após atualizar o navegador;
- temas light, dark e system;
- opção **Restaurar demonstração** no menu da conta;
- retorno dos dados ao seed inicial depois da restauração;
- ausência de requisições para backend no DevTools.

## 14. Checklist do backend local

Com `VITE_APP_DATA_MODE=api`, valide:

- API Gateway respondendo em `http://localhost:8080`;
- CORS liberado para o frontend;
- client ID público correto;
- autenticação com uma conta local válida;
- chamadas HTTP direcionadas somente ao Gateway;
- respostas 401, 403, 404, 422, 429 e 5xx tratadas pela UI;
- correlação e mensagens de erro sem detalhes internos;
- nenhuma chamada direta às portas dos microsserviços.

## 15. Solução de problemas

### O frontend continua usando o modo anterior

Encerre o Vite com `Ctrl+C`, verifique as variáveis `$env:` e inicie novamente. Variáveis do processo têm prioridade sobre arquivos `.env`.

### O modo API informa que o Gateway não está configurado

Confirme:

```powershell
$env:VITE_APP_DATA_MODE
$env:VITE_API_GATEWAY_URL
```

O resultado esperado é:

```text
api
http://localhost:8080
```

### O login do backend não funciona

Verifique o `VITE_AUTH_CLIENT_ID`, a disponibilidade do serviço de autenticação, CORS e as credenciais da conta local.

### A porta 5173 está ocupada

O projeto utiliza `strictPort`. Encerre a outra instância antes de executar novamente:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen
```

### A porta 4173 está ocupada

Localize a instância do preview:

```powershell
Get-NetTCPConnection -LocalPort 4173 -State Listen
```

### Quero apagar somente as alterações da demo no navegador

Use **Menu da conta → Restaurar demonstração**. Não é necessário limpar manualmente o armazenamento do navegador.

## 16. Resumo rápido

Mock para desenvolvimento:

```powershell
npm.cmd run dev -- --mode mock
```

Demo equivalente à Vercel:

```powershell
npm.cmd run build:demo
npm.cmd run preview
```

Backend local:

```powershell
$env:VITE_APP_DATA_MODE="api"
$env:VITE_APP_ENV="development"
$env:VITE_API_GATEWAY_URL="http://localhost:8080"
$env:VITE_AUTH_CLIENT_ID="SEU_CLIENT_ID_PUBLICO"
npm.cmd run dev
```

Demo pública na Vercel:

```dotenv
VITE_APP_DATA_MODE=mock
VITE_APP_ENV=demo
VITE_MOCK_SCENARIO=default
VITE_MOCK_AUTH_SCENARIO=success
VITE_MOCK_DELAY_MS=400
```
