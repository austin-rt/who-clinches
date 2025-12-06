# Who Clinches

A web application that simulates game outcomes to show who clinches playoff spots and conference championships. Built with Next.js 16, TypeScript, and the College Football Data (CFBD) API.

## Overview

This application allows users to simulate "what-if" scenarios for SEC Football conference standings by:

- Fetching live game data from CFBD API (REST when out of season, GraphQL when in season)
- Allowing users to override game outcomes
- Calculating standings using official SEC tiebreaker rules (A-E)
- Visualizing potential playoff and bowl game scenarios

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **API**: College Football Data (CFBD) API - REST API when out of season, GraphQL API when in season
- **Deployment**: Vercel (serverless functions)
- **Styling**: Tailwind CSS

## Project Structure

```
who-clinches/
├── app/
│   ├── api/
│   │   ├── games/[sport]/[conf]/route.ts          # GET: Fetch games from CFBD API
│   │   ├── games/[sport]/[conf]/subscribe/route.ts # GET: GraphQL subscription for live updates
│   │   ├── standings/[sport]/[conf]/route.ts       # GET: Calculate standings from CFBD data
│   │   ├── simulate/[sport]/[conf]/route.ts        # POST: Tiebreaker simulation endpoint
│   │   ├── cfbd-monitor/route.ts                    # GET: CFBD API usage monitoring
│   │   ├── cfbd-alert-handler/route.ts              # POST: Alert webhook handler
│   │   └── season-status/route.ts                  # GET: Check if currently in season
│   ├── page.tsx                 # Main UI
│   └── layout.tsx
├── lib/
│   ├── cfb/
│   │   ├── cfbd-client.ts       # Unified CFBD API client (switches REST/GraphQL)
│   │   ├── cfbd-rest-client.ts  # CFBD REST API client
│   │   ├── cfbd-graphql-client.ts # CFBD GraphQL API client
│   │   ├── tiebreaker-rules/
│   │   │   ├── core/             # Core tiebreaker engine (calculateStandings, breakTie)
│   │   │   ├── common/           # Common tiebreaker rules (A-D)
│   │   │   └── sec/              # SEC-specific rules and config
│   │   └── helpers/              # Helper functions (season detection, prefill, etc.)
│   ├── reshape-games.ts         # Game data transformation
│   ├── reshape-teams-from-cfbd.ts # Team data transformation from CFBD
│   ├── api-types.ts             # API request/response types
│   └── types.ts                 # Internal application types
└── docs/                        # Documentation (see docs/ai-loading-manifest.md)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- CFBD API key ([Get one here](https://collegefootballdata.com/))
- Environment variables (see `.env.local.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your CFBD API key

# Run development server (includes TypeScript checking)
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment Variables

```bash
CFBD_API_KEY=your_cfbd_api_key  # Required: Get from https://collegefootballdata.com/
```

**API Rate Limits:**
- Free tier: 1,000 calls/month (sufficient for development)
- Tier 2: $1/month (recommended for normal use)
- Tier 3+: Higher limits for in-season usage

**Optional Environment Variables:**

- `CFBD_ALERT_WEBHOOK_URL` - Webhook URL for low API call alerts (optional)
- `CFBD_ALERT_EMAIL` - Email address for low API call alerts (optional)
- `RESEND_API_KEY` - Resend API key for email alerts (optional)
- `RESEND_FROM_EMAIL` - From email address for alerts (optional)

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

This project enforces **strict TypeScript checking** before the dev server starts:

```bash
npm run dev  # Runs: tsc --noEmit && next dev
```

**Zero TypeScript errors** are tolerated. All code must be fully typed with NO `any` types.

## Data Flow

### 1. Data Fetching (CFBD API → Frontend)

```
CFBD API → reshape functions → API response → Frontend
```

**Endpoints:**

- `GET /api/games/[sport]/[conf]` - Fetch games and teams from CFBD API, reshape, return data
- `GET /api/games/[sport]/[conf]/subscribe` - GraphQL subscription for live score updates (Server-Sent Events)
- `GET /api/standings/[sport]/[conf]` - Calculate current conference standings from completed games

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

### Direct API Integration

All data is fetched directly from CFBD API on each request. No database persistence is used.

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
- **Technical Spec**: [docs/plans/tech-spec.md](docs/plans/tech-spec.md) - Comprehensive technical specification
- **AI Development Guide**: [docs/ai-guide.md](docs/ai-guide.md) - AI assistant development guidelines

## Current Status

✅ **Complete**: CFBD API Integration

- CFBD REST and GraphQL API integration
- Season-based API switching (REST out of season, GraphQL in season)
- GraphQL subscriptions for live score updates
- Strongly typed API layer using CFBD TypeScript types

✅ **Complete**: Tiebreaker Engine

- SEC rules implementation (Rules A-E)
- Simulation endpoint (`/api/simulate/[sport]/[conf]`)
- User score overrides
- Standings calculation

✅ **Complete**: Frontend UI

- Game picker interface
- Standings visualization
- Simulation controls
- Live score updates via GraphQL subscriptions

## License

Private project - All rights reserved
