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

- **AuthContext** — Supabase Auth (email/senha) + linha em `profiles` (role, dados pessoais, `firstCheckInAt`, etc.). Roles: `user`, `establishment` (tem `managedPlaceId`), `admin`, `agency` (vê apenas passeios; sem mapa/Top 20/progresso — bloqueio em `Layout.tsx`).
  **Regras de ouro documentadas no topo do arquivo — não violar:**
  1. Nunca `await supabase.auth.signOut()` (pode travar para sempre).
  2. Login = `signInWithPassword` + fetch do profile + `setCurrentUser`. Só isso.
  3. Logout = remover chaves `sb-*` do localStorage + reload da página.
  4. Sem `onAuthStateChange` (race conditions com `login()`).
  5. Init sempre com timeout de segurança — `loading` nunca pode ficar `true` para sempre.
- **AccessContext** — check-ins em `access_records` (upsert, com snapshot do desconto concedido em `discount`) + RPC `increment_place_metric`. Desconto ativo por 2h após check-in; trial de 20 dias contado a partir de `firstCheckInAt` do usuário. Quando expirado, `Layout.tsx` renderiza `AccessExpired` no lugar do `<Outlet />` nas rotas bloqueadas.
- **PlacesContext** — carrega lugares, `categories`, `cities` (lat/lng + `country`), `badges`; CRUD de todos eles; métricas via RPC. Expõe **`places`** (visíveis para quem navega: ativos + regra do perfil, ex.: agência só vê `tour`) e **`allPlaces`** (tudo que o RLS devolveu — use nos painéis admin/empresa). Recarrega ao trocar de usuário porque o RLS muda o resultado.
- **FavoritesContext** — tabela `favorites`.
- **GeoContext** — `watchPosition` + Haversine; usado por `ProximityAlerts` (alerta único por lugar por sessão quando < 500 m).

### Regras de negócio centralizadas (`src/lib/utils.ts`)

- Horários: `DailyHours.shifts` (vários intervalos por dia; `openTime`/`closeTime` espelham o 1º intervalo para registros antigos). Use `getShifts()`, `isPlaceOpen()` e `validateOperatingHours()` — nunca leia `openTime/closeTime` diretamente.
- Desconto vigente: `getCurrentDiscount()` com prioridade Oferta Relâmpago > `discountRules` (janelas diárias) > `discountBadge`. Com `discountRules`, fora das janelas não há desconto nem check-in (`getNextDiscountRule()` informa o próximo).
- `isPlaceActive()` (considera `reactivateAt`), `canRoleViewPlace()`, `PRICE_LEVELS` ($/$$/$$$).
- Filtros/ordenação compartilhados por Home, Mapa e Top 20: `src/components/PlaceFilters.tsx`.

### Mapeamento camelCase ↔ snake_case

O tipo `Place` (em `src/data/places.ts`, que hoje só contém tipos/helpers, não dados) é camelCase; as colunas do Postgres são snake_case. Conversões ficam em `src/lib/supabase.ts`:
- `placeToRow()` / `rowToPlace()` — conversão completa (preenche defaults).
- `partialPlaceToRow()` — **use em UPDATEs parciais**; `placeToRow` sobrescreveria campos não enviados com defaults.
- `rowToUser()` — profile → `User`.

Ao adicionar um campo a `Place` ou `User`, atualize o tipo, os conversores (`PLACE_KEY_MAP`, `placeToRow`, `rowToPlace`) **e** crie uma migração em `supabase/migrations/` (aplicada no projeto Supabase).

### Backend Supabase

- Projeto `ppdceyhtmmwtzrmuidxy`. Schema base + RLS + funções em `supabase-schema.sql`; alterações posteriores em `supabase/migrations/` (idempotentes, aplicadas via Management API). Tabelas: `profiles`, `places`, `access_records`, `favorites`, `reviews`, `categories`, `cities`, `badges`, `app_settings`.
- **Triggers de proteção** (`protect_profile_fields`, `protect_place_fields`): em requisições da API (`authenticated`/`anon`), usuário comum não altera `role`/`managed_place_id`/`first_check_in_at` (depois de definido); empresa não altera campos administrativos do lugar (`featured`, ordem, `is_active`, `price_level`, `type`); ninguém sobrescreve métricas (só via RPC). Não é possível desativar lugar com check-in ativo (`PLACE_HAS_ACTIVE_CHECKINS`).
- RLS de `places`: SELECT só de lugares ativos (ou `reactivate_at` vencido), exceto admin e a empresa dona.
- A tabela `places` guarda imagens em base64 (~22 MB): a consulta inicial é pesada e pode estourar o `statement_timeout` de 3s do `anon` com cache frio (há 1 retry em `PlacesContext`).
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
