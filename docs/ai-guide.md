# AI Guide

College football tiebreaker simulation app. Read the code for implementation details — this doc covers only what code can't tell you.

## Rules

- **No `eslint-disable`** — fix the code instead
- **No inline type imports** — no `Promise<import('./path').Type>` syntax
- **No code comments** — write self-documenting code; existing comments remain
- **File deletions last** — delete only after all changes pass lint, typecheck, and tests
- **Never edit `docs/tiebreaker-rules/*.txt`** — singular source of truth extracted from official conference PDFs

## Non-Obvious Behavior

- **Score normalization**: Non-SEC overrides are normalized to 1-0 (W/L) before simulation and hashing. Only SEC Rule E uses exact scoring margin.
- **CFBD API key rotation**: `CFBD_API_KEY` is comma-separated in preprod for key rotation. Production uses one key only.
- **Admin dashboard**: Returns 404 for `/admin*` in production. Dev/preview only.
- **DaisyUI `.btn` override**: Default button colors are stripped — new button variants must have explicit color classes defined.
- **Same-origin check**: POST endpoints protected in middleware, not route handlers. Webhook and cron routes are exempt.
- **Chat credits**: Free-tier usage (4 messages per 4-hour rolling window) tracked per signed cookie, not IP. Credits only drain after free window exhausted.
- **CFBD chat tool**: AI can call any CFBD endpoint except a small denylist. Live-data endpoints skip Redis cache for the current season only.
- **Season phase in chat**: System prompt includes explicit season phase (preseason/regular/postseason + current week) so the AI doesn't confuse preseason 0-0 standings with mid-season data.
- **RAG cron dedup**: Monthly cron refreshes static CFBD sources. Hash comparison skips Voyage embedding when data is unchanged.

## Environments

- **Production**: https://whoclinches.com (`main` branch, `VERCEL_ENV=production`)
- **Preview**: https://preview.whoclinches.com (`develop` branch, `VERCEL_ENV=preview`)
- **Local**: http://localhost:3000

## Preview Bypass

Preview has Vercel Protection. For browser testing (Playwright MCP), inject the bypass header before navigating:

```js
await page.setExtraHTTPHeaders({
  'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
});
```

Cookie/query-param approaches fail because Vercel redirects server-side before checking them, breaking sub-resource requests (CSS, JS, fonts).

## Environment Variables

| Variable                          | Required           | Description                                                        |
| --------------------------------- | ------------------ | ------------------------------------------------------------------ |
| `CFBD_API_KEY`                    | Yes                | Comma-separated for preprod rotation. Production: single key       |
| `ANTHROPIC_API_KEY`               | Yes                | Haiku 4.5 for AI chat                                              |
| `UPSTASH_REDIS_REST_URL`          | No                 | Always-on in production; toggleable via admin in dev/preview       |
| `UPSTASH_REDIS_REST_TOKEN`        | No                 | Paired with above                                                  |
| `DATABASE_URL`                    | Yes (prod/preview) | Neon pooled PostgreSQL URL for Prisma                              |
| `DIRECT_URL`                      | Yes (prod/preview) | Neon non-pooled URL for Prisma migrations                          |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | No                 | Preview auth bypass + rate limit bypass                            |
| `VOYAGE_API_KEY`                  | No                 | Voyage AI embeddings for RAG knowledge base                        |
| `CHAT_IDENTITY_SECRET`            | Yes                | HMAC signing key for anonymous chat cookies                        |
| `CRON_SECRET`                     | Yes (prod/preview) | Bearer token for Vercel cron job auth                              |
| `RESEND_API_KEY`                  | No                 | Email delivery for magic links and notifications                   |
| `RESEND_ADMIN_EMAIL`              | No                 | Admin notification recipient (default: `whoclinches@austinrt.com`) |
| `BMC_WEBHOOK_SECRET`              | No                 | HMAC verification for Buy Me a Coffee webhooks                     |

## CI & Branch Protection

- **Pre-push hook**: `tsc --noEmit` + `npm run test:all` (Jest) + `npx playwright test` (e2e). Blocks push on failure.
- **GitHub Actions**: `tsc --noEmit` + `npm test` + `npx playwright test` on push to `main`/`develop` and PRs. E2E job uses `FIXTURE_YEAR=2025` with Neon DB secrets.
- **Branch ruleset**: PRs to `main` must come from `develop`. Owner bypasses for direct pushes.

## Constraints

- **Vercel timeouts**: 60s (Pro), 10s (Hobby)
- **CFBD API**: Free: 1,000/month, Tier 2: $1/month, Tier 3+: higher for in-season
- **Rate limiting**: 60 req/min per IP sliding window in production/preview. Bypass with `VERCEL_AUTOMATION_BYPASS_SECRET`.
- **Redis**: Always-on in production. Toggleable via admin dashboard in dev/preview.

## External Analytics Gaps

See `docs/guides/external-analytics-by-conference.md` for the known gap between what official tiebreaker rules require and what CFBD provides. This affects correctness decisions for every conference's Team Rating Score implementation.
