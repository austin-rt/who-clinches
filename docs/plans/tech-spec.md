# SEC Football Standings Calculator - Technical Specification

> **⚠️ HISTORICAL SPECIFICATION - MAY NOT MATCH CURRENT IMPLEMENTATION**
> 
> **Last Updated:** 2024-11-05  
> **Status:** Historical - See current codebase for implementation details

## Historical Overview

This document specified the original technical design for the SEC Football Standings Calculator application.

**Original Objectives:**
- Automate schedule and standings ingestion for SEC football using ESPN public JSON API
- Persist normalized data in MongoDB via Mongoose (lean mode)
- Serve data through Next.js App Router Route Handlers
- Allow user "what-if" overrides and deterministic tiebreaker calculations

**Original Phases:**
- Phase 1: SEC Football Regular Season (conference games, tiebreaker rules A-D)
- Phase 2: Enhanced Tiebreakers (Tiebreaker E, richer explanations)
- Phase 3: Multi-Conference (abstract tiebreaker rules per conference)
- Phase 4: Live Score Streaming (client-side polling)
- Phase 5: Basketball Support

**Original Stack:**
- Framework: Next.js 14+ App Router
- Language: TypeScript (strict mode)
- Database: MongoDB Atlas
- ORM: Mongoose (lean mode, no hydration)
- Styling: Tailwind CSS
- Hosting: Vercel (serverless)

## Current Implementation

For current implementation details, refer to:
- `/app/api/` - Current API endpoints
- `/docs/guides/api-reference.md` - Current API documentation
- `/docs/ai-guide.md` - Current architecture overview
- `/lib/` - Current implementation code

---

**Note**: This document is preserved for historical reference only. The actual implementation may differ significantly from this original specification.
