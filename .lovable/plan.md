## Scope

Upgrade the existing `/detect` page in place. No new routes, no backend tables, no auth changes. All work is in `src/routes/detect.tsx` plus 2–3 small new components and i18n strings.

## 1. Real upload pipeline (replaces idle drop zone)

Three input modes in a tabbed UI: **File / URL / Camera**.

- **File**: `<input type=file>` accepting `image/jpeg,image/png,image/webp,video/mp4,video/avi,video/quicktime`. Validate ≤50MB. Show filename + size + type pill + thumbnail. For video, extract first frame via a hidden `<video>` seeked to 0.1s drawn onto a `<canvas>` → JPEG base64.
- **URL**: text input + Paste button, regex-validated (`^https?://...`). Submitted as `{type:"url", url}`.
- **Camera**: modal using `navigator.mediaDevices.getUserMedia({video:true})`, live `<video>` preview, Capture → canvas → base64, Retake, Use Photo. Stops tracks on close.

Submit calls `POST https://deepfake-api.vercel.app/analyze`; on network failure or non-2xx, fall back to HuggingFace `dima806/deepfake_vs_real_image_detection` with `Authorization: Bearer hf_demo` and the image base64. If both fail, surface error toast but still render mock results so the demo never breaks.

Error map (toast + inline red banner): network, oversize, no-face (from API response), unsupported MIME, 5xx, invalid URL — exact copy from the spec.

## 2. Progress states

Replace the 4-agent ticker with a 6-step sequence keyed off the real fetch promise:
1. 0–15% Uploading media
2. 15–35% Vision Agent — facial regions
3. 35–55% Metadata Agent — EXIF & watermarks
4. 55–80% Context Agent — knowledge graph
5. 80–95% Reasoning Agent — explanation
6. 95–100% Analysis complete

Animated cyan→violet gradient bar, glow on active step, ✓ on completed, live `Xs elapsed` counter (already present, retained).

## 3. Results panel rebuild

Keep `TrustGauge` component. Wrap score in 3 bands (0–30 red, 31–69 amber, 70–100 green) with bilingual labels and `94.2% ± 3.1%` confidence line.

New blocks added below gauge:

- **Sub-scores (4 cards)**: Vision / Metadata / Knowledge Match / Audio Sync — icon, bilingual label, colored progress bar, detail line. Exact copy from spec.
- **Evidence panel (collapsible, open by default)**: 5 risk-factor cards with `[HIGH]/[MED]/[LOW]` severity badges, bilingual descriptions.
- **Face heatmap** (existing SVG kept) + new color legend row + bilingual caption.
- **Spread timeline**: horizontal 4-node SVG/flex timeline (Day 0–3) with colored dots and disclaimer note.
- **Model comparison toggle**: button reveals a 4-row table (EfficientNet-B0 / ResNet-50 / ViT-B/16 / Consensus) with score, speed, confidence, plus red "All 3 models agree" banner (bilingual).
- **Action row**: keep existing 4 buttons, add **Compare Models** and **Newsroom Export (CSV)** (CSV built client-side from the current result and downloaded via Blob URL).
- **About VerifAI** collapsible at bottom with the provided technology / training data / architecture copy.

All Bangla strings added to `src/lib/i18n.tsx` and consumed via `useLang()` so the existing language toggle drives them.

## 4. Technical notes (for engineering)

- All code stays client-side; no server functions, no Supabase changes, no new env vars.
- New tiny components colocated in `src/components/detect/`: `CameraModal.tsx`, `SubScoreCard.tsx`, `EvidenceCard.tsx`, `SpreadTimeline.tsx`, `ModelComparison.tsx`. `detect.tsx` orchestrates.
- HF call body: `{ inputs: <base64> }`; map its `[{label:"Fake"|"Real", score}]` shape into our internal `AnalysisResult` (score 0–100, sub-scores, risk factors). Primary API assumed to return a richer shape; we'll normalize behind one `analyze(input)` helper in `src/lib/detectApi.ts`.
- Mock result object (current hard-coded numbers) becomes the fallback returned by `analyze()` on failure so the rest of the UI is data-driven.
- Camera modal cleans up `MediaStream` tracks on unmount/close to avoid the webcam LED staying on.
- CSV export: `Blob([...], {type:"text/csv"})` + `URL.createObjectURL` + temporary `<a download>`.
- Console errors silenced in production via existing build; only `toast.error` surfaces to user.

## Out of scope

- No changes to other routes, auth, RLS, or `mockData.ts` consumers elsewhere.
- No PDF generator wiring — existing toast stub kept.
- Telegram bot card kept as-is.
