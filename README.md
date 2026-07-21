# EcoFy — Frontend

Interface web do **EcoFy**, uma plataforma de gestão financeira pessoal: importação de movimentações, categorização automática, orçamentos, metas e insights.

O projeto é um SPA em **React 19 + TypeScript + Vite**, construído sobre um design system próprio e uma arquitetura em *features* com inversão de dependência entre a UI e as fontes de dados. Isso permite rodar a aplicação inteira **sem backend** (Mock Mode) ou conectada ao **API Gateway** real, apenas trocando uma variável de ambiente.

---

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Começando](#começando)
- [Scripts](#scripts)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Mock Mode e cenários](#mock-mode-e-cenários)
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
| Estilos | CSS Modules-free — design system próprio com CSS custom properties |
| Tipografia | Plus Jakarta Sans (variável) + IBM Plex Mono, via `@fontsource` |
| Roteamento | Router próprio baseado em `History API` + `useSyncExternalStore` |
| Testes | `node:test` (runner nativo do Node) |
| Lint | ESLint 9 (flat config) + `typescript-eslint` |
| Hospedagem | Vercel |

Sem dependências de runtime além de React e das fontes — o roteamento, o cliente HTTP, o tratamento de erros, a paginação e a aritmética monetária são implementados no próprio projeto.

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
├── design-system/          # Tokens, temas, tipografia e estilos globais
├── features/               # Cada domínio isolado
│   ├── auth/               # Login, registro, recuperação e confirmação
│   ├── users/              # Perfil, preferências, conexões
│   ├── dashboard/  budgets/  categories/  goals/
│   ├── imports/  insights/  notifications/
│   ├── demo/               # Agregador de dados da demonstração
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
└── types/          # Modelos do domínio
```

**Princípio central:** a UI depende sempre de uma *interface* de data source, nunca de uma implementação. A escolha entre mock e HTTP acontece uma única vez, em `src/app/config/create-app-dependencies.ts`, com base em `VITE_APP_DATA_MODE`. Nenhum componente sabe se está falando com dados fictícios ou com o backend.

Outros pontos de destaque:

- **Configuração validada em tempo de carga** (`src/services/config/env.ts`): variáveis inválidas falham rápido e com mensagem explícita. Há uma verificação que impede a exposição acidental de segredos (`CLIENT_SECRET`, `INTERNAL_TOKEN`, `PRIVATE_KEY`) no bundle, e uma que bloqueia URLs apontando diretamente para microsserviços em vez do API Gateway.
- **Cliente HTTP próprio** com timeout, `correlation-id` por requisição, injeção de token de sessão e normalização de erros da API.
- **Aritmética monetária dedicada** (`services/money`), evitando erros de ponto flutuante em valores financeiros.

---

## Começando

**Pré-requisitos:** Node.js (versão compatível com Vite 7) e npm.

```bash
git clone https://github.com/ecofy-project/ecofy-frontend.git
cd ecofy-frontend
npm install
cp .env.example .env.local   # ajuste conforme necessário
npm run dev
```

A aplicação sobe em `http://localhost:5173` (porta fixa).

> **Windows / PowerShell:** use `npm.cmd` no lugar de `npm` para evitar conflitos com a política de execução de scripts.

### Credenciais da demonstração

No Mock Mode:

```
Usuário: demo@ecofy.app
Senha:   demo
```

Também é possível entrar pelo botão **Explorar demonstração**, sem preencher o formulário. Essas credenciais são públicas, fictícias e não correspondem a nenhuma conta real.

---

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento em `:5173` |
| `npm run build` | Type-check + build de produção |
| `npm run build:demo` | Build da demonstração pública (modo `demo`) |
| `npm run preview` | Serve o build gerado em `:4173` |
| `npm run typecheck` | Verificação de tipos (`tsc -b`) |
| `npm run lint` | ESLint em todo o projeto |
| `npm test` | Testes unitários (erros de API, money, paginação) |

Para rodar com um arquivo de ambiente específico, use o modo do Vite:

```bash
npm run dev -- --mode mock     # usa .env.mock
npm run dev -- --mode api      # usa .env.api
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `VITE_APP_DATA_MODE` | não | `mock` | `mock` ou `api` |
| `VITE_APP_ENV` | não | `development` | `development`, `test`, `staging`, `production` ou `demo` |
| `VITE_API_GATEWAY_URL` | **sim, se `api`** | — | URL absoluta (http/https) do API Gateway |
| `VITE_AUTH_CLIENT_ID` | não | — | Client ID usado nos fluxos de autenticação |
| `VITE_MOCK_SCENARIO` | não | `default` | Cenário de dados do Mock Mode |
| `VITE_MOCK_AUTH_SCENARIO` | não | `success` | Cenário de autenticação do Mock Mode |
| `VITE_MOCK_USER_ROLES` | não | — | Lista separada por vírgula |
| `VITE_MOCK_USER_PERMISSIONS` | não | — | Lista separada por vírgula |
| `VITE_MOCK_DELAY_MS` | não | `450` | Latência simulada, inteiro entre 0 e 10000 |

Valores inválidos lançam erro na inicialização, com a lista de opções aceitas. As variáveis `VITE_*` são incorporadas ao bundle — **reinicie o dev server ou gere um novo build após qualquer alteração**.

Nunca coloque segredos em variáveis `VITE_*`: elas são públicas por definição, e o carregador de configuração recusa nomes que aparentem conter credenciais.

---

## Mock Mode e cenários

O Mock Mode entrega a aplicação completa sem nenhum backend: dados fictícios, latência simulada e persistência no navegador (o estado da demonstração sobrevive ao reload).

Arquivos de ambiente prontos na raiz do projeto:

| Arquivo | Cenário exercitado |
| --- | --- |
| `.env.mock` | Fluxo padrão, tudo funcionando |
| `.env.demo` | Build público da Vercel |
| `.env.api` | Backend local via API Gateway (`localhost:8080`) |

Os cenários não têm arquivo próprio: são passados como argumento para
`npm run dev:mock`, que aceita `scenario`, `auth`, `delay`, `roles`,
`permissions` e `mode`. A sintaxe é a mesma em bash e PowerShell.

```bash
npm run dev:mock -- scenario=categories-empty
npm run dev:mock -- auth=rate_limited delay=150
npm run dev:mock -- scenario=error auth=invalid_credentials
```

**Cenários de dados** (`VITE_MOCK_SCENARIO`): `default`, `empty`, `error`, `loading`, `degraded`, `processing`, `profile-incomplete`, `preferences-empty`, `connections-empty`, `connections-multiple`, `categories-empty`, `category-create-error`, `manual-error`.

**Cenários de autenticação** (`VITE_MOCK_AUTH_SCENARIO`): `success`, `invalid_credentials`, `invalid_request`, `rate_limited`, `server_error`.

---

## Modo API

```env
VITE_APP_DATA_MODE=api
VITE_APP_ENV=development
VITE_API_GATEWAY_URL=http://localhost:8080
VITE_AUTH_CLIENT_ID=ecofy-web
```

```bash
npm run dev -- --mode api
```

O frontend fala **exclusivamente com o API Gateway** — o cliente HTTP recusa caminhos absolutos e a validação de configuração rejeita URLs apontando para as portas dos microsserviços (`8081`–`8087`). O token de acesso é injetado automaticamente a partir do `SessionStore`, que usa `sessionStorage` no modo API e `localStorage` no Mock Mode.

---

## Rotas

**Públicas** (redirecionam para o dashboard se já autenticado):

`/login` · `/register` · `/forgot-password` · `/reset-password` · `/confirm-email`

**Protegidas** (redirecionam para o login se não autenticado):

| Rota | Página |
| --- | --- |
| `/` | Dashboard |
| `/imports` | Importações |
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

A navegação lateral é agrupada por contexto (Visão geral, Finanças, Planejamento, Inteligência, Atividade, Conta) e possui uma variante inferior otimizada para mobile.

---

## Testes e qualidade

```bash
npm test        # testes unitários
npm run lint    # ESLint
npm run typecheck
```

A cobertura de testes foca nos módulos de infraestrutura com regras não triviais: normalização de erros da API, aritmética monetária e paginação.

---

## Deploy

O projeto está configurado para a **Vercel** através de `vercel.json`:

- build: `npm run build:demo`, saída em `dist/`;
- SPA rewrite de todas as rotas para `index.html`;
- cabeçalhos de segurança aplicados a todas as respostas: **CSP** restritiva (`default-src 'self'`, sem scripts externos, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` e `Permissions-Policy` desativando câmera, microfone e geolocalização.

Para reproduzir o build da demonstração localmente:

```bash
npm run build:demo
npm run preview
```

---

## Documentação

- [`docs/TESTING_MOCK_BACKEND_AND_VERCEL.md`](docs/TESTING_MOCK_BACKEND_AND_VERCEL.md) — guia completo de execução em Mock Mode, integração com backend local e build da demonstração.
- [`docs/DEVELOPMENT_PROGRESS.md`](docs/DEVELOPMENT_PROGRESS.md) — acompanhamento das etapas de desenvolvimento.

---

## Status do desenvolvimento

O frontend está organizado em **8 etapas**. Situação atual: **3 de 8 concluídas (37,5%)**, com a Etapa 4 em sequência. Consulte `docs/DEVELOPMENT_PROGRESS.md` para o histórico atualizado.
