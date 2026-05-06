# Clinq — Cursor Skills, Engineering Standards & AI Stack

## Purpose

This file defines the engineering quality, AI standards, UI/UX philosophy, architecture direction, and development expectations for all future Cursor prompts and implementations inside Clinq.

Cursor should treat this file as a persistent product intelligence + engineering standards layer.

---

# PRODUCT POSITIONING

Clinq is:

* an AI-powered freelancer operating system
* an intelligent lead discovery and proposal platform
* a personal freelancer growth engine
* a future SaaS platform for freelancers/agencies

The product should feel:
 
* premium
* minimal
* intelligent
* trustworthy
* fast
* scalable
* enterprise-grade

Avoid:

* fake AI feeling
* gimmicky animations
* cluttered dashboards
* cyberpunk styling
* random gradients
* excessive glowing effects
* fake analytics
* fake notifications
* unrealistic claims

The experience should feel closer to:

* Linear
* Vercel
* Notion
* Stripe
* Apple
* Raycast
* Framer

---

# CORE PRODUCT PRINCIPLES

1. REAL DATA ONLY
   Never show fake metrics, fake AI outputs, fake analytics, or fake user activity.

2. MINIMAL UI
   Every component must earn its place.
   Avoid visual noise.

3. FAST UX
   Interactions should feel instant.
   Use optimistic UI carefully.
   Avoid blocking states.

4. TRUSTWORTHY AI
   AI should:

* explain reasoning
* avoid exaggerated confidence
* provide useful suggestions
* avoid buzzword-heavy outputs

5. USER-FIRST WORKFLOW
   The app should reduce:

* time waste
* repetitive work
* poor proposals
* fake clients
* bad lead selection

6. PROFESSIONAL DESIGN
   UI must feel production-ready and polished.

---

# OFFICIAL UI/UX DIRECTION

## Design Style

* Apple-like minimalism
* Linear-inspired dashboards
* Vercel-style spacing
* subtle glass surfaces only where needed
* clean typography hierarchy
* premium whitespace
* smooth transitions

## Colors

Primary:

* neutral dark surfaces
* soft cyan accents
* subtle gradients only

Avoid:

* neon overload
* rainbow gradients
* strong blur everywhere
* harsh shadows

## Motion

Use:

* subtle transitions
* opacity fades
* smooth hover states
* soft scaling
* minimal movement

Avoid:

* bouncing animations
* excessive parallax
* distracting particles
* overuse of motion

## Typography

Prioritize:

* readability
* hierarchy
* breathing space
* balanced density

---

# REQUIRED ENGINEERING QUALITY

## Architecture

Always maintain:

* modular structure
* scalable architecture
* reusable components
* separation of concerns
* clean file organization

## Code Standards

Always:

* use TypeScript safely
* avoid any unless required
* avoid duplicated logic
* avoid giant components
* avoid dead code
* avoid fake loading states

## Performance

Prioritize:

* server components where possible
* lazy loading
* code splitting
* minimal hydration
* low bundle size
* smooth scrolling
* mobile responsiveness

## Accessibility

Ensure:

* keyboard navigation
* visible focus states
* readable contrast
* semantic HTML
* screen responsiveness

---

# OFFICIAL AI STACK

## Current Core Model

Use:

* OpenAI GPT-4o-mini for fast structured generation

Future optional models:

* GPT-4.1
* Claude Sonnet
* Gemini Pro
* DeepSeek

## AI Use Cases

Clinq AI should handle:

* proposal generation
* lead scoring
* scam detection
* profile intelligence
* skill extraction
* client analysis
* portfolio matching
* follow-up generation
* proposal quality evaluation
* freelancer positioning suggestions

## AI Output Rules

AI outputs must:

* be concise
* be professional
* avoid fluff
* avoid sounding robotic
* avoid generic proposals
* use contextual reasoning
* personalize heavily

## Prompt Engineering Standards

Prompts should:

* define role clearly
* include constraints
* include output format
* include quality checks
* avoid hallucinations
* prefer deterministic outputs where possible

---

# OFFICIAL FRONTEND STACK

Framework:

* Next.js App Router

Language:

* TypeScript

Styling:

* TailwindCSS

UI:

* shadcn/ui

Animation:

* Framer Motion

Icons:

* Lucide React

Charts:

* Recharts (minimal usage only)

Forms:

* React Hook Form
* Zod validation

State:

* Server-first architecture
* minimal client state

---

# OFFICIAL BACKEND STACK

Database:

* Supabase PostgreSQL

Auth:

* Supabase Auth

Storage:

* Supabase Storage

RLS:

* Required everywhere

API:

* Next.js Route Handlers

Server Actions:

* Preferred when appropriate

---

# OFFICIAL PRODUCT WORKFLOW

## Lead Workflow

