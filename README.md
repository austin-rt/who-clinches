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
│   │   ├── standings/[sport]/[conf]/route.ts # GET: Calculate standings from CFBD data
│   │   ├── simulate/[sport]/[conf]/route.ts  # POST: Tiebreaker simulation endpoint
│   │   ├── stats/
│   │   │   ├── rankings/route.ts # GET: CFP rankings from CFBD API
│   │   │   └── advanced/route.ts  # GET: Advanced season statistics (SP+, FPI, etc.)
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
│   │   ├── cfbd-rest-client.ts  # CFBD REST API client
│   │   ├── cfbd-graphql-client.ts # CFBD GraphQL API client
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
│   ├── fixtures/                # Fixture data loader for testing
│   ├── utils/                   # Utility functions (game grouping, organization)
│   ├── reshape-games.ts         # Game data transformation
│   ├── reshape-teams-from-cfbd.ts # Team data transformation from CFBD
│   ├── api-types.ts            # API request/response types
│   └── types.ts                 # Internal application types
├── __tests__/                   # Jest test files
├── __fixtures__/                # Test fixture data (CFBD API responses)
├── docs/                        # Documentation (see docs/ai-loading-manifest.md)
└── types/                       # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- CFBD API key ([Get one here](https://collegefootballdata.com/))

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local file with your CFBD API key (see Environment Variables section below)

# Run development server
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
- `CFBD_ALERT_HANDLER_URL` - Alternative alert handler URL (auto-detected from VERCEL_URL if not set)
- `CFBD_ALERT_EMAIL` - Email address for low API call alerts (optional)
- `RESEND_API_KEY` - Resend API key for email alerts (optional)
- `RESEND_FROM_EMAIL` - From email address for alerts (optional)
- `VERCEL_AUTOMATION_BYPASS_SECRET` - Bypass token for protected Vercel deployments (optional)
- `USE_FIXTURES` - Set to 'true' to use local fixture data instead of CFBD API (development/testing)

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
- `GET /api/standings/[sport]/[conf]` - Calculate current conference standings from completed games
- `GET /api/stats/rankings` - Fetch CFP rankings from CFBD API
- `GET /api/stats/advanced` - Fetch advanced season statistics (SP+, FPI, SOR, etc.) from CFBD API

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
- **AI Development Guide**: [docs/ai-guide.md](docs/ai-guide.md) - AI assistant development guidelines

## License

Private project - All rights reserved
