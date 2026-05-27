# Remaining VerifAI Fixes

Picking up the deferred items from the original spec.

## 1. Detect page — 3-tab input system (`src/routes/detect.tsx`)
Replace the single dropzone with a `Tabs` component:
- **Upload** (current dropzone, keep as-is)
- **URL** — text input + "Fetch & Analyze" button, validates http(s) image/video URLs, downloads to blob then runs the same `analyze()` pipeline
- **Live Camera** — `navigator.mediaDevices.getUserMedia`, front/back toggle via `facingMode: 'user' | 'environment'`, capture frame to canvas → blob → analyze

## 2. Comparison Mode (`src/routes/detect.tsx`)
- Toggle button "Compare Two Files" above the input
- When on: render two upload zones side-by-side labeled "Original" / "Suspected"
- Run `analyze()` on both, show results in 2 columns
- Similarity banner on top using a simple perceptual diff (score delta + label: "High similarity / Likely manipulated copy" vs "Different sources")

## 3. Skeleton Loaders
- Add `shimmer` keyframe + `.skeleton` utility class in `src/styles.css`
- Create `src/components/ui/skeleton-card.tsx`
- Use in: detect result panel (while analyzing), watchlist results, scoring history

## 4. LiveStatsBar fix (`src/components/LiveStatsBar.tsx`)
- Verify `useCountUp` runs on mount, uses `requestAnimationFrame` with ease-out-cubic
- If currently broken (stuck at 0), rewrite the hook to interpolate from 0 → target over 2s

## 5. Hide "Made with Lovable" badge
- Call `publish_settings--set_badge_visibility` with `hide_badge: true` (requires user approval popup, requires Pro plan)

## 6. Confirm AI integration is live
- Verify `src/lib/detectApi.ts` `analyze()` actually calls the HuggingFace EfficientNet-B0 endpoint via the existing server function, not mock data
- Confirm "Live AI" badge reflects real API status

## Out of scope (already done in prior turns)
Score calibration, Demo Mode, Watchlist route, Education panel, BuildFest badge refresh — keep as-is.

## Files touched
- `src/routes/detect.tsx` (major rewrite for tabs + compare)
- `src/components/LiveStatsBar.tsx` + `src/hooks/useCountUp.ts` (fix)
- `src/components/ui/skeleton-card.tsx` (new)
- `src/styles.css` (shimmer keyframe)
- `src/lib/detectApi.ts` (verify only, edit if mocked)
- Publish settings (badge toggle)
