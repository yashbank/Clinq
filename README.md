<div align="center">

<img src="assets/hero.svg" alt="Clinq" width="100%"/>

![Next.js 15](https://img.shields.io/badge/Next.js%2015-000?logo=nextdotjs&logoColor=white) ![React 19](https://img.shields.io/badge/React%2019-149ECA?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=700&size=22&duration=2600&pause=900&color=22D3EE&center=true&vCenter=true&width=900&lines=Find+leads.+Write+proposals.+Close+clients.;One+premium+workspace+for+your+whole+freelance+business;AI+that+knows+your+profile+and+your+pipeline" alt="typing"/>

[**Live demo**](https://clinq-delta.vercel.app) · [Product brief](BRD.md) · [Design system docs](design_system_docs)

</div>

---

## The idea

Freelancers juggle lead sources, proposal writing, follow-ups and client tracking across a dozen tabs. Clinq puts them in one place: connect your profiles, discover leads, generate tailored AI proposals, track every deal through a pipeline, and let automations handle the follow-ups.

> Status: active development. The long-term goal is to grow from a personal productivity system into a SaaS for freelancers, agencies and teams.

## Modules

```mermaid
flowchart TB
  P[Profile + onboarding] --> L[Lead discovery]
  L --> S[Client scoring]
  S --> R[AI proposals]
  R --> PL[Pipeline]
  PL --> F[Follow-ups]
  F --> A[Analytics]
  I[Integrations] --> L
  AU[Automations] --> F
  style R fill:#a78bfa,color:#000
  style L fill:#22d3ee,color:#000
```

| Module | What it does |
|---|---|
| 🎯 **Leads** | Collect and organize opportunities from your connected platforms |
| ✍️ **Proposals** | OpenAI-powered proposal drafts tailored to the lead and your profile |
| 🧭 **Pipeline** | Kanban-style deal tracking from lead to won |
| ⏰ **Follow-ups** | Never lose a warm lead; reminders and templates |
| ⚙️ **Automations** | Rules that run the repetitive parts of your workflow |
| 🔌 **Integrations** | Connect the platforms you already use |
| 📈 **Analytics** | Charts for conversion, response and revenue trends |

## Stack

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,postgres,vercel,github,figma&perline=9" alt="stack"/>

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres, Auth) · OpenAI · Recharts · Jest · Playwright

## Getting started

```bash
npm install
cp .env.example .env.local   # Supabase + OpenAI keys
npm run dev                  # http://localhost:3000
npm test
```

## Built by

[Yash Bankar](https://github.com/yashbank), at Crestline Technologies, in personal time, with AI agents under human-owned architecture and review.
