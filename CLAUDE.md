# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

App web para a comunidade brasileira no Uruguai: descoberta de lugares (restaurantes e tours), check-in com desconto e portal de estabelecimentos. Nome público: **"O que Fazer no Uruguai?"** (brasileirosnouruguai.com.br). Projeto originalmente gerado pelo Skip (goskip.dev) — daí o `name` "skip-react-template" no `package.json` e o `.skip.config.json`.

- Repositório: https://github.com/drimolha/adriana-brasileirosnouruguai.com.br
- Stack: React 19 + TypeScript + Vite 8, Tailwind 3 + Shadcn/UI (Radix), React Router 7, React Hook Form + Zod 4, Supabase (Auth + Postgres + Edge Functions).
- Idioma da interface: **português brasileiro**. Timezone padrão: **America/Sao_Paulo**.

## Comandos

```bash
pnpm dev            # Dev server em localhost:8080 (o README fala em 5173 — está desatualizado)
pnpm build          # Build produção → dist/
pnpm build:dev      # Build modo development
pnpm lint           # oxlint src
pnpm lint:fix
pnpm format         # oxfmt  (format:check para só verificar)
```

`pnpm test` é um no-op. Os testes reais são **Python/pytest** em `tests/` e rodam contra o **Supabase real** (não há banco local):

```bash
pytest tests/                                   # Testes de API (httpx → REST do Supabase)
pytest tests/test_places_crud.py::test_nome     # Um teste específico
pytest tests/e2e/                               # E2E com Playwright — exige `pnpm dev` rodando (APP_URL, default http://localhost:8080)
```

Os testes leem `.env` e `.env.local` e exigem `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Eles criam/limpam usuários de teste (`*@uruguaidescontos.test`) via Admin API; os E2E usam um lugar existente no banco (`TEST_RESTAURANT_ID` em `tests/e2e/conftest.py`).

## Arquitetura

### Estado global (React Context)

Hierarquia em `src/App.tsx`: `AuthProvider → AccessProvider → GeoProvider → PlacesProvider → FavoritesProvider`. Todo acesso a dados passa pelos contexts (hooks `useAuth`, `usePlaces`, `useAccess`, `useFavorites`, `useGeo`), que falam direto com o Supabase via `src/lib/supabase.ts`. Não há camada de API própria.

- **AuthContext** — Supabase Auth (email/senha) + linha em `profiles` (role, dados pessoais, `firstCheckInAt`, etc.). Roles: `user`, `establishment` (tem `managedPlaceId`), `admin`.
  **Regras de ouro documentadas no topo do arquivo — não violar:**
  1. Nunca `await supabase.auth.signOut()` (pode travar para sempre).
  2. Login = `signInWithPassword` + fetch do profile + `setCurrentUser`. Só isso.
  3. Logout = remover chaves `sb-*` do localStorage + reload da página.
  4. Sem `onAuthStateChange` (race conditions com `login()`).
  5. Init sempre com timeout de segurança — `loading` nunca pode ficar `true` para sempre.
- **AccessContext** — check-ins em `access_records` (upsert) + RPC `increment_place_metric`. Desconto ativo por 2h após check-in; trial de 20 dias contado a partir de `firstCheckInAt` do usuário. Quando expirado, `Layout.tsx` renderiza `AccessExpired` no lugar do `<Outlet />` nas rotas bloqueadas.
- **PlacesContext** — carrega `places`, `categories`, `cities` (com lat/lng), `badges`; CRUD de todos eles; métricas (acessos, cliques em cupom, check-ins, cliques em destaque) via RPC.
- **FavoritesContext** — tabela `favorites`.
- **GeoContext** — `watchPosition` + Haversine; usado por `ProximityAlerts` (alerta único por lugar por sessão quando < 500 m).

### Mapeamento camelCase ↔ snake_case

O tipo `Place` (em `src/data/places.ts`, que hoje só contém tipos/helpers, não dados) é camelCase; as colunas do Postgres são snake_case. Conversões ficam em `src/lib/supabase.ts`:
- `placeToRow()` / `rowToPlace()` — conversão completa (preenche defaults).
- `partialPlaceToRow()` — **use em UPDATEs parciais**; `placeToRow` sobrescreveria campos não enviados com defaults.
- `rowToUser()` — profile → `User`.

Ao adicionar um campo a `Place` ou `User`, atualize o tipo, os conversores **e** `supabase-schema.sql` (e aplique a migração no projeto Supabase).

### Backend Supabase

- Projeto `ppdceyhtmmwtzrmuidxy`. Schema completo + RLS + funções em `supabase-schema.sql`. Tabelas: `profiles`, `places`, `access_records`, `favorites`, `reviews`, `categories`, `cities`, `badges`, `app_settings`.
- `app_settings` é um key/value usado por `src/lib/appSettings.ts` (com cache em memória e fallback para defaults) — guarda WhatsApp de suporte e templates/assuntos de email editáveis no admin (`email_template_<key>`, `email_subject_<key>`).
- **Edge Functions** (`supabase/functions/`, Deno):
  - `send-email` — proxy para um relay SMTP numa VPS externa; usado por `src/lib/emailService.ts` (`sendTemplatedEmail` substitui `{{variavel}}`).
  - `reset-password` — gera o link de recuperação via Admin API e envia pelo mesmo relay (o fluxo do Supabase Auth não é usado para email). Página de destino: `/reset-password`.
  - `admin-update-user` — operações administrativas em usuários (inclui editar e excluir do Supabase Auth); verifica se o chamador é admin.
- `setup-supabase.mjs` é um script de bootstrap único (tabelas, seed, usuários) — não faz parte do fluxo normal.

### Páginas e permissões

Rotas definidas em `src/App.tsx`, todas dentro de `Layout` (exceto `*`). A checagem de role é feita dentro das próprias páginas (ex.: `Admin.tsx` verifica `currentUser.role === 'admin'` e mostra login caso contrário; `EstablishmentAdmin.tsx` em `/empresa` para `establishment`). Os componentes `Admin*` em `src/components/` compõem o painel admin.

O mapa (`/map`) é customizado: renderiza tiles do Google Maps diretamente (sem SDK/API key), com drag e pinch-zoom implementados à mão.

## Deploy

- `Dockerfile`: build Node 22 (`npm ci` + `npm run build`, recebe `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` como build args) → nginx com fallback SPA e `index.html` sem cache.
- Edge Functions são publicadas separadamente no Supabase.

## Convenções

- Alias `@/*` → `src/*`. Componentes Shadcn ficam em `src/components/ui/` (não editar sem necessidade).
- TypeScript com `strictNullChecks` mas `noImplicitAny: false`.
- Cores da marca: primary `#003399`, secondary `#2E8B57`, amarelo `#FFD700`. Fontes: Inter (body), Lexend (display). Dark mode por classe (next-themes).