1. User connects platforms
2. User uploads resume/profile links
3. System extracts profile intelligence
4. System imports/saves leads
5. AI analyzes lead quality
6. AI scores lead
7. AI generates proposal
8. User copies/sends proposal manually
9. System tracks pipeline
10. AI suggests follow-ups/improvements

---

# DASHBOARD RULES

Dashboard must:

* stay clean
* prioritize usability
* avoid overcrowding
* show actionable information only
* adapt to empty/new users gracefully

Avoid:

* fake charts
* decorative metrics
* noisy widgets

---

# INTEGRATION RULES

Current integrations:

* Freelancer
* Fiverr
* Upwork
* Contra

Current stage:

* architecture + connection states only

Future:

* OAuth
* sync workers
* ingestion pipelines
* browser extension

Never fake imported data.

---

# MOBILE EXPERIENCE RULES

Mobile must:

* feel native
* use drawers/sheets intelligently
* avoid sticky oversized sidebars
* keep spacing breathable
* preserve desktop quality

---

# EMPTY STATE RULES

Every empty state should:

* guide user clearly
* explain next action
* avoid filler text
* feel polished

---

# LOADING EXPERIENCE RULES

Loading states should:

* feel premium
* use skeletons properly
* avoid layout shifts
* avoid flashing content
* avoid repetitive loaders

---

# SECURITY RULES

Never:

* expose secrets
* expose service role keys
* trust client-only validation
* bypass RLS carelessly

Always:

* validate inputs
* sanitize uploads
* enforce auth
* protect APIs

---

# FUTURE ROADMAP

Future enhancements:

* browser extension
* direct proposal sending
* AI lead scraping agents
* smart reminders
* WhatsApp/email notifications
* AI market analysis
* proposal success prediction
* advanced analytics
* freelancer growth recommendations
* agency/team support
* subscription billing
* AI voice assistant
* autonomous workflows

---

# CURSOR EXECUTION RULES

Before major implementation:

1. understand BRD.md
2. preserve architecture consistency
3. avoid breaking existing systems
4. maintain design language
5. prefer refinement over redesign
6. run build before finalizing
7. push clean commits
8. avoid introducing fake/demo-only logic

---

# OFFICIAL QUALITY BAR

Every feature added to Clinq should feel:

* intentional
* production-grade
* scalable
* elegant
* useful
* trustworthy
* world-class

The goal is not to build “another dashboard.”
The goal is to build the most intelligent freelancer operating system possible.

## NEW ENGINEERING PRIORITIES (PHASE UPGRADE)

* prioritize production stability over feature expansion
* prefer server-side logic for filtering and search
* ensure mobile-first responsiveness
* maintain strict UI consistency across all inputs and components
* avoid breaking existing working flows
* optimize for real-world usage (not demo scenarios)


🚀 Advanced Product Intelligence & Cost-Aware AI
Lead Quality System (STRICT)
NEVER insert raw scraped leads directly into leads
Always insert into scraped_leads first
Run AI filtering BEFORE promoting to leads
Promotion criteria:
Skill match ≥ 60%
Relevant domain match (from profile + resume)
Clear project intent (not vague/spam)
Auto-delete scraped_leads after 7 days (cron)
AI Cost Optimization Rules (VERY IMPORTANT)
Use high-quality models ONLY for:
Resume parsing
Lead scoring
Proposal generation
Use cheap/light models for:
Short descriptions
Tag classification
UI suggestions
Cache AI responses wherever possible
Never recompute intelligence if data unchanged
Use batching for multiple leads
Resume Intelligence Engine
Accept: PDF, DOCX, TXT
Parse using structured extraction (NOT plain text dump)
Extract:
Skills (primary + secondary)
Experience level
Domains (web, mobile, AI, etc.)
Tools & tech stack
Auto-fill profile fields
Store structured JSON for reuse (avoid reprocessing)
Lead Display Rules (STRICT UI)

Only show:

Title (project name, NOT “Freelancer project id”)
Platform (Freelancer, etc.)
Short AI description (max 2 lines)
AI Score
Budget (ONLY if explicitly present)
Proposal CTA

NEVER:

Show raw IDs
Show unclear budgets
Show noisy metadata
Budget Normalization Engine
Detect:
Fixed vs Hourly
Store:
amount_min
amount_max
currency
type (hourly/fixed)
Convert dynamically based on user setting:
USD, INR, GBP, CAD, EUR
Use real conversion rates (cached)
Search Relevance System
MUST prioritize:
Exact keyword match
Title match > description match
Penalize unrelated leads heavily
Use weighted scoring (not simple LIKE queries)
Interest-Based Learning
If user marks:
❌ Not Interested → reduce similar leads visibility
✅ Interested → boost similar leads
Learn from:
skills
keywords
categories
Proposal Auto-Context Injection

When clicking “Generate Proposal”:

