# Who Clinches

A web application that simulates game outcomes to show who clinches conference championship spots. Built with Next.js 16, TypeScript, and the College Football Data (CFBD) API.

## Overview

This application allows users to simulate "what-if" scenarios for college football conference standings by:

- Fetching live game data from CFBD API (REST when out of season, GraphQL when in season)
- Allowing users to override game outcomes
- Calculating standings using official conference tiebreaker rules (supports multiple conferences including SEC, MWC, ACC, MAC, Big Ten, Big 12, AAC, CUSA, Pac-12, Sun Belt)
- Visualizing potential conference championship scenarios

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **API**: College Football Data (CFBD) API - REST API when out of season, GraphQL API when in season
- **Cache**: Upstash Redis (production only) - shared persistent cache for CFBD data
- **Rate Limiting**: `@upstash/ratelimit` (production only) - per-IP sliding window
- **Deployment**: Vercel (serverless functions)
- **Styling**: Tailwind CSS

## Project Structure

```
sec-tiebreaker/
├── app/
│   ├── [sport]/[conf]/
│   │   └── page.tsx              # Conference-specific UI page
│   ├── api/
│   │   ├── games/[sport]/[conf]/
│   │   │   ├── route.ts         # GET: Fetch games from CFBD API
│   │   │   └── subscribe/route.ts # GET: GraphQL subscription for live updates
│   │   ├── simulate/[sport]/[conf]/route.ts  # POST: Tiebreaker simulation endpoint
│   │   ├── stats/
│   │   │   └── rankings/route.ts # GET: CFP rankings from CFBD API
│   │   ├── cfbd-monitor/route.ts  # GET: CFBD API usage monitoring
│   │   ├── cfbd-alert-handler/route.ts # POST: Alert webhook handler
│   │   └── season-status/route.ts # GET: Check if currently in season
│   ├── components/              # React components (UI, standings, games, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── store/                   # Redux store (state management, RTK Query)
│   ├── styles/                  # Conference-specific CSS themes
│   ├── page.tsx                 # Root page (redirects to default conference)
│   └── layout.tsx               # Root layout
├── lib/
│   ├── cfb/
│   │   ├── cfbd-client.ts       # Unified CFBD API client (switches REST/GraphQL)
│   │   ├── cfbd-rest-client.ts  # CFBD REST API client (with API key rotation)
│   │   ├── cfbd-cached.ts      # Redis-backed data access (getTeams, getGames, getRankings, getSp, getFpi)
│   │   ├── cfbd-graphql-client.ts # CFBD GraphQL API client
│   │   ├── tiebreaker-cfbd-requirements.ts # Conditional rating fetches per conference
│   │   ├── tiebreaker-rules/
│   │   │   ├── core/            # Core tiebreaker engine (calculateStandings, breakTie)
│   │   │   ├── common/          # Common tiebreaker rules (A-F)
│   │   │   ├── sec/             # SEC-specific rules and config
│   │   │   ├── mwc/             # MWC-specific rules and config
│   │   │   ├── acc/             # ACC-specific rules and config
│   │   │   ├── mac/             # MAC-specific rules and config
│   │   │   ├── b1g/             # Big Ten-specific rules and config
│   │   │   ├── big12/           # Big 12-specific rules and config
│   │   │   ├── pac12/           # Pac-12-specific rules and config
│   │   │   ├── aac/             # AAC-specific rules and config
│   │   │   ├── cusa/            # CUSA-specific rules and config
│   │   │   └── sunbelt/         # Sun Belt-specific rules and config
│   │   └── helpers/             # Helper functions (season detection, prefill, stats attachment)
│   ├── api/                     # API utilities (same-origin-gate, payload-hash)
│   ├── client/                  # Client-side utilities (input-hash)
│   ├── fixtures/                # Fixture data loader for testing
│   ├── utils/                   # Utility functions (game grouping, organization)
│   ├── redis.ts                 # Upstash Redis client and fetch<T> cache primitive
│   ├── reshape-games.ts         # Game data transformation
│   ├── reshape-teams-from-cfbd.ts # Team data transformation from CFBD
│   ├── api-types.ts            # API request/response types
│   └── types.ts                 # Internal application types
├── __tests__/                   # Jest test files
├── __fixtures__/                # Test fixture data (CFBD API responses)
├── docs/                        # Documentation (see docs/ai-loading-manifest.md)
└── types/                       # TypeScript type definitions
```

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

