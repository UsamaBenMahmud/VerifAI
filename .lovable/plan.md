# VerifAI — Build Plan

A Bangla-first deepfake detection web app. Dark cyberpunk-forensics aesthetic, fully responsive, frontend-first with realistic mock data. Backend (Lovable Cloud) wired only for auth and analyses persistence.

## Scope for this build

Frontend-complete MVP across all 9 routes with mock data, plus auth via Lovable Cloud. Real AI pipeline, Neo4j, R2, Telegram bot, and edge functions are documented in `/docs` but not implemented — they are Phase 2+.

## Design system

- Tailwind v4 tokens in `src/styles.css` mapped to the brand palette (bg-deep, bg-surface, bg-card, accent-cyan, accent-violet, danger, safe, warning, text-primary, text-muted, border).
- Dark-mode only (force `.dark` on `<html>`).
- Google Fonts loaded in `__root.tsx` head: Syne, DM Sans, Hind Siliguri, JetBrains Mono.
- Glassmorphism utility classes, cyan glow button variant, animated grid background, pulsing dot, scanning reticle.
- i18n: lightweight context + localStorage (`lang: 'en' | 'bn'`), no library.

## Routes (TanStack file-based)

```
src/routes/
  __root.tsx          shell, fonts, nav, language provider
  index.tsx           Landing
  detect.tsx          Upload + mocked 4-agent analysis + results
  dashboard.tsx       Live threat intel + charts
  admin.tsx           Sidebar layout (overview default)
  admin.$tab.tsx      Admin tabs (analyses, users, agents, ...)
  docs.tsx            Tabbed technical documentation
  laws.tsx            Country tabs
  help.tsx            Steps, hotlines, FAQ
  login.tsx
  signup.tsx
```

## Components

- `components/nav/Navbar.tsx`, `Footer.tsx`, `LanguageToggle.tsx`
- `components/ui-ext/GlassCard.tsx`, `GlowButton.tsx`, `PulseDot.tsx`, `ScanReticle.tsx`, `GridBackground.tsx`, `Marquee.tsx`
- `components/detect/UploadZone.tsx`, `AgentProgress.tsx`, `TrustGauge.tsx`, `FaceHeatmap.tsx`, `AgentTransparency.tsx`, `ExplanationCard.tsx`, `SourceGraph.tsx` (SVG mock), `SimilarCases.tsx`, `TrustBadgeEmbed.tsx`
- `components/dashboard/StatsBar.tsx`, `TrendingTable.tsx`, `CategoryCards.tsx`, charts via Recharts
- `components/admin/AdminSidebar.tsx`, KPI cards, tables
- `components/docs/*` one component per tab (PRD, Architecture, Database, APIs, DataFlow, Auth, EdgeFunctions, Routes, TechStack, Roadmap, Presentation)
- `lib/i18n.tsx` provider + `t()` helper
- `lib/mockData.ts` Bangladeshi-context dummy datasets (analyses, sources, trending, KPIs)

## Backend (Lovable Cloud)

Enabled for auth only in this phase.

- Email/password + Google sign-in on `/login` and `/signup`.
- `signup.tsx` includes role dropdown (citizen/journalist/researcher/organization) stored in `profiles` table.
- Tables: `profiles` (id → auth.users, role, created_at) with RLS (user can read/update own). Trigger to auto-create on signup.
- No analysis persistence yet — Detect page uses local state + mock timings.

## Technical details

- Charts: Recharts (line, stacked bar, area).
- Graph visualizations: hand-crafted SVG (no D3 dependency) for performance and to avoid SSR issues.
- Tables: shadcn `table` + client-side filter/sort/pagination on mock arrays.
- Toasts: sonner (already in template).
- All "Download PDF / Copy link / Report" buttons trigger toast feedback.
- Mobile nav: shadcn `sheet` hamburger.
- Console logs stripped via Vite `esbuild.drop` in production config.
- SEO: per-route `head()` with unique title/description/og tags.

## Out of scope (documented only in /docs)

- Real ML agents, Neo4j, R2, Firecrawl, n8n, Telegram bot, PDF generation, embeddings, edge functions, API key system, watchlists.

## Build order

1. Enable Lovable Cloud, configure Google auth.
2. Design tokens, fonts, global styles, providers (i18n, theme).
3. Navbar + Footer + route shells.
4. Landing page.
5. Detect page (upload → animated mock analysis → results).
6. Dashboard.
7. Docs (all 10 tabs).
8. Admin (sidebar + overview + tab stubs with realistic tables).
9. Laws, Help.
10. Login / Signup wired to Cloud.
11. Mobile pass + polish (glow, hover, skeletons).
  Full stack Website All function for a global brand .I want to showcase for it for a hackathone
12. &nbsp;