# Make HF Space integration actually work (video)

## What changes

**Input switches from image to video.** The HF Space at `https://aahsann-deepfake-detector.hf.space` is a video deepfake detector (EfficientNet-B2, 6-channel, 8 frames). Sending images was the root cause of all `{"error": null}` failures — Gradio's video input silently rejects non-video data.

## Scope

1. **`src/routes/detect.tsx`** — change uploader to accept `video/mp4, video/quicktime, video/webm` only (drop image preview, drop camera modal trigger for now). Max 50MB. Update copy: "Upload a video" / "ভিডিও আপলোড করুন".
2. **`src/lib/detectApi.ts`** — rewrite client path:
   - Send `FormData` with the video `File` to `/api/analyze-image` (rename later if needed; keep route for now).
   - Drop the direct browser→HF fallback (`tryHfSpace`) — videos are too big to base64 in the browser and the queue flow needs a real file upload. All HF traffic goes through our server.
   - Drop mock/offline fallback. If server returns 500, surface the real error to the UI.
3. **`src/routes/api/analyze-image.ts`** — rewrite for Gradio 4 video flow:
   - Accept `video/*` (≤50MB) instead of `image/*`.
   - Upload to Supabase Storage `uploads` bucket (existing).
   - **HF call, 3 steps:**
     1. `POST {space}/gradio_api/upload` (multipart, field `files`) → returns `["/tmp/gradio/<hash>/<filename>"]`.
     2. `POST {space}/gradio_api/call/predict` with body `{"data":[{"path":"<path-from-step-1>","meta":{"_type":"gradio.FileData"}}]}` → returns `{"event_id":"..."}`.
     3. `GET {space}/gradio_api/call/predict/<event_id>` (SSE) → read with `body.getReader()` + `TextDecoder`, accumulate until blank-line frame; on `event: complete`, `JSON.parse(data)[0]` is the verdict **string** (e.g. `"FAKE (87.2%) ⚠️"` or `"REAL (92.1%) ✅"`).
   - 60s `AbortController` timeout. On 503 / "sleeping" / "starting" responses → 503 to client with `{ error: "Model is waking up, try again in ~30s" }`.
   - **Parse the verdict string** with a single regex `/^(REAL|FAKE).*?(\d+(?:\.\d+)?)/i` → `{ label, percent }`. Derive:
     - `fake_probability` = `label === "FAKE" ? percent/100 : 1 - percent/100`
     - `real_probability` = `1 - fake_probability`
     - `trust_score` = `Math.round(real_probability * 100)`
     - `confidence` = `Math.round(Math.max(percent, 100 - percent))`
     - `verdict` = `label === "FAKE" ? "Likely Deepfake" : "Likely Authentic"`
     - `verdict_bn` = Bangla equivalent
     - `model_version` = `"efficientnet-b2-6ch-v1"`
4. **Lovable AI explanation + DB save** — unchanged. The bilingual prompt already accepts the structured `ModelResult`.
5. **DB column rename consideration** — keep the existing `analyses.image_url` column; just store the video's signed URL there (no migration needed; column name is cosmetic). Result page already reads `image_url` — update the result page to render a `<video controls>` when the URL ends in a video extension.
6. **Result page (`src/routes/detect.tsx` result section)** — render `<video src={image_url} controls className="..."/>` when MIME/extension is video; otherwise current `<img>`. Everything else (RiskMeter, verdict card, explanation) already works off the structured fields.

## Out of scope

- Camera capture (videos from webcam) — can add later.
- Renaming the `/api/analyze-image` route and `analyses.image_url` column — cosmetic; defer.
- Building the separate `backend/` (FastAPI/Railway) and `frontend/` (Vite/Vercel) projects from your folder tree — your site already runs on Lovable+TanStack and uses the same HF Space, so duplicating into a Python/FastAPI repo would throw away what works. If you specifically want the Railway+Vercel split, that's a separate, much larger effort — say the word and I'll plan it.

## Verification

1. Upload a small `.mp4` on `/detect`.
2. Network panel: one POST to `/api/analyze-image` (multipart). Server-side: one POST to `/gradio_api/upload`, one POST to `/gradio_api/call/predict`, one GET SSE to `/gradio_api/call/predict/<id>`.
3. Result page shows real Trust Score derived from the HF verdict, bilingual explanation, video preview, and the row appears in `analyses`.
4. If HF Space is asleep: UI shows "Model is waking up, try again in ~30s" instead of a blank screen.
