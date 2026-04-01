# CLAUDE.md — Uruguai Descontos

## Visão Geral

Aplicação web para a comunidade brasileira no Uruguai, focada em descoberta de lugares, sistema de check-in com descontos e gestão de estabelecimentos. Nome público: **"O que Fazer no Uruguai?"** (brasileirosnouruguai.com.br).

- **Versão:** 0.0.92
- **Repositório:** https://github.com/drimolha/adriana-brasileirosnouruguai.com.br

## Tech Stack

| Camada         | Tecnologia                              |
| -------------- | --------------------------------------- |
| Framework      | React 19 + TypeScript 5.9              |
| Build          | Vite 8                                 |
| Estilo         | Tailwind CSS 3.4 + Shadcn/UI (Radix)  |
| Roteamento     | React Router DOM 7                     |
| Formulários    | React Hook Form + Zod 4               |
| Ícones         | Lucide React                           |
| Gráficos       | Recharts                               |
| Backend        | Supabase (Auth + PostgreSQL)           |
| Notificações   | Sonner + Radix Toast                   |
| Lint/Format    | oxlint + oxfmt                         |
| Pacotes        | pnpm / npm                             |

## Comandos

```bash
pnpm dev          # Dev server (localhost:8080)
pnpm build        # Build produção → dist/
pnpm build:dev    # Build dev → dev-dist/ (com sourcemaps)
pnpm preview      # Preview do build
pnpm lint         # Linting com oxlint
pnpm lint:fix     # Lint + auto-fix
pnpm format       # Formatação com oxfmt
```

**Nota:** Não há testes configurados (`pnpm test` → echo only).

## Estrutura do Projeto

```
src/
├── pages/              # 12 páginas/rotas
├── components/         # Componentes customizados + Admin
│   └── ui/             # 60+ componentes Shadcn/UI
├── context/            # 5 Context providers (estado global)
├── hooks/              # use-mobile, use-toast
├── lib/                # utils, imageUtils, importUrl
├── data/               # Tipos e dados default (places.ts)
├── assets/             # Favicon/logo
├── App.tsx             # Roteamento + providers
├── main.tsx            # Entry point React
└── main.css            # Estilos globais
```

## Rotas

| Rota           | Página                | Descrição                          |
| -------------- | --------------------- | ---------------------------------- |
| `/`            | Index.tsx             | Home — descoberta de lugares       |
| `/place/:id`   | PlaceDetails.tsx      | Detalhes + check-in                |
| `/favorites`   | Favorites.tsx         | Lugares favoritados                |
| `/map`         | MapView.tsx           | Mapa interativo customizado        |
| `/profile`     | Profile.tsx           | Progresso e conquistas do usuário  |
| `/perfil`      | UserProfile.tsx       | Configurações da conta             |
| `/auth`        | Auth.tsx              | Login                              |
| `/admin`       | Admin.tsx             | Painel admin master                |
| `/empresa`     | EstablishmentAdmin.tsx| Portal do estabelecimento          |
| `/top`         | TopRestaurants.tsx    | Top 20 leaderboard                 |
| `*`            | NotFound.tsx          | 404                                |

## Arquitetura de Estado (React Context)

Hierarquia de providers em `App.tsx`:

```
AuthProvider → AccessProvider → GeoProvider → PlacesProvider → FavoritesProvider
```

### 1. AuthContext
- Autenticação por email/senha
- Roles: `'user'` | `'establishment'`
- Banco de usuários em localStorage (`@uruguai:users_db`)
- Usuários de teste: `user@bnu.com / 123`, `empresa@bnu.com / 123`

### 2. PlacesContext
- CRUD de lugares (restaurantes e tours)
- Categorias e cidades
- Templates de badges de desconto
- Flash offers (descontos temporários)
- Métricas: acessos, cliques em cupom, check-ins

### 3. AccessContext
- Sistema de check-in (janela de 2 horas)
- Trial de 20 dias para usuários
- Status: `'active'` | `'expired'` | `'none'`

### 4. FavoritesContext
- Array de IDs favoritados por usuário
- Chave localStorage: `@uruguai:favorites_<userId>`

### 5. GeoContext
- Geolocalização do browser (watchPosition)
- Cálculo de distância (Haversine)

## Backend — Supabase

**Autenticação:** Supabase Auth (email/password)
**Banco de dados:** PostgreSQL via Supabase

### Tabelas

