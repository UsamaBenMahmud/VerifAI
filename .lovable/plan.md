## Goal
Wire the upload button on `/detect` to call your Hugging Face Space directly from the browser at `https://aahsann-deepfake-detector.hf.space`, parse Trust Score and Verdict from `data[0]`, and surface a friendly "model is waking up" message when the Space is sleeping.

## Changes

### 1. `src/lib/detectApi.ts` — add a direct HF Space client
Add a new function `tryHfSpace(input)` that:
- Only runs for `kind: "image"`.
- Strips the `data:image/...;base64,` prefix from the base64 string.
- POSTs to `https://aahsann-deepfake-detector.hf.space/run/predict` with body `{ "data": [base64String] }` and `Content-Type: application/json`. If that returns 404, retry against `/api/predict` and `/gradio_api/run/predict` (different Gradio versions expose different paths).
- On HTTP 503, or a response body containing "sleeping" / "is starting" / "loading", throw a typed `HfSleepingError` so the UI can show the wake-up message.
- On success, read `json.data[0]` (Gradio always wraps outputs in a `data` array). The Space may return either a JSON object (`{ trust_score, verdict, ... }`) or a plain string — handle both:
  - object → use `trust_score` and `verdict` directly.
  - string → put the whole string in `verdict`, leave `trust_score` undefined and derive a neutral score.
- Map into the existing `AnalysisResult` shape (`score`, `confidence`, `riskFactors[0].titleEn = verdict`) with `source: "huggingface"` so the existing results UI keeps working.

Update `analyze()` to try `tryHfSpace` FIRST (before the current server / primary / HF inference fallbacks), and let `HfSleepingError` bubble up instead of being swallowed.

### 2. `src/routes/detect.tsx` — sleeping-space UX + clearer spinner
- In `startAnalysis`'s `catch`, detect `HfSleepingError` (by `name` or a flag) and set a dedicated message: "🤖 Model is waking up on Hugging Face — this can take 30–60 seconds. Please try again in a moment." (with Bangla equivalent). Keep current generic message for other errors.
- Replace the analyzing-stage heading with the requested copy: **"AI is analyzing…"** / **"AI বিশ্লেষণ করছে…"**, keeping the existing animated step list and progress bar underneath.
- After results render, the existing Results header already shows the Trust Score gauge and the verdict band — confirm `riskFactors[0].titleEn` (the HF verdict) is visible at the top of the Evidence panel; no structural change needed.

### 3. Leave untouched
- `src/routes/api/analyze-image.ts` (server pipeline) stays in place as a fallback path but is no longer the primary call.
- Video handling still extracts a frame client-side via `extractVideoFrame` and sends it as an image — HF Space only accepts images.

## Technical notes
- Direct browser → HF call means no CORS proxy on our side; HF Spaces send permissive CORS headers, so this works from the browser.
- We keep the existing client-side base64 conversion (`fileToBase64`) — it already runs only in browser event handlers, so SSR is safe.
- No new dependencies, no schema changes, no secrets needed (HF Space is public).
