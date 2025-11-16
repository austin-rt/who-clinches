# SEC Tiebreaker

A web application for simulating SEC Football standings and exploring tiebreaker scenarios. Built with Next.js 16, TypeScript, MongoDB, and the ESPN public API.

## Overview

This application allows users to simulate "what-if" scenarios for SEC Football conference standings by:

- Fetching live game data from ESPN's public API
- Storing historical and upcoming game information
- Allowing users to override game outcomes
- Calculating standings using official SEC tiebreaker rules (A-D)
- Visualizing potential playoff and bowl game scenarios

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB Atlas + Mongoose
- **API**: ESPN Public JSON API ([Unofficial Documentation](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b))
- **Deployment**: Vercel (serverless functions)
- **Styling**: Tailwind CSS

## Project Structure

```
sec-tiebreaker/
├── app/
│   ├── api/
│   │   ├── games/route.ts       # Query games from database
│   │   ├── pull-games/route.ts  # Ingest game data from ESPN
│   │   ├── pull-teams/route.ts  # Ingest team data from ESPN
│   │   ├── simulate/route.ts    # Tiebreaker simulation endpoint
│   │   └── cron/                # Automated update endpoints
│   ├── page.tsx                 # Main UI
│   └── layout.tsx
├── lib/
│   ├── mongodb.ts               # MongoDB connection singleton
│   ├── espn-client.ts           # ESPN API client
│   ├── reshape-games.ts         # Game data transformation
│   ├── reshape-teams.ts         # Team data transformation
│   ├── tiebreaker-helpers.ts    # SEC tiebreaker rules implementation
│   ├── prefill-helpers.ts       # Predicted score calculation
│   ├── api-types.ts             # API request/response types
│   ├── types.ts                 # Internal application types
│   └── models/
│       ├── Game.ts              # Game schema
│       ├── Team.ts              # Team schema
│       └── Error.ts             # Error logging schema
└── docs/                        # Documentation (see docs/navigation-hub.md)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Environment variables (see `.env.local.example`)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI

# Run development server (includes TypeScript checking)
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment Variables

The MongoDB connection is dynamically constructed and **automatically selects the correct database** based on the deployment environment:

```bash
MONGODB_USER=your_username
MONGODB_PASSWORD=your_password
MONGODB_HOST=cluster0.rr6gggn.mongodb.net
MONGODB_APP_NAME=SEC-Tiebreaker
```

**Database Selection (Fail-Safe):**

The database name **must be explicitly set** via environment variables:

```bash
MONGODB_DB=test  # Explicit database name (takes priority)
```

Or falls back to Vercel's automatic environment:

```bash
VERCEL_ENV=production  # Vercel sets this automatically per branch
```

**Examples:**

- **Local**: Set `MONGODB_DB=test` in `.env.local`
- **Vercel develop branch**: `VERCEL_ENV=preview` (automatic) → Database = `preview`
- **Vercel main branch**: `VERCEL_ENV=production` (automatic) → Database = `production`
- **Staging**: Set `MONGODB_DB=staging` override in Vercel

**Safety:**

- ✅ **No fallback defaults** - app fails if database not specified
- ✅ Prevents accidentally connecting to wrong database
- ✅ Explicit configuration required for all environments
- ✅ Vercel deployments work automatically via `VERCEL_ENV`

## Development Workflow

### Branch Strategy

- **`develop`**: Development and staging work
  - Auto-deploys to: https://sec-tiebreaker-git-develop-austinrts-projects.vercel.app/
- **`main`**: Production releases
  - Auto-deploys to: https://sec-tiebreaker-git-main-austinrts-projects.vercel.app/

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

### 1. Data Ingestion (ESPN → MongoDB)

```
ESPN API → reshape functions → MongoDB
```

**Endpoints:**

- `POST /api/pull-games` - Fetch and store game data
- `POST /api/pull-teams` - Fetch and store team data

### 2. Data Retrieval (MongoDB → Frontend)

```
MongoDB → lean queries → strongly typed transformations → API response
```

**Endpoints:**

- `GET /api/games` - Query games with filters (season, week, team, etc.)

### 3. Simulation Engine

```
User overrides → tiebreaker calculation → standings display
```

**Endpoints:**

- `POST /api/simulate` - Simulate SEC standings with optional game overrides

## Key Design Decisions

### ESPN IDs as Primary Keys

Team documents use ESPN's team IDs directly as MongoDB `_id`:

```typescript
// Team document
{
  _id: "61",  // ESPN team ID for Georgia
  name: "Bulldogs",
  displayName: "Georgia Bulldogs",
  // ...
}
```

**Benefits:**

- No redundant ID fields
- Direct relationship mapping
- Simpler queries

### Lean Queries with Strong Typing

All database reads use Mongoose `.lean()` for performance, with explicit type transformations:

```typescript
const gamesRaw = await Game.find(query).lean().exec();
const games: GameLean[] = gamesRaw.map(
  (game): GameLean => ({
    _id: String(game._id),
    espnId: String(game.espnId),
    // ... explicit field-by-field transformation
  })
);
```

### Null vs Undefined Semantics

- `null`: Data was fetched but not available (e.g., no betting odds)
- `undefined`: Data not yet fetched

### Multi-Sport Architecture

The ESPN client and data models support multiple sports/leagues for future expansion beyond SEC Football.

## API Endpoints

### GET /api/games

Query stored games with filters.

**Query Parameters:**

- `season` - Year (e.g., 2024)
- `week` - Week number
- `sport` - Sport type (default: "football")
- `league` - League type (default: "college-football")
- `conferenceId` - Conference ID (8 for SEC)
- `state` - Game state: "pre", "in", "post"
- `from` / `to` - Date range filters

**Response:**

```json
{
  "events": [...],
  "teams": [...],
  "lastUpdated": "2024-11-10T..."
}
```

### POST /api/pull-games

Fetch game data from ESPN and store in database.

**Request Body:**

```json
{
  "season": 2025,
  "conferenceId": 8,
  "week": 12,
  "sport": "football",
  "league": "college-football"
}
```

### POST /api/pull-teams

Fetch team data from ESPN and store in database.

**Request Body:**

```json
{
  "teams": ["ALA", "UGA", "LSU"],
  "sport": "football",
  "league": "college-football"
}
```

## Database Schema

### Game Collection

```typescript
{
  espnId: string,           // ESPN game ID
  date: string,             // ISO date
  week: number | null,
  season: number,
  sport: string,
  league: string,
  state: "pre" | "in" | "post",
  completed: boolean,
  conferenceGame: boolean,
  neutralSite: boolean,
  home: {
    teamEspnId: string,
    abbrev: string,
    score: number | null,
    rank: number | null
  },
  away: { /* same structure */ },
  odds: {
    favoriteTeamEspnId: string | null,
    spread: number | null,
    overUnder: number | null
  },
  lastUpdated: Date
}
```

**Indexes:**

- Compound: `{ sport, league, conferenceGame, season, week }`
- `{ state, completed }`
- `{ "home.teamEspnId" }`
- `{ "away.teamEspnId" }`

### Team Collection

```typescript
{
  _id: string,              // ESPN team ID (primary key)
  name: string,
  displayName: string,
  abbreviation: string,
  logo: string,
  color: string,
  alternateColor: string,
  conferenceId: string,
  record: {
    overall: string,        // "8-1"
    conference: string,     // "6-1"
    home: string,
    away: string,
    stats: { /* win %, points, etc */ }
  },
  standingSummary: string,  // "3rd in SEC"
  currentRank: number,
  playoffSeed: number,
  nextGameId: string,
  lastUpdated: Date
}
```

## Testing

```bash
# Type checking
npm run build

# Linting
npm run lint
```

## Documentation

- **Getting Started**: See [docs/navigation-hub.md](docs/navigation-hub.md) for complete documentation index
- **API Reference**: [docs/guides/api-reference.md](docs/guides/api-reference.md) - Complete endpoint documentation
- **Technical Spec**: [docs/plans/tech-spec.md](docs/plans/tech-spec.md) - Comprehensive technical specification
- **AI Development Guide**: [docs/ai-guide.md](docs/ai-guide.md) - AI assistant development guidelines

## Current Status

✅ **Phase 1 Complete**: API Foundation

- ESPN data ingestion
- MongoDB integration
- Strongly typed API layer
- Game and team data storage

✅ **Phase 2 Complete**: Tiebreaker Engine

- SEC rules implementation (Rules A-E)
- Simulation endpoint (`/api/simulate`)
- User score overrides
- Automated cron jobs for data updates

📋 **Phase 3 Planned**: Frontend UI

- Game picker interface
- Standings visualization
- Simulation controls

## License

Private project - All rights reserved