Auto inject:
lead title
description
platform link
budget
NO manual input required
Data Lifecycle Rules
leads → only high-quality, relevant
scraped_leads → temporary
archived_leads → old but useful
deleted_leads → soft delete
UI/UX Standards (Premium)
Minimal, calm, zero clutter
Max 5–6 columns in tables
Clear hierarchy
No harsh contrast bugs (like white-on-white)
Fully responsive (mobile-first)
Smooth transitions only (no flashy animations)
Integrations Expansion (SAFE MODE)
Use APIs only (no illegal scraping)
Platforms priority:
Freelancer
Reddit (API)
GitHub (issues/jobs)
LinkedIn (ONLY if API allowed)

## UI/UX & Theming (Critical)
- Use Tailwind + CSS variables for full theme system (light/dark)
- All components must use semantic tokens:
  - bg-background, text-foreground, border-border, bg-card
- Never hardcode colors (no white/black directly)
- Ensure accessibility contrast (WCAG AA minimum)
- Dropdowns, inputs, popovers must adapt to theme

## Lead Intelligence & Filtering
- Multi-stage pipeline:
  1. Scraped → Raw storage
  2. Filtered → Relevant leads
  3. Ranked → Priority engine
- Use deterministic scoring first, AI only where needed
- Prioritize skill match, budget clarity, recency

## Data Integrity
- Never insert via client into protected tables
- Use service-role server actions only
- Respect RLS policies strictly

## Resume Intelligence
- Parse PDF + DOCX reliably (mammoth + pdf parser)
- Extract:
  - skills
  - experience
  - tech stack
- Merge intelligently without duplicates

## Cost Optimization (AI)
- Use:
  - Cheap models → summaries, filtering
  - Expensive models → proposals, intelligence
- Avoid repeated calls (cache wherever possible)

## Search System
- Weighted ranking:
  - skill match > title match > description
- Avoid fuzzy noise results
- Respect user profile context

## Lead UX
- Show only:
  - title
  - short description (1–2 lines)
  - score
  - budget (if valid)
  - platform
- Avoid clutter

## Integration System
- Store raw API data separately (scraped_leads)
- Promote only relevant leads
- Never flood main leads table

## Theme System
- Use next-themes properly
- Ensure global CSS variables:
  - --background
  - --foreground
  - --card
  - --muted
- Apply across ALL components

## Advanced Data Filtering & Lead Quality
- Build strict ingestion pipelines (raw → processed → promoted)
- Multi-layer filtering: keyword + skill + semantic relevance
- Prevent irrelevant data from entering core tables
- Design “temporary data” systems (auto-cleaned, short-lived)

## Currency & Financial Data Handling
- Normalize all monetary values into a base currency (USD)
- Real-time or cached FX conversion (API-first, no AI usage)
- Support user-level currency preferences
- Accurate parsing of min/max/average budgets

## Secure Backend Architecture (Supabase)
- Enforce strict RLS with service-role-only writes for sensitive tables
- Separate client vs server DB access clearly
- Token vault patterns (never expose tokens to frontend)
- Use RPCs/functions for controlled DB writes

## UI System Design (Theme & Design Tokens)
- Fully token-based theming (no hardcoded colors)
- Dark/light mode parity (not partial overrides)
- Semantic color usage: background, foreground, card, border
- Consistent spacing, typography, and interaction states

## Performance & Cost Optimization (AI)
- Avoid unnecessary LLM calls (use deterministic logic first)
- Use high-end models ONLY for critical intelligence
- Cache computed outputs (profile intelligence, summaries)
- Batch processing for scraping + scoring

## Resume Intelligence (High Accuracy Parsing)
- Multi-format parsing (PDF, DOCX)
- Extract structured fields: skills, experience, roles
- AI-assisted validation (not blind extraction)
- Merge extracted data safely into profile

## Testing & Reliability (Enterprise Level)
- End-to-end testing with Playwright
- Unit testing with Jest
- Test critical flows: auth, integrations, lead import, proposals
- Add retry + fallback for API failures

## UX Excellence (Premium Feel)
- Skeleton loaders instead of spinners
- Micro-interactions (hover, transitions, feedback)
- Clear visual hierarchy (not cluttered dashboards)
- Mobile-first responsiveness with proper touch targets


## UI Refinement & Design Consistency
- Enforce 100% design token usage (no legacy styles)
- Maintain visual hierarchy (spacing, typography, contrast)
- Ensure full theme parity across all components
- Build premium-level UI (Apple-level minimalism)

## Lead Scoring & Filtering Optimization
- Tighten filtering thresholds based on real usage
- Improve relevance scoring beyond basic keyword match
- Prioritize high-conversion leads only

## UX Responsiveness & Interaction
- Instant UI updates on settings change (no reload feel)
- Smooth transitions between states (loading, filtering)
- Clear feedback for every action (connect, import, generate)

## System Observability
- Add logging for integrations and imports
- Track failures (API, parsing, scoring)
- Improve debugging visibility