
# VerifAI Targeted Additions — Build Plan

Four scoped additions on top of the existing app. No rebuilds. Pure frontend + one small DB table for submission links.

---

## Part 1 — `/scoring` Hackathon Scorecard Page

**New route:** `src/routes/scoring.tsx` + helper data file `src/lib/scoringData.ts`.

**Layout**
- Header: title, subtitle, badge row (Team / Track 5 / Max 175), animated counter `147/175`, cyan gradient progress bar (84%).
- Two-column grid (`lg:grid-cols-[1fr_320px]`): left = accordion sections, right = sticky `Live Score Tracker` card with per-section subtotals, total, grade badge.

**Left accordion** (shadcn `Accordion` already available):
1. **Data Stack (40)** — Neo4j, pgvector, DuckDB, 4 scrapers, 4 parsers — each with detail card, code snippets, status badges.
2. **AI Detail (68)** — 4 LLM cards, tabbed prompt strategy (system / user / Bangla / few-shot) with syntax-highlighted code blocks, token optimization bullets, 5 RAG technique cards with bonus badges, combo-bonus callout, frontend AI tools (5), workflow tools (4) + n8n diagram, local runtimes (3), local models (4).
3. **Links (21)** — 5 link cards reading saved URLs from DB (read-only here; edited in admin). Show ✅/⏳ based on presence; YouTube card auto-renders thumbnail from URL.
4. **Build Provenance (7)** — IDE table, MCP servers table, 3 prompt cards each with **Copy Prompt** button (writes to clipboard + toast).

**Bonus Summary** card at bottom listing the 6 bonus items (+20 total).

**Animated counter:** small `useCountUp` hook (requestAnimationFrame, 1.2s ease-out). No new deps.

Add `{ to: "/scoring", label: "Scoring" }` to navbar links between Docs and Admin.

---

## Part 2 — `/login` Rebuild (User + Admin tabs)

Replace `src/routes/login.tsx` entirely. Keep existing Supabase auth calls and Google OAuth helper that's already wired.

**Route search param:** `validateSearch` → `{ mode?: "user" | "admin" }`. `/login?mode=admin` pre-selects Admin tab.

**Outer:** existing `GridBackground` + floating cyan/violet orbs; single `max-w-md` glass card centered.

**Top tab pills** (User / Admin) with animated cyan underline (CSS transform, no library).

### User tab
Sub-tabs `Sign In | Create Account` (text-link style).

- **Sign In:** email, password (eye toggle), forgot-password link → `/forgot-password`, primary Sign In button, divider, Google OAuth ghost button, footer link to Create Account.
- **Create Account:** full name, email, password + strength meter (regex-based weak/fair/strong), confirm-password with ✓ on match, role `<select>` (Citizen / Journalist / Researcher / Org / Law Enforcement), 2 checkboxes (ToS, newsletter), primary Create button.

After success: `toast.success("Welcome back! Ready to detect deepfakes.")`, navigate `/detect`.

### Admin tab
Visual change: card border switches to `--danger` glow, orbs swap to red pulse (CSS class toggle).

- Red "🔒 RESTRICTED ACCESS" banner (EN + BN).
- Admin email, password (eye toggle), **2FA code** input (6 digits, auto-space after 3, demo accepts `000000`).
- Red Sign In button. No signup, no Google.
- Footer muted text (invitation-only / contact / audited).

Auth flow: Supabase `signInWithPassword` → check `profiles.role === 'admin'` → require 2FA code `000000` in demo. On success: toast "Admin session started. All actions are logged.", navigate `/admin`, set `sessionStorage.adminSessionStart = Date.now()` (used by navbar timer).

### Supporting routes
- **`/forgot-password`** new route: email input, `supabase.auth.resetPasswordForEmail` with redirect to `/reset-password`. Bangla heading.
- **`/reset-password`** new route: detects recovery hash, new password input, `supabase.auth.updateUser({ password })`.

---

