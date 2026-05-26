# Fix Hugging Face Space integration

The Space `aahsann-deepfake-detector` runs Gradio 4+, which removed `/run/predict` and `/api/predict`. The current `tryHfSpace` POSTs to those paths, gets 404s, and falls through to the offline mock. That's why you keep seeing offline results.

## What to change

### 1. `src/lib/detectApi.ts` — rewrite `tryHfSpace`

Replace the multi-path POST loop with the Gradio 4 two-step queue flow:

**Step A — enqueue**
- `POST https://aahsann-deepfake-detector.hf.space/gradio_api/call/predict`
- Body: `{ "data": ["data:<mime>;base64,<b64>"] }` — full data URL, not stripped base64. Gradio's Image component silently fails on raw base64 (matches the `event: error, data: {error: null}` we saw).
- Response: `{ "event_id": "<id>" }`.
- On HTTP 503 or body containing `sleep|starting|loading|building` → throw `HfSleepingError`.

**Step B — poll result via SSE**
- `GET https://aahsann-deepfake-detector.hf.space/gradio_api/call/predict/<event_id>`
- Read `res.body.getReader()` with `TextDecoder`, accumulate chunks, parse SSE frames (`event: <name>\ndata: <json>\n\n`).
- On `event: complete` → `JSON.parse(data)` is an array; first element is the model output. Map into `AnalysisResult` (Trust Score → `score`, Verdict → `riskFactors[0].titleEn`), `source: "huggingface"`.
- On `event: error` → if message mentions sleeping/starting, throw `HfSleepingError`; otherwise return `null` to fall through.
- Overall 60 s timeout via `AbortController` linked to the passed-in `signal`.

Keep `HfSleepingError`, the `analyze()` fallback order, and all existing UI mapping unchanged.

### 2. `src/routes/api/analyze-image.ts` — same queue flow on the server

Mirror the same two-step call so the server-side fallback also works against Gradio 4.

## Out of scope

- No UI changes — the existing "AI is analyzing…" spinner and sleeping-Space toast in `src/routes/detect.tsx` already handle both states.
- No changes to `tryPrimary`, `tryHF`, or the mock fallback.

## How to verify

1. Upload an image on `/detect`.
2. Network tab should show `POST /gradio_api/call/predict` (200) then `GET /gradio_api/call/predict/<id>` (200, `text/event-stream`).
3. Result page shows `source: "huggingface"` with the model's Trust Score and Verdict instead of the canned offline numbers.
4. If the Space is asleep, the first POST returns 503 and the UI shows the "model is waking up" message.
