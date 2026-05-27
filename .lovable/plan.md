## Scope

Layer the requested fixes and new features on top of the existing VerifAI app without rebuilding anything. All client-side state uses localStorage (per spec). Existing styles, design tokens, and Supabase wiring stay intact.

## Build order

### 1. Admin Panel fixes (`src/routes/admin.tsx`)
- **PPTX/PDF upload**: new `PresentationUploader` component — dropzone (.pptx/.pdf, 100MB), base64→`verifai_presentation`, meta→`verifai_presentation_meta`, slide count→`verifai_slide_count`, clear button, current-file card.
- **API Keys tab**: replace with full generator (vfai_ + 32-hex via `crypto.getRandomValues`), plan dropdown (free/journalist/enterprise), success modal with one-time reveal, table (mask/reveal/copy/disable/delete/simulate-request), stats cards, rate-limit progress bars, code-examples tabs (cURL/Python/JS/Bangla). Stored in `verifai_api_keys`.

### 2. Public `/docs` Presentation tab
- Read `verifai_presentation`; render PDF in iframe via blob URL, or show PPTX info card. Render slide-number cards (cycling gradients), click-to-scroll + highlight, Download Original button.

### 3. n8n Workflow Showcase (`/docs`)
- New section with 3 CSS-flow diagrams (Daily Intake, Citizen Report Alert, Journalist Watchlist) + Download n8n JSON buttons (valid n8n shape) + GitHub link.

### 4. Scoring page links (`src/routes/scoring.tsx`)
- Replace 7 link inputs: per-field validate + Save button + status badge + Open + favicon. Persist to `verifai_submission_links`. Auto-compute points (yt 10, gh 2, demo 5, figma 1, hf 1, api 1, n8n 1), live-update total. Add "Copy All Links" formatter.

### 5. New page `/submit-rumor` (`src/routes/submit-rumor.tsx`)
- Guest-accessible form: URL or file upload (50MB), category radios, platform multi-select pills, description (500 char counter), urgency toggle, optional collapsible reporter info. Save to `verifai_rumor_reports`, attempt analyze call, success screen with `VFR-######` ID + Analyze Instantly (→ `/detect?url=...`) + Submit Another. Community stats bar.

### 6. Enhanced Detect result panel (`src/routes/detect.tsx`)
- Seeded-random sub-scores (Vision/Metadata/Context/Consensus) derived from `trust_score`.
- Dynamic risk factors by band (<30 / 30–70 / >70).
- "What should I do?" action cards (band-specific, BN+EN).
- Share-as-Image button (html2canvas, dl `verifai-result-<id>.png`).
- "Your Analysis History" mini strip from `verifai_history` (last 5).
- URL pre-fill from `?url=` param and `verifai_pending_url`.
- Raise upload limit 50→200MB in detect UI (`ACCEPT`/`MAX_BYTES` in `src/lib/detectApi.ts`).

### 7. New page `/history` (`src/routes/history.tsx`)
- Guest+user, reads `verifai_history` (cap 50). Filter pills, date range, search. Stats row, grid cards, empty state, view-report link.

### 8. Batch URL Checker (Newsroom mode) in `/detect`
- Top toggle Single ↔ Batch. Textarea (max 10 URLs), per-URL queue with live status, summary card, Export CSV + Export PDF (PDF via simple jsPDF or window.print fallback — TBD smallest dep), API-key upsell note.

### 9. Landing page Live Stats (`src/routes/index.tsx`)
- 3 animated counter cards seeded from `verifai_live_stats` (BASE_ANALYSES 1247 / DEEPFAKES 451 / CITIZENS 3891) with realistic per-load increments. 🔴 LIVE dot. Marquee ticker below from history + seed.

### 10. Navbar updates (`src/components/nav/Navbar.tsx`)
- Insert 🚨 Report Rumor (red accent, pulsing dot, tooltip) between Dashboard and Laws.
- History link conditional on localStorage history or auth.
- User dropdown: avatar w/ initial, My History, My Analyses count, Settings stub, Logout. Admin variant adds Admin Panel link + session timer (reuse `AdminSessionTimer`) + red lock.
- Hamburger menu auto-closes on link click.

### 11. Footer (`src/components/nav/Footer.tsx`)
- 4-column rewrite per spec (Brand / Product / Legal & Help / Tech Stack), social links from `verifai_submission_links`, bottom bar with version + track.

### 12. Demo Day banner
- New `DemoBanner.tsx` at `__root.tsx` top, dismissible with `verifai_demo_banner_dismissed`, auto-hide 10s on mobile.

### 13. Global polish
- **Toasts**: already have sonner — standardize success/error/info usage in new flows.
- **Skeletons**: add `Skeleton` to public dashboard table, history grid, admin analyses table.
- **Empty states**: shared `<EmptyState />` component, apply to analyses/keys/reports/history.
- **Error boundary**: lightweight `<SectionBoundary>` wrapper with retry around major sections.
- **404 page**: customize `notFoundComponent` on `__root.tsx`.
- **Page titles**: ensure each route has `head()` with title + description per spec.
- **Keyboard shortcuts**: global listener + `?` modal + corner button.
- **Hind Siliguri preload**: add `<link rel="preload">` in `__root.tsx` head.

### 14. Mobile audit
- Detect upload zone min-h 160px, camera-first on mobile.
- Result sub-score cards: `grid-cols-2 md:grid-cols-4`.
- Admin sidebar → bottom tab bar (5 icons) on mobile.
- Tables `overflow-x-auto`.
- Trust gauge 120px on mobile.

## Technical notes

- **No backend/schema changes**: all new state in localStorage, per spec. Existing Supabase auth/admin/profiles untouched.
- **New deps**: `html2canvas` (share-as-image), `jspdf` (batch PDF export). Add via `bun add`.
- **Routes added**: `src/routes/submit-rumor.tsx`, `src/routes/history.tsx`. TanStack file-based routing — `routeTree.gen.ts` regenerates automatically; do not hand-edit.
- **`src/lib/detectApi.ts`**: bump `MAX_BYTES` to `200 * 1024 * 1024`.
- **Admin tabs on mobile**: bottom tab bar shows 5 icon tabs; remaining tabs accessible via overflow menu.
- **Seeded random** for sub-scores: small mulberry32 PRNG keyed by analysis id so values are stable on re-render.
- **n8n JSON downloads**: minimal valid n8n export shape (`{name, nodes:[…], connections:{…}, active:false, settings:{}}`) generated client-side.

## Out of scope

- No new tables, RLS, or edge functions.
- No changes to HF Space integration beyond raising the client-side size cap.
- No real cyber-police / platform reporting integrations — action cards are mailto/links only.

## Confirm before I build

1. **Batch PDF export** — OK to add `jspdf` (~50KB) or prefer `window.print()` of a printable view?
2. **Share-as-Image** — confirm `html2canvas` is acceptable (~45KB).
3. **API key storage** — spec says localStorage only, no DB. Confirm (keys won't persist across devices/browsers).
4. **Live stats** — purely simulated counters per spec, not real DB metrics. Confirm.