| Variable       | Service                                                   | Where to get it                                                                                                                                                                             |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CFBD_API_KEY` | [College Football Data](https://collegefootballdata.com/) | Create a free account, grab your key from your [account page](https://collegefootballdata.com/key). Free Patreon tier works for dev. Comma-separate multiple keys for rotation in non-prod. |
| `DATABASE_URL` | [Neon](https://neon.tech/)                                | Create a free Postgres project. Copy the **pooled** connection string and append `?sslmode=require&pgbouncer=true`.                                                                         |
| `DIRECT_URL`   | [Neon](https://neon.tech/)                                | Same project — copy the **direct** (unpooled) connection string, append `?sslmode=require`. Used by Prisma for migrations.                                                                  |

#### Optional

| Variable                   | Service                                 | Purpose                                                                                     |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | [Upstash](https://console.upstash.com/) | Redis cache and rate limiting. Without it the app skips caching — still works fine for dev. |
| `UPSTASH_REDIS_REST_TOKEN` | [Upstash](https://console.upstash.com/) | Same Upstash database.                                                                      |
| `RESEND_API_KEY`           | [Resend](https://resend.com/)           | Email alerts for low CFBD API usage.                                                        |
| `RESEND_FROM_EMAIL`        | [Resend](https://resend.com/)           | Verified sender address.                                                                    |
| `CFBD_ALERT_WEBHOOK_URL`   | —                                       | Webhook URL for low API call alerts.                                                        |
| `CFBD_ALERT_EMAIL`         | —                                       | Email address for low API call alerts.                                                      |
| `FIXTURE_YEAR`             | —                                       | Use local fixture data instead of live CFBD API (e.g., `2025`).                             |

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

- **`develop`**: Development and staging work
  - Auto-deploys to: https://who-clinches-git-develop-austinrts-projects.vercel.app/
- **`main`**: Production releases
  - Auto-deploys to: https://whoclinches.com/

### Workflow

1. All development happens on `develop` branch
2. Commits auto-deploy to staging URL for testing
3. When ready for production: merge `develop` → `main`
4. Production deployment happens automatically

### TypeScript Strict Mode

This project enforces **strict TypeScript checking** via pre-commit hooks (lint-staged):

```bash
npm run dev  # Runs: concurrently "npm run json-server" "next dev"
```

**Zero TypeScript errors** are tolerated. All code must be fully typed with NO `any` types. Type checking runs automatically on commit via Husky pre-commit hooks.

## Data Flow

### 1. Data Fetching (CFBD API → Frontend)

```
CFBD API → reshape functions → API response → Frontend
```

**Endpoints:**

- `GET /api/games/[sport]/[conf]` - Fetch games and teams from CFBD API, reshape, return data
- `GET /api/games/[sport]/[conf]/subscribe` - GraphQL subscription for live score updates (Server-Sent Events)
- `GET /api/stats/rankings` - Fetch CFP rankings from CFBD API

**Frontend Loading Strategy:**

- Initial load fetches from CFBD API
- Live updates use GraphQL subscriptions (when in season) or REST API polling (when out of season)

### 2. Simulation Engine

```
User overrides → tiebreaker calculation → standings display
```

**Endpoints:**

- `POST /api/simulate/[sport]/[conf]` - Simulate conference standings with optional game overrides

**Utility Endpoints:**

- `GET /api/season-status` - Check if currently in season
- `GET /api/cfbd-monitor` - Monitor CFBD API usage and remaining calls
- `POST /api/cfbd-alert-handler` - Webhook handler for API usage alerts

## Key Design Decisions

### CFBD Types as Source of Truth

All types are derived from CFBD's TypeScript package:

```typescript
import type { Conference, Game, Team } from 'cfbd';

// Conference identifier uses CFBD's Conference type
type ConferenceSlug = NonNullable<Conference['abbreviation']>;
```

**Benefits:**

- Type safety from official CFBD types
- No custom type mapping needed
- Direct compatibility with CFBD API responses

### Shared Redis Cache (Production Only)

CFBD data is cached in Upstash Redis to share data across Vercel instances and reduce cold start API calls. Redis is gated to production via `VERCEL_ENV`. Non-production environments fetch directly from the CFBD API.

## Testing

```bash
# Type checking
npm run build

# Linting
npm run lint
```

## Documentation

- **Getting Started**: See [docs/ai-guide.md](docs/ai-guide.md) for AI development guidelines
- **Documentation Loading**: See [docs/ai-loading-manifest.md](docs/ai-loading-manifest.md) for documentation structure
- **API Reference**: [docs/guides/api-reference.md](docs/guides/api-reference.md) - Complete endpoint documentation
- **AI Development Guide**: [docs/ai-guide.md](docs/ai-guide.md) - AI assistant development guidelines

## License

Private project - All rights reserved
