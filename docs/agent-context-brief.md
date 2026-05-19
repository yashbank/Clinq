# Clinq — Agent context brief

Compact reference for Cursor agents. Read this instead of long chat history. **Never commit secrets.**

## Product purpose

Clinq is a premium **freelancer operating system**: lead discovery and staging, AI proposal generation, pipeline CRM, integrations (Freelancer OAuth, GitHub/Reddit public search), scraped-lead review, profile intelligence, and analytics. Real data only — no fake metrics or demo behavior.

## Tech stack

- **Next.js 15** (App Router), React, TypeScript, Tailwind
- **Supabase** — Auth (email/password), Postgres + RLS, server/client via `@supabase/ssr`
- **OpenAI** — proposals, lead intelligence, profile enrichment (server-only `OPENAI_API_KEY`)
- **Deploy** — Vercel; env via `.env.local` / Vercel project settings

## Architecture

- `src/app/` — routes (server components + client islands)
- `src/actions/` — Server Actions (mutations, imports)
- `src/lib/` — domain logic (leads, integrations, scoring, currency)
- `src/components/` — UI by feature
- `middleware.ts` — session refresh + protected route redirects
- `supabase/migrations/` — schema; apply for local/prod parity

Auth env is read only as **`NEXT_PUBLIC_SUPABASE_URL`** + **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (see `src/utils/supabase-env.ts`, `src/utils/env-public.ts`). There is no `SUPABASE_URL` alias in code. Service role: **`SUPABASE_SERVICE_ROLE_KEY`** (server-only, integrations admin paths).

## Key routes

| Route | Purpose |
|-------|---------|
| `/login`, `/signup`, `/forgot-password` | Supabase email auth |
| `/auth/callback` | OAuth / email confirm redirect |
| `/dashboard` | Home metrics, onboarding |
| `/leads` | Lead table, scoring, capture |
| `/pipeline` | Kanban stages (optimistic DnD) |
| `/proposals` | Proposal studio (`?leadId=` hydrates RFP) |
| `/integrations` | Freelancer OAuth, GitHub/Reddit ingest |
| `/integrations/scraped` | Scraped queue review, recompute, bulk promote |
| `/profile`, `/onboarding` | Profile + completeness gate |
| `/follow-ups`, `/automations`, `/analytics`, `/settings` | Workflow + settings |

## Source ingestion flow

1. **Freelancer** — OAuth/PAT → API fetch → normalize → `scraped_leads` (dedupe by `import_external_id`) → `processScrapedLeads` (relevance v2) → promote to `leads` or skip.
2. **GitHub / Reddit** — `runPublicSourceIngestAction` → adapter fetch → same staging + process path. GitHub: query variants + 422 fallback (`github-search-query.ts`). Reddit disabled without `REDDIT_OAUTH_ACCESS_TOKEN`.
3. Counters returned: **fetched, staged, promoted, duplicates, invalid, irrelevant, persist_failed**. Dedupe: scraped history + `lead_import_ext_ids_existing` RPC (fallback per-id lookup if RPC missing).

## Scraped leads flow

- Rows in `scraped_leads` with `processed`, `skip_reason`, optional `relevance_score`, `dismissed_at`.
- Review UI: filters (source/state/score), bulk promote/dismiss, **Recompute intelligently** → `recomputeScrapedRelevanceAction` → optional promote dialog for newly qualifying ids.
- Manual promote: `promoteScrapedLeadManuallyAction`. Profile completeness gate for curated workflow.

## Lead ranking / budget confidence

- Lead `score` + metadata (`lead_tier`, intelligence fields) from `insertLeadWithIntelligence` / recalc actions.
- Scraped relevance: `computeScrapedRelevanceV2` (threshold ~47). Display budget uses USD normalization + preferred currency; low-confidence budgets may be hidden in pipeline/leads UI.

## Proposal generation

- `/proposals` — RFP panel, `AIWritingPanel`, sections + full generate via `/api/ai/proposal`.
- Lead context: `loadProposalLeadRfpAction` + `canonicalProposalRfpSeedFromLead`.
- Quality: `ProposalQualityPanel` + `parseProposalEvaluation` (tolerant partial scores).
- Profile gate: API returns `PROFILE_INCOMPLETE` → calm toast.

## Profile intelligence / resume parsing

- `profiles` table + `loadFreelancerProfileForAi`, `assessProfileCompleteness`.
- Resume upload → `/api/profile/parse-resume` → merge into profile fields.

## Pipeline / follow-ups / automations

- Pipeline: `updateLeadStageAction`, optimistic client state in `pipeline-page-client.tsx`.
- Follow-ups and automations: server actions + workflow tables (see `src/actions/follow-ups.ts`, `workflows.ts`).

## Current stabilization priorities

- Auth/env reliability (valid Supabase URL, DNS reachable, calm login errors).
- Repeated import dedupe + accurate result toasts.
- Scraped review stability (filters, recompute counts).
- Pipeline optimistic persistence + rollback.
- Proposal evaluation partial payloads.
- Softer borders/surfaces (theme tokens) — refinement only, no redesign.

## Known env / auth issue

**Symptom:** `getaddrinfo ENOTFOUND <project>.supabase.co` and login message about authentication service unreachable.

**Likely cause:** `NEXT_PUBLIC_SUPABASE_URL` points to a **non-existent or paused/deleted** Supabase project (hostname does not resolve in DNS). Env **shape** can be valid (`https://<ref>.supabase.co`) while the project ref is wrong.

**Not a code bug** if DNS fails for the configured host. Fix in Supabase Dashboard → Project Settings → API: copy **Project URL** and **anon key** into `.env.local`, restart `npm run dev`.

Wrong variable names (`SUPABASE_URL` without `NEXT_PUBLIC_`) will fail at build/runtime via `getSupabasePublicEnv()`.

## Local dev checklist

1. Copy `.env.example` → `.env.local`.
2. Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Optional: `SUPABASE_SERVICE_ROLE_KEY` (Freelancer token storage, GitHub PAT store, admin paths).
4. Run `npm run verify:env` — validates presence, URL shape, optional DNS.
5. Run `npm run dev` → http://localhost:3000
6. If login fails with unreachable auth: run `npm run verify:env`; confirm project is active in Supabase; ping host: `nslookup <ref>.supabase.co`.

**ENOTFOUND** = OS cannot resolve the Supabase hostname → fix URL/project, not application logic.

## Commands

```bash
npm run dev
npm run build
npm test
npm run verify:env
```

## Conventions for agents

- Minimal scope; no redesign; no fake data.
- Use existing error helpers: `formatCredentialError`, `formatActionFailure`, `formatWorkspaceLoadError`.
- Supabase skill for migrations/RLS.
- Commit only when asked; user may request push to `main`.
