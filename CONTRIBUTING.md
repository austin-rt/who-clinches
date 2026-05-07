# Contributing to Who Clinches

Thanks for your interest in contributing! This guide walks you through the process from finding something to work on to getting your change merged.

## Getting Started

1. **Fork the repository** at [github.com/austin-rt/who-clinches](https://github.com/austin-rt/who-clinches)
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/who-clinches.git
   cd who-clinches
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Set up your environment:**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in the required API keys (see [Environment Variables](#environment-variables) below).
5. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```
6. **Start the dev server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. Here's what each service is and where to get credentials:

### Required

| Variable       | Service                                                       | How to get it                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CFBD_API_KEY` | [College Football Data API](https://collegefootballdata.com/) | Create a free account at [collegefootballdata.com](https://collegefootballdata.com/). Your API key is on your [account page](https://collegefootballdata.com/key). The free Patreon tier is sufficient for development. |
| `DATABASE_URL` | [Neon](https://console.neon.tech/) (Postgres)                 | Sign up at [neon.tech](https://neon.tech/), create a project, and copy the **pooled** connection string from the [dashboard](https://console.neon.tech/). Append `?sslmode=require&pgbouncer=true`.                     |
| `DIRECT_URL`   | [Neon](https://console.neon.tech/) (Postgres)                 | Same Neon project — copy the **direct** (unpooled) connection string. Append `?sslmode=require`. This is used by Prisma for migrations.                                                                                 |

### Optional

These aren't needed to run the app locally but enable additional features:

| Variable                   | Service                                       | How to get it                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | [Upstash](https://upstash.com/) (Redis)       | Create a free Redis database at [console.upstash.com](https://console.upstash.com/). Copy the REST URL from the database details page. Without this, the app skips caching and rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | [Upstash](https://upstash.com/) (Redis)       | Same Upstash database — copy the REST token.                                                                                                                                                  |
| `RESEND_API_KEY`           | [Resend](https://resend.com/api-keys) (Email) | Only needed for CFBD API key usage alerts. Sign up at [resend.com](https://resend.com/) and create an [API key](https://resend.com/api-keys).                                                 |
| `RESEND_FROM_EMAIL`        | [Resend](https://resend.com/) (Email)         | The verified sender email address from your Resend account.                                                                                                                                   |

> **Tip:** You only need `CFBD_API_KEY` and the two Neon database URLs to get the app running. Everything else is optional for local development.

## Finding Something to Work On

- Browse [open issues](https://github.com/austin-rt/who-clinches/issues) for bugs or feature requests
- Issues labeled `good first issue` are great starting points
- If you find a bug or have an idea, [open an issue](https://github.com/austin-rt/who-clinches/issues/new/choose) first to discuss it before writing code

## Workflow

1. **Open or find an issue** describing the change
2. **Create a branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b your-branch-name
   ```
3. **Make your changes** and commit with clear messages
4. **Run checks** before pushing:
   ```bash
   npx tsc --noEmit        # type check
   npm test                 # run tests
   ```
5. **Push your branch** and open a pull request against `develop`:
   ```bash
   git push origin your-branch-name
   ```
6. **Reference the issue** in your PR description (e.g., "Closes #42")

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Add tests for new logic when applicable
- Make sure all checks pass (TypeScript, ESLint, tests)
- PRs are merged to `develop` first, then promoted to `main` for production

## Code Style

- TypeScript throughout the codebase
- Tailwind CSS with DaisyUI for styling
- ESLint and Prettier run automatically via pre-commit hooks
- No need to run formatters manually -- hooks handle it

## Project Structure

```
app/                  # Next.js app router pages and components
  api/                # API route handlers
  components/         # Shared React components
  store/              # Redux store (RTK Query)
lib/                  # Server-side utilities, types, and helpers
  cfb/                # CFBD API clients and data processing
prisma/               # Database schema and migrations
__tests__/            # Test files (mirrors lib/ structure)
scripts/              # Dev tooling and fixture capture
```

## Questions?

Open a [discussion](https://github.com/austin-rt/who-clinches/issues) or reach out in an issue. We're happy to help.
