# VerifAI Targeted Fixes — Implementation Plan

Scope: surgical edits only. Keep navbar, footer, routes, styling tokens. No rewrite from scratch.

## 1. Detect page rewrite (`src/routes/detect.tsx`)
Replace page body (keep nav/footer) with:
- Header: "Analyze Content" + Bangla subtitle + "Powered by EfficientNet-B0 + Claude 3.5" badge.
- 3 pill tabs: Upload File (default) | Paste URL | Live Camera. On mobile (`md:` breakpoint), reorder to Camera first.
- **Upload tab**: dropzone (image+video, 50MB), thumbnail preview, file meta, remove btn.
- **URL tab**: input + Analyze button, supports FB/YouTube/X/direct.
- **Camera tab**: reuse `CameraModal` logic inline; `facingMode: 'user'` default, Flip button toggles `user`/`environment`, 1280x720.
- Privacy note (bilingual).
- Sticky "Analyze Now" CTA, disabled until input present.
- **Loading state**: full-screen overlay with pulsing cyan logo, 4 sequential agent steps (Vision → Metadata → Context → Reasoning), progress bar, elapsed timer (100ms tick), thumbnail.
- **Result panel**:
  - Trust score SVG gauge (animated stroke-dasharray, color by band).
  - Verdict + confidence (`min(score>50?score:100-score,95)`, margin `max(3,floor((100-conf)/8))`).
  - Face heatmap card: CSS overlay on uploaded image (red/amber/green by band) + legend.
  - Sub-scores card: 4 rows (Vision, Metadata, Context bars + Model Consensus text) using `seededRandom(id,n)` helper.
  - Bangla + English explanation cards (cyan / violet left borders, fallback text per band).
  - Risk Factors collapsible (open by default), severity badges, dynamic per band.
  - "What should you do?" cards per band.
  - Action bar: Download PDF (blob), Copy Link, Share Card (html2canvas), Report, Analyze Another.

## 2. Comparison mode (same page, below upload)
Toggle ON → two dropzones (Original / Suspected) + Compare button → two result cards side-by-side + similarity banner (diff>30 red, <15 green).

## 3. Demo mode (same page, floating btn bottom-right)
Modal with 3 hardcoded cards (Deepfake=12, Uncertain=47, Authentic=82). Click → skip API, run loading animation, render result with hardcoded score feeding existing render logic.

## 4. Live stats counter (`src/components/brand/LiveStatsBar.tsx`)
Read/seed `localStorage.verifai_stats` (1247/451/3891), bump on mount, animate 0→value over 2s with rAF + ease-out-cubic, format with `toLocaleString()`.

## 5. Score calibration (in `detectApi.ts` or detect result handler)
Add `calibrateScore(raw, fakeProb)` per spec; apply before setting state. Show tiny muted line: `Raw: X/100 · Calibrated: Y/100`.

## 6. Education panel (`src/routes/index.tsx`)
Add section below "Who It's For": 3 cards (How made / Who's at risk / How VerifAI detects) bilingual + stats highlight bar.

## 7. Competition badge (landing hero)
Replace existing BuildFest badge with gradient pill spec; trophy rotates 5° on hover. Add "Live AI" pulsing dot badge to detect upload card.

## 8. Watchlist (`src/routes/watchlist.tsx` new)
Add route + UserMenu link. Keyword input → localStorage `verifai_watchlist`, tag pills, notification settings (radio + frequency), recent matches from existing mock feed filtered by keywords, empty state.

## 9. Scoring page auto-save (`src/routes/scoring.tsx`)
Each link input: validate on keystroke, debounced save to localStorage, ✅/❌ icon, "Saved [time]" label, live total recompute, prefill on mount.

## 10. Bilingual error toasts
Helper `bilingualError(key)` returning `{en,bn}`. Apply in detect for: network, file-too-large, no-face, server-busy (503/HfSleepingError). Show as sonner toast + inline below CTA.

## 11. Skeleton loaders
Add `shimmer` keyframe to `src/styles.css`; create `Shimmer` variant of `Skeleton`. Apply to dashboard table (5 rows), history grid (6 cards), admin tables (8 rows), detect result (during analysis fallback).

## 12. Remove "Made with Lovable"
Disable Lovable badge via `publish_settings--set_badge_visibility` (hidden).

## 13. AI integration sanity check
Verify `/api/analyze-image` still proxies to HF correctly and returns `trust_score`, `fake_probability`, `explanation_en/bn`. No backend rewrite — only ensure frontend uses calibrated value + bilingual fallback.

## Technical notes
- New deps: `html2canvas` (share card), `jspdf` (or simple Blob+text for PDF). Confirm via `bun add`.
- `seededRandom` lives in a small util `src/lib/seededRandom.ts`.
- Demo images: small inline SVG/placeholder assets in `src/assets/demo/` to avoid CORS.
- All colors via existing tokens (`--cyan`, `--violet`, `--danger`, etc.); add `--shimmer-*` if needed.
- Route added to file-based router — let plugin regenerate `routeTree.gen.ts`.

## Out of scope
- No DB schema changes.
- No auth flow changes.
- No HF model retraining (calibration is frontend-only).

Ready to switch to build mode?