## Part 3 — Navbar Update

Edit `src/components/nav/Navbar.tsx`:

- Insert `Scoring` link between Docs and Admin.
- Replace simple Login/Logout button with auth-state-aware right cluster:
  - **Logged out:** `[Login]` ghost + `[Try Free →]` cyan (both link to /login, second with `?mode=signup` hint).
  - **User logged in:** circular avatar with initial → dropdown (Profile / My Analyses / Logout). Use shadcn `DropdownMenu`.
  - **Admin logged in:** red `🔐 Admin` badge + avatar dropdown (Admin Panel / Session Log / Logout) + live `Session: MM:SS` countdown from `sessionStorage.adminSessionStart` (30-minute window, turns red <5min, auto-logout at 0).
- Mobile menu mirrors all links + auth state.

Role detection: fetch `profiles.role` once on session change, cached in component state.

---

## Part 4 — Admin Panel: Submission Links Manager

**DB migration** — new table `submission_links`:
- Columns: `key` (text, PK — one of `youtube|github|demo|figma|huggingface|api_docs|n8n`), `url` (text, nullable), `updated_at`.
- RLS: anyone authenticated can `SELECT` (so `/scoring` reads it); only `profiles.role = 'admin'` can `INSERT`/`UPDATE` via `has_role()`-style check.
- Seed 7 empty rows.

**Admin sidebar:** add `{ id: "links", label: "Submission Links", icon: Link2 }` to `sideLinks` in `src/routes/admin.tsx`.

**New `LinksTab` component:** 7 fields, each with:
- Input + per-field `[Save]` button.
- URL validation (regex per type: youtube.com|youtu.be, github.com, https://, figma.com).
- Status pill: ✅ Saved / ⏳ Pending / ❌ Invalid.
- Live preview: YouTube → `img.youtube.com/vi/{id}/hqdefault.jpg`; others → favicon via `https://www.google.com/s2/favicons?domain=...`.
- Bottom `[Save All Links]` primary button → batch upsert → toast "Links saved and published to scoring page".

`/scoring` Links section reads the same table so admin edits appear live.

---

## Technical Section

**Files created**
- `src/routes/scoring.tsx`
- `src/routes/forgot-password.tsx`
- `src/routes/reset-password.tsx`
- `src/lib/scoringData.ts` (all card content as typed arrays)
- `src/lib/useCountUp.ts`
- `src/lib/submissionLinks.ts` (fetch + upsert helpers)
- `src/components/scoring/*` (AccordionSection, ScoreCard, RagCard, PromptTabs, CopyPromptButton, BonusSummary)
- `src/components/auth/UserTab.tsx`, `AdminTab.tsx`, `PasswordStrength.tsx`
- `src/components/nav/UserMenu.tsx`, `AdminSessionTimer.tsx`

**Files edited**
- `src/routes/login.tsx` (full rewrite, same path)
- `src/routes/admin.tsx` (add Links tab + LinksTab component inline)
- `src/components/nav/Navbar.tsx` (links + auth state UI)

**DB migration**
```sql
CREATE TABLE public.submission_links (
  key text PRIMARY KEY,
  url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.submission_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.submission_links FOR SELECT USING (true);
CREATE POLICY "admin write" ON public.submission_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
INSERT INTO public.submission_links(key) VALUES
  ('youtube'),('github'),('demo'),('figma'),
  ('huggingface'),('api_docs'),('n8n');
```

**No new npm dependencies.** Uses existing shadcn `Accordion`, `Tabs`, `DropdownMenu`, `Select`, `Input`, `Button`, `Checkbox`, sonner toast, lucide icons, recharts (already in admin).

**Design tokens:** all colors via existing `--cyan`, `--violet`, `--danger`, `--bg-deep`, `glass`, `glass-strong` utilities — no raw hex.

**Out of scope:** real 2FA (demo accepts `000000`), real Neo4j/DuckDB integration (scoring page is presentational content describing the stack).
