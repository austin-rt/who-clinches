# Who Clinches

A web application that simulates game outcomes to show who clinches college football conference championship spots. Built with Next.js 16, TypeScript, and the College Football Data (CFBD) API.

## Overview

This application allows users to simulate "what-if" scenarios for college football conference standings by:

- Fetching live game data from CFBD API (REST when out of season, GraphQL when in season)
- Allowing users to override game outcomes
- Calculating standings using official conference tiebreaker rules (SEC, Big Ten, Big 12, ACC, MWC, MAC, AAC, CUSA, Pac-12, Sun Belt)
- Visualizing potential conference championship scenarios
- AI chat assistant for discussing scenarios, standings, and team analytics

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **API**: College Football Data (CFBD) — REST + GraphQL
- **AI**: Anthropic Haiku 4.5 (chat), Voyage AI (RAG embeddings)
- **Database**: Neon PostgreSQL via Prisma ORM
- **Cache**: Upstash Redis — shared persistent cache + rate limiting
- **State**: Redux Toolkit + RTK Query
- **Styling**: Tailwind CSS + DaisyUI
- **Deployment**: Vercel
- **Testing**: Jest (unit/integration) + Playwright (e2e)

## Running Locally

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and install

```bash
git clone https://github.com/austin-rt/who-clinches.git
cd who-clinches
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your API keys:

#### Required

| Variable               | Service                                                   | Where to get it                                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CFBD_API_KEY`         | [College Football Data](https://collegefootballdata.com/) | Create a free account, grab your key from your [account page](https://collegefootballdata.com/key). Free Patreon tier works for dev. Comma-separate multiple keys for rotation in non-prod. |
| `DATABASE_URL`         | [Neon](https://neon.tech/)                                | Create a free Postgres project. Copy the **pooled** connection string and append `?sslmode=require&pgbouncer=true`.                                                                         |
| `DIRECT_URL`           | [Neon](https://neon.tech/)                                | Same project — copy the **direct** (unpooled) connection string, append `?sslmode=require`. Used by Prisma for migrations.                                                                  |
| `ANTHROPIC_API_KEY`    | [Anthropic](https://console.anthropic.com/)               | API key for Haiku 4.5 (AI chat feature).                                                                                                                                                    |
| `CHAT_IDENTITY_SECRET` | —                                                         | Random 32-char string. HMAC signing key for anonymous chat cookies.                                                                                                                         |

#### Optional

| Variable                          | Service                                 | Purpose                                                                                     |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`          | [Upstash](https://console.upstash.com/) | Redis cache and rate limiting. Without it the app skips caching — still works fine for dev. |
| `UPSTASH_REDIS_REST_TOKEN`        | [Upstash](https://console.upstash.com/) | Same Upstash database.                                                                      |
| `VOYAGE_API_KEY`                  | [Voyage AI](https://www.voyageai.com/)  | Embeddings for RAG knowledge base.                                                          |
| `CRON_SECRET`                     | —                                       | Bearer token for Vercel cron job auth (required in prod/preview).                           |
| `RESEND_API_KEY`                  | [Resend](https://resend.com/)           | Magic link emails for donor verification and admin alerts.                                  |
| `RESEND_ADMIN_EMAIL`              | —                                       | Admin notification recipient (default: `whoclinches@austinrt.com`).                         |
| `BMC_WEBHOOK_SECRET`              | —                                       | HMAC verification for Buy Me a Coffee donation webhooks.                                    |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | —                                       | Preview auth bypass + rate limit bypass for Playwright tests.                               |

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Start the dev server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). This starts both Next.js and a local JSON server for fixture data.

## Development Workflow

### Branch Strategy

- **`develop`**: Development and staging — auto-deploys to https://preview.whoclinches.com
- **`main`**: Production — auto-deploys to https://whoclinches.com

### Workflow

1. All development happens on `develop` branch
2. Pushing to `develop` auto-deploys to preview
3. When ready for production: merge `develop` → `main`
4. Pushing to `main` auto-deploys to production

### Testing

```bash
# Type checking
npx tsc --noEmit

# Unit / integration tests
npm test

# All Jest tests (including slow)
npm run test:all

# End-to-end tests (requires built app on port 3002)
npx playwright test
```

Pre-push hooks run `tsc --noEmit` + `npm run test:all` + `npx playwright test`. GitHub Actions CI runs the same checks on pushes to `main`/`develop` and PRs.

## Data Flow

### 1. Data Fetching (CFBD API → Frontend)

```
CFBD API → Redis cache → reshape functions → API response → Frontend
```

- REST API fetches games, teams, and ratings out of season
- GraphQL replaces REST for game data during the season (faster, includes live scores)
- SSE subscription streams live score updates via GraphQL during the season
- Redis caches CFBD responses (optional in dev/preview, always-on in production)

### 2. Simulation Engine

```
User overrides → tiebreaker calculation → standings display
```

Client-side deduplication: the simulate button hashes the input (games + overrides + season) and skips the API call if inputs haven't changed.

### 3. Sharing

```
Simulate → save snapshot (SHA-256 dedup) → shareable URL → load snapshot
```

Snapshots are stored in `SimulationSnapshot` with a content-addressable hash. Sharing the same scenario twice returns the same URL.

## Documentation

- [docs/ai-guide.md](docs/ai-guide.md) — Non-obvious project behavior, rules, environment config
- [docs/guides/external-analytics-by-conference.md](docs/guides/external-analytics-by-conference.md) — CFBD data gaps vs official tiebreaker requirements

## License

Private project - All rights reserved
