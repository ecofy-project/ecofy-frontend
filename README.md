# EcoFy Frontend

Interface web do **EcoFy**, uma plataforma de gestão financeira pessoal: importação de extratos, categorização automática, orçamentos, metas, análises e notificações.

O projeto é um SPA em **React 19 + TypeScript + Vite**, construído sobre um design system próprio e uma arquitetura em *features* com inversão de dependência entre a UI e as fontes de dados. Isso permite rodar a aplicação inteira **sem backend nenhum** (Mock Mode) ou conectada ao **API Gateway** real, trocando apenas uma variável de ambiente, sem alterar uma única linha de componente.

## 🔗 Demonstração online

**<https://ecofy-frontend.vercel.app/login>**

A demo roda em **Mock Mode**: todos os módulos funcionam de verdade, mas sem backend, sem banco e sem qualquer chamada de rede para fora. Nenhum dado real é coletado, transmitido ou armazenado em servidor.

### Como acessar

Há dois caminhos, e o primeiro é o mais rápido:

1. **Botão “Explorar demonstração”**: entra direto, sem digitar nada.
2. **Login manual**, com as credenciais fictícias exibidas na própria tela:

   ```text
   Usuário: demo@ecofy.app
   Senha:   demo
   ```

Essas credenciais são públicas e propositalmente fictícias: não existem em nenhum backend e não dão acesso a conta alguma.

### O que dá para testar

Depois de entrar, todos os módulos da navegação estão populados com dados demonstrativos coerentes entre si: o orçamento de Lazer que aparece estourado no dashboard é o mesmo que aparece em Orçamentos, e a análise que gerou a notificação é a mesma listada em Insights.

| Módulo | O que experimentar |
| --- | --- |
| **Dashboard** | As três métricas do contrato (total gasto, receitas, taxa de economia), resumo de orçamentos, análises e metas, e atividade recente |
| **Importações** | Arraste um `.csv` ou `.ofx` para a área de envio (ou clique para escolher). O arquivo **não é lido nem armazenado**: serve só de gatilho. Acompanhe envio → processamento → resultado, e abra “Ver detalhes” |
| **Categorias & Regras** | Crie uma categoria e monte uma regra pelo assistente de múltiplos passos |
| **Categorização manual** | Aplique uma categoria a uma transação demonstrativa |
| **Orçamentos** | Crie e edite orçamentos, use filtros e ordenação, veja o consumo e a paginação |
| **Metas** | Crie e edite metas com valor alvo, moeda e status |
| **Insights** | Gere análises para um período, filtre por tipo e use a reconstrução de análises ausentes |
| **Notificações** | Central completa e o resumo pelo sino da barra superior |
| **Perfil / Preferências / Conexões** | Formulários da área de conta |
| **Design System** | Página viva com os fundamentos e componentes da interface |

Vale testar também o **seletor de tema** (claro, escuro e sistema) e **redimensionar a janela**: o layout foi auditado de 320px até 2560px, incluindo orientação paisagem e zoom de 200%.

### Restaurar os dados

Tudo o que você criar fica **apenas no seu navegador** (`localStorage`), então a demo é sua e não interfere na de mais ninguém. Para voltar ao cenário inicial:

> Menu da conta (canto superior direito) → **Restaurar demonstração**

Isso recria o seed original de todos os módulos de uma vez e desconecta a sessão.

### Detalhes úteis

- **Recarregar qualquer rota funciona.** Endereços como `/budgets` ou `/imports` podem ser abertos direto ou atualizados com F5, porque a Vercel reescreve todas as rotas para o `index.html` e a sessão da demo persiste.
- **Nenhuma requisição de rede sai da aplicação.** Se abrir o DevTools, a aba Network não mostrará chamadas de API, apenas os assets do próprio site.
- **Funciona em celular.** A navegação inferior substitui a barra lateral, com o menu “Mais” para os módulos secundários.

