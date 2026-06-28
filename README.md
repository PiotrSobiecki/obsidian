# Obsidian — koncerty w Polsce

Wyszukiwarka koncertów: wybierz miasto i datę, sprawdź co gra dziś i w najbliższych dniach.

## Stack

| Warstwa | Technologia | Folder |
|---------|-------------|--------|
| Frontend | Next.js 16 → Cloudflare Pages | `apps/user-application` |
| API | Hono → Cloudflare Workers | `apps/data-service` |
| Baza | Neon PostgreSQL + Hyperdrive | — |

Szczegóły: [AGENTS.md](./AGENTS.md)

## Struktura

```
apps/user-application/   — frontend Next.js
apps/data-service/       — Hono API + agenty + crony
```

## Konfiguracja środowiska

### data-service

```bash
cd apps/data-service
cp .dev.vars.example .dev.vars
# Uzupełnij DATABASE_URL — connection string z Neon (Dashboard → Connection string)
```

`pnpm dev:data-service` automatycznie używa `DATABASE_URL` z `.dev.vars` jako lokalnego Hyperdrive.

### user-application

```bash
cd apps/user-application
cp .env.dev.example .env.dev
cp .env.production.example .env.production
```

## Development

```bash
pnpm install

# Po zmianie schema.ts — wygeneruj migrację (dev)
pnpm db:generate:dev
pnpm db:migrate:dev
pnpm db:seed:dev

# API (port 8787)
pnpm dev:data-service

# Frontend (port 3000)
pnpm dev:user-application

# Oba naraz
pnpm dev:all
```

### Hyperdrive

W Cloudflare Dashboard utwórz Hyperdrive → podłącz Neon → wklej ID do `apps/data-service/wrangler.jsonc`

## Deploy

```bash
# Po zmianie schema — generate + migracje na produkcję (.production.vars)
pnpm db:generate:prod
pnpm db:migrate:prod

# API (produkcja — używa .production.vars)
pnpm deploy:data-service
# albo: cd apps/data-service && pnpm run deploy:prod

# Frontend (produkcja — build z .env.production)
pnpm deploy:user-application
# albo: cd apps/user-application && pnpm run deploy:prod

# Uwaga: `pnpm deploy` to wbudowana komenda pnpm — nie uruchamia Wranglera.
```

## API

| Endpoint | Opis |
|----------|------|
| `GET /health` | Health check |
| `GET /cities` | Lista miast |
| `GET /events?city=warszawa&from=2026-06-24&range=3days` | Koncerty |
| `GET /admin/sources` | Źródła (`x-api-key`) |
| `GET /admin/ingestion-runs` | Logi agentów |
| `POST /admin/cleanup` | Kasuje śmieci z bazy (`x-api-key`) |
