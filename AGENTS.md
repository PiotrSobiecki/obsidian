# Obsidian — decyzje architektoniczne

**NIE ZMIENIAJ bez zgody użytkownika.**

| Warstwa | Technologia | Folder |
|---------|-------------|--------|
| Frontend | Next.js 16 na **Cloudflare Pages** | `apps/user-application` |
| Backend API | **Hono** na **Cloudflare Workers** | `apps/data-service` |
| Baza danych | **Neon PostgreSQL** + **Hyperdrive** | — |
| ORM | Drizzle (`postgres-js`) | `apps/data-service` |
| Agenty | Cloudflare Agents SDK — Discovery + Collector | `apps/data-service` |
| Zakres muzyczny | **Rock, metal i pokrewne** — bez disco, ethno, pop, DJ/EDM itp. | `apps/data-service/src/lib/genre-policy.ts` |
| LLM | Workers AI | — |
| Web search | Brave Search API | — |
| UI | **Dark mode domyślny**, estetyka **rock/metal** | `apps/user-application` |

## Pliki środowiskowe

### `apps/data-service` (Wrangler)

| Plik | Użycie |
|------|--------|
| `.dev.vars` | Dev — generate: `pnpm db:generate:dev`, migracje: `pnpm db:migrate:dev`, seed: `pnpm db:seed:dev` |
| `.production.vars` | Prod — generate: `pnpm db:generate:prod`, migracje: `pnpm db:migrate:prod`, seed: `pnpm db:seed:prod` |

Szablony: `.dev.vars.example`, `.production.vars.example`

### `apps/user-application` (Next.js)

| Plik | Użycie |
|------|--------|
| `.env.dev` | `pnpm dev:user-application` (`dotenv -e .env.dev`) |
| `.env.production` | `pnpm build` (`dotenv -e .env.production`) |

Szablony: `.env.dev.example`, `.env.production.example`

## Zmienne

- **data-service:** `DATABASE_URL`, `BRAVE_SEARCH_API_KEY`, opcjonalnie `API_KEY`
- **user-application:** `NEXT_PUBLIC_API_URL`