---

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Como funciona o Mock Mode](#como-funciona-o-mock-mode)
- [Rodando localmente](#rodando-localmente)
- [Scripts](#scripts)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Cenários de demonstração](#cenários-de-demonstração)
- [Modo API](#modo-api)
- [Rotas](#rotas)
- [Testes e qualidade](#testes-e-qualidade)
- [Deploy](#deploy)
- [Documentação](#documentação)
- [Status do desenvolvimento](#status-do-desenvolvimento)

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, TypeScript 5.8 |
| Build | Vite 7 |
| Estilos | CSS puro com design system próprio em custom properties |
| Tipografia | Plus Jakarta Sans (variável) + IBM Plex Mono, via `@fontsource` |
| Roteamento | Router próprio sobre `History API` + `useSyncExternalStore` |
| Testes | `node:test` (runner nativo do Node) |
| Lint | ESLint 9 (flat config) + `typescript-eslint` |
| Hospedagem | Vercel |

Sem dependências de runtime além de React e das fontes: roteamento, cliente HTTP, tratamento de erros, paginação e aritmética monetária são implementados no próprio projeto.

---

## Arquitetura

```
src/
├── app/                    # Composição da aplicação
│   ├── config/             # Injeção de dependências (create-app-dependencies)
│   ├── layout/             # AppShell, navegação, tema
│   ├── providers/          # Session, Theme, Demo, AppDependencies
│   └── routing/            # Router, guards de rota pública/protegida
├── components/             # Componentes reutilizáveis (ui/, finance/)
├── design-system/          # Tokens, temas, tipografia e estilos por área
├── features/               # Cada domínio isolado
│   ├── auth/               # Login, registro, recuperação e confirmação
│   ├── users/              # Perfil, preferências, conexões
│   ├── categories/         # Categorias, regras, categorização manual
│   ├── budgets/            # Orçamentos e consumo
│   ├── imports/            # Envio de arquivo, histórico e detalhes
│   ├── insights/           # Análises, geração e reconstrução
│   ├── goals/              # Metas
│   ├── notifications/      # Central e resumo na Topbar
│   ├── dashboard/          # Visão consolidada
│   └── foundation/         # Página viva do design system
├── mocks/                  # Data sources fictícias, seed e cenários
├── services/               # config, http, errors, money, pagination, session
└── shared/                 # Utilitários de DOM
```

**Cada feature segue a mesma divisão:**

```
feature/
├── components/     # UI específica do domínio
├── data-sources/   # Contrato (interface) + implementação HTTP + mappers
├── hooks/          # Estado e orquestração da UI
├── pages/          # Composição da tela
├── services/       # Regras de aplicação, agnósticas de transporte
├── types/          # Modelos do domínio
└── utils/          # Formatação e projeções de apresentação
```

**Princípio central:** a UI depende sempre de uma *interface* de data source, nunca de uma implementação. A escolha entre mock e HTTP acontece **uma única vez**, em `src/app/config/create-app-dependencies.ts`, com base em `VITE_APP_DATA_MODE`. Nenhum componente, hook ou página sabe se está falando com dados fictícios ou com o backend.

```
Página / Componente
        ↓
  Hook / Service
        ↓
  FeatureDataSource  (interface)
        ↓
create-app-dependencies
    ↙         ↘
  Mock        API → HTTP Client → API Gateway → microsserviço
```

Outros pontos de destaque:

- **Configuração validada em tempo de carga** (`src/services/config/env.ts`): variáveis inválidas falham rápido e com mensagem explícita. Há uma verificação que impede a exposição acidental de segredos (`CLIENT_SECRET`, `INTERNAL_TOKEN`, `PRIVATE_KEY`) no bundle, e outra que rejeita URLs apontando direto para microsserviços em vez do API Gateway.
- **Cliente HTTP próprio** com timeout, `correlation-id` por requisição, injeção de token de sessão e normalização de erros via Error Adapter, de modo que nenhuma tela exibe payload bruto ou stack trace.
- **Aritmética monetária dedicada** (`services/money`), com `bigint`, evitando erros de ponto flutuante em valores financeiros.
- **O frontend não calcula regra de negócio.** Consumo de orçamento, métricas, percentuais e contadores de importação são sempre apresentados como o backend os publica.

---

## Como funciona o Mock Mode

Com `VITE_APP_DATA_MODE=mock`, cada feature recebe uma implementação fictícia do seu Data Source, todas apoiadas num **Mock Storage central** (`src/mocks/demo/`) persistido em `localStorage`.

O que isso significa na prática:

- a aplicação **sobe e funciona inteira sem backend**, banco ou Docker;
- criar, editar e remover realmente altera o estado e sobrevive ao reload;
- erros, latência e estados assíncronos são simulados com o mesmo `ApiError` do modo API, então a UI não sabe diferenciar;
- **nada sai do navegador**: nenhum arquivo enviado é lido ou guardado, nenhum provider é acionado, nenhuma requisição externa acontece.

---

## Rodando localmente

**Pré-requisitos:** Node.js compatível com Vite 7 e npm.

```bash
git clone https://github.com/ecofy-project/ecofy-frontend.git
cd ecofy-frontend
npm install
npm run dev
```

A aplicação sobe em <http://localhost:5173> já em Mock Mode (é o padrão), então não é preciso configurar nada para começar.

> **Windows / PowerShell:** use `npm.cmd` no lugar de `npm` para evitar conflitos com a política de execução de scripts.

Para partir de um arquivo de ambiente próprio:

```bash
cp .env.example .env.local
```

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `:5173` |
| `npm run dev:mock` | Dev server com cenários do Mock Mode por argumento |
| `npm run build` | Type-check + build de produção |
| `npm run build:demo` | Build da demonstração pública (modo `demo`) |
| `npm run preview` | Serve o build gerado em `:4173` |
| `npm run typecheck` | Verificação de tipos (`tsc -b`) |
| `npm run lint` | ESLint em todo o projeto |
| `npm test` | Testes unitários (erros de API, money, paginação) |

---

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `VITE_APP_DATA_MODE` | não | `mock` | `mock` ou `api` |
| `VITE_APP_ENV` | não | `development` | `development`, `test`, `staging`, `production` ou `demo` |
| `VITE_API_GATEWAY_URL` | **sim, se `api`** | sem padrão | URL absoluta (http/https) do API Gateway |
| `VITE_AUTH_CLIENT_ID` | não | sem padrão | Client ID usado nos fluxos de autenticação |
| `VITE_MOCK_SCENARIO` | não | `default` | Cenário de dados do Mock Mode |
| `VITE_MOCK_AUTH_SCENARIO` | não | `success` | Cenário de autenticação do Mock Mode |
| `VITE_MOCK_USER_ROLES` | não | sem padrão | Lista separada por vírgula |
| `VITE_MOCK_USER_PERMISSIONS` | não | sem padrão | Lista separada por vírgula |
| `VITE_MOCK_DELAY_MS` | não | `450` | Latência simulada, inteiro entre 0 e 10000 |
| `VITE_MAX_IMPORT_FILE_SIZE_BYTES` | não | `10485760` | Limite das validações preliminares de importação (10 MB) |

Valores inválidos lançam erro na inicialização, com a lista de opções aceitas. As variáveis `VITE_*` são incorporadas ao bundle, então **reinicie o dev server ou gere um novo build após qualquer alteração**.

Nunca coloque segredos em variáveis `VITE_*`: elas são públicas por definição, e o carregador de configuração recusa nomes que aparentem conter credenciais.

---

## Cenários de demonstração

Além do cenário `default`, o Mock Mode reproduz estados difíceis de provocar num backend real: listas vazias, falhas, conflitos e processamento em andamento. Passe-os como argumento:

```bash
npm run dev:mock -- scenario=budget-conflict
npm run dev:mock -- scenario=import-completed-with-errors delay=150
npm run dev:mock -- scenario=dashboard-degraded auth=rate_limited
```

O script aceita `scenario`, `auth`, `delay`, `roles`, `permissions` e `mode`.

**Globais:** `default`, `empty`, `error`, `loading`, `degraded`, `processing`.

**Por área:**

| Área | Cenários |
| --- | --- |
| Conta | `profile-incomplete`, `preferences-empty`, `connections-empty`, `connections-multiple` |
| Categorização | `categories-empty`, `category-create-error`, `manual-error` |
| Orçamentos | `budgets-empty`, `budget-single`, `budgets-multiple`, `budget-paused`, `budget-archived`, `consumption-partial`, `consumption-full`, `budget-conflict`, `budget-error` |
| Importações | `imports-empty`, `import-completed`, `import-completed-with-errors`, `import-failed`, `import-pending`, `import-running`, `import-already-processed`, `import-idempotency-mismatch`, `import-file-too-large`, `import-unsupported-type`, `import-invalid-header`, `import-error` |
| Analítica | `dashboard-default`, `dashboard-empty`, `dashboard-error`, `dashboard-degraded`, `insights-empty`, `insight-generation-success`, `insight-generation-error`, `rebuild-processing`, `rebuild-completed`, `goals-empty`, `goals-multiple`, `goal-error` |
| Notificações | `notifications-empty`, `notifications-error`, `notification-resend-failed`, `notification-resend-error` |

**Autenticação** (`auth=`): `success`, `invalid_credentials`, `invalid_request`, `rate_limited`, `server_error`.

---

## Modo API

```env
VITE_APP_DATA_MODE=api
VITE_APP_ENV=development
VITE_API_GATEWAY_URL=http://localhost:5173
VITE_AUTH_CLIENT_ID=eco_dashboard_local
```

No desenvolvimento em API Mode, o Vite encaminha os prefixos `/auth` e `/api`
para o API Gateway local em `http://localhost:8080`. Assim, o navegador consome
a API pela mesma origem do frontend e o gateway continua sendo o único ponto de
entrada do backend.

```bash
npm run dev -- --mode api
```

O frontend fala **exclusivamente com o API Gateway**: o cliente HTTP recusa caminhos absolutos e a validação de configuração rejeita URLs apontando para as portas dos microsserviços (de `8081` a `8087`). O token de acesso é injetado a partir do `SessionStore`, que usa `sessionStorage` no modo API e `localStorage` no Mock Mode.

Cada serviço é acessado por um caminho prefixado no gateway:

| Serviço | Caminho |
| --- | --- |
| `ms-auth` | `/auth/api` |
| `ms-users` | `/users/api/users/v1` |
| `ms-categorization` | `/categorization/api/categorization/v1` |
| `ms-budgeting` | `/budgeting/api/budgeting/v1/budgets` |
| `ms-ingestion` | `/ingestion/api/import` |
| `ms-insights` | `/insights/api/insights/v1` |
| `ms-notification` | `/notification/api/notification/v1/notifications` |

Os contratos realmente consumidos, e as divergências conhecidas entre eles e a interface, estão documentados em `docs/` (veja [Documentação](#documentação)).

---

## Rotas

**Públicas** (redirecionam para o dashboard se já autenticado):

`/login` · `/register` · `/forgot-password` · `/reset-password` · `/confirm-email`

**Protegidas** (redirecionam para o login se não autenticado):

| Rota | Página |
| --- | --- |
| `/` | Dashboard |
| `/imports` | Importações |
| `/imports/{id}` | Detalhes de uma importação |
| `/categories` | Categorias & Regras |
| `/categorization/manual` | Categorização manual |
| `/categorization/suggestions` | Sugestões de categorização |
| `/budgets` | Orçamentos |
| `/goals` | Metas |
| `/insights` | Insights |
| `/notifications` | Notificações |
| `/profile` | Perfil |
| `/preferences` | Preferências |
| `/connections` | Conexões |
| `/design-system` | Fundamentos e componentes da interface |

A navegação lateral é agrupada por contexto (Sistema, Visão geral, Finanças, Planejamento, Inteligência, Atividade, Conta) e dá lugar a uma navegação inferior no mobile, com menu “Mais” para os módulos secundários.

---

## Testes e qualidade

```bash
npm test        # testes unitários
npm run lint    # ESLint
npm run typecheck
```

A cobertura automatizada foca nos módulos de infraestrutura com regras não triviais: normalização de erros da API, aritmética monetária e paginação. As features são validadas manualmente pelos cenários do Mock Mode.

---

## Deploy

O projeto está configurado para a **Vercel** através de `vercel.json`:

- build: `npm run build:demo`, saída em `dist/`;
- **SPA rewrite** de todas as rotas para `index.html`, por isso recarregar `/budgets` direto funciona;
- cabeçalhos de segurança em todas as respostas: **CSP** restritiva (`default-src 'self'`, sem scripts externos, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` desativando câmera, microfone e geolocalização.

Como a demo roda em Mock Mode, o deploy **não depende de backend algum**. Para reproduzir esse build localmente:

```bash
npm run build:demo
npm run preview
```

---

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [`docs/TESTING_MOCK_BACKEND_AND_VERCEL.md`](docs/TESTING_MOCK_BACKEND_AND_VERCEL.md) | Guia de execução em Mock Mode, backend local e build da demonstração |
| [`docs/AUTH_CONTRACTS.md`](docs/AUTH_CONTRACTS.md) | Contratos de `ms-auth` (login, cadastro, senha e sessão) |
| [`docs/USERS_CONTRACTS.md`](docs/USERS_CONTRACTS.md) | Contratos de `ms-users` (perfil, preferências e conexões) |
| [`docs/CATEGORIZATION_CONTRACTS.md`](docs/CATEGORIZATION_CONTRACTS.md) | Contratos de `ms-categorization` |
| [`docs/BUDGETING_CONTRACTS.md`](docs/BUDGETING_CONTRACTS.md) | Contratos de `ms-budgeting` |
| [`docs/INGESTION_CONTRACTS.md`](docs/INGESTION_CONTRACTS.md) | Contratos de `ms-ingestion` |
| [`docs/INSIGHTS_CONTRACTS.md`](docs/INSIGHTS_CONTRACTS.md) | Contratos de `ms-insights` (dashboard, insights e metas) |
| [`docs/NOTIFICATION_CONTRACTS.md`](docs/NOTIFICATION_CONTRACTS.md) | Contratos de `ms-notification` |

Cada documento de contrato lista o que foi **confirmado no código do microsserviço**, o que ainda **não é publicado pelo backend** e como a interface se comporta nesses casos. Nada foi inventado.

---

## Status do desenvolvimento

O frontend foi entregue em **8 etapas**, todas concluídas:

| Etapa | Entrega |
| --- | --- |
| 1 | Fundação, Design System e Mock Mode |
| 2 | Interfaces de acesso e sessão |
| 3 | Perfil, preferências e conexões |
| 4 | Categorias e categorização |
| 5 | Orçamentos e overview |
| 6 | Importações |
| 7 | Dashboard, metas e insights |
| 8 | Notificações, refinamento e integração |

Depois disso, o frontend passou por uma auditoria global de responsividade e compatibilidade, cobrindo de 320px a 2560px, orientação paisagem, zoom de 200%, áreas seguras e alvos de toque.