| Tabela           | Descrição                                  |
| ---------------- | ------------------------------------------ |
| `profiles`       | Extensão de auth.users (role, nome, etc.)  |
| `places`         | Lugares/tours com métricas e flash offers  |
| `access_records` | Check-ins (user_id, place_id, timestamps)  |
| `favorites`      | Favoritos (user_id, place_id)              |
| `reviews`        | Avaliações (rating, comment)               |
| `categories`     | Categorias (name)                          |
| `cities`         | Cidades (name)                             |
| `badges`         | Badges de desconto (name)                  |

### Configuração
- **URL:** `VITE_SUPABASE_URL` (em `.env`)
- **Anon Key:** `VITE_SUPABASE_ANON_KEY` (em `.env`)
- **Client:** `src/lib/supabase.ts`
- **Schema SQL:** `supabase-schema.sql` (na raiz do projeto)
- **RLS:** Habilitado em todas as tabelas
- **RPC:** `increment_place_metric()` para contadores

### Roles
| Role            | Acesso                                         |
| --------------- | ---------------------------------------------- |
| `user`          | Check-in, favoritos, perfil, mapa              |
| `establishment` | Dashboard empresa, métricas, edição do lugar   |
| `admin`         | Painel completo, gestão de usuários            |

### Helpers (`src/lib/supabase.ts`)
- `placeToRow()` — converte Place (camelCase) → row (snake_case)
- `rowToPlace()` — converte row (snake_case) → Place (camelCase)
- `rowToUser()` — converte profile row → User object

## Funcionalidades Principais

### Check-in com Desconto
- Usuário faz check-in em um lugar → desconto ativo por 2 horas
- Ticket visual com contagem regressiva
- Limite trial: 20 dias a partir do primeiro check-in

### Flash Offers
- Descontos temporários com expiração
- Exibidos em carrossel na home

### Mapa Customizado
- Renderização de tiles do Google Maps (sem API oficial)
- Suporte multi-touch (drag + pinch zoom)
- Pins coloridos por status (azul/dourado/cinza)
- Centralização automática por cidade

### Sistema de Níveis
1. Recém-chegado (0+ check-ins)
2. Explorador Iniciante (1+)
3. Viajante Curioso (3+)
4. Aventureiro (5+)
5. Viajante Pro (10+)

### Alertas de Proximidade
- Toast + notificação nativa quando a <500m de um lugar
- 1 alerta por lugar por sessão

### Cupons
- Códigos mapeados por nome do lugar
- Tracking de cliques

## Autenticação & Autorização

Autenticação via **Supabase Auth** (email/password). Roles controladas na tabela `profiles`.

| Role            | Acesso                                         |
| --------------- | ---------------------------------------------- |
| Anônimo         | Visualização de lugares (sem check-in)         |
| `user`          | Check-in, favoritos, perfil, mapa              |
| `establishment` | Dashboard empresa, métricas, edição do lugar   |
| `admin`         | Painel completo, gestão de usuários e lugares  |

## Estilo & Design

- **Dark mode:** class-based (next-themes)
- **Cores principais:**
  - Primary: `#003399` (azul escuro)
  - Secondary: `#2E8B57` (verde)
  - Brand Yellow: `#FFD700` (dourado)
- **Fontes:** Inter (body), Lexend (display)
- **Responsivo:** mobile-first com breakpoints `sm/md/lg/xl`
- **Container:** centralizado, padding 2rem, max 1400px

## Configurações Importantes

### Vite (`vite.config.ts`)
- Dev server: `localhost:8080` (IPv6)
- Path alias: `@/*` → `./src/*`
- Plugin customizado: `vite-plugin-react-uid.js`
- Alias para compatibilidade Zod v4

### TypeScript
- `noImplicitAny: false` (flexível)
- `strictNullChecks: true`
- Path aliases: `@/*`

### Tailwind (`tailwind.config.ts`)
- Plugins: animate, typography, aspect-ratio
- Cores e fonts customizadas
- Dark mode via classe CSS

## Deploy

- **Frontend:** Site estático em `dist/` (Vercel, Netlify, etc.)
- **Backend:** Supabase (hosted, projeto `ppdceyhtmmwtzrmuidxy`)
- **Variáveis de ambiente:** `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

## Convenções do Código

- Componentes React em PascalCase (`.tsx`)
- Contextos com pattern Provider + hook customizado (`useAuth`, `usePlaces`, etc.)
- Estilização inline com classes Tailwind
- Componentes UI base via Shadcn/UI em `src/components/ui/`
- Timezone padrão: **America/Sao_Paulo** para todas as datas/horários
- Idioma da interface: **Português brasileiro**
