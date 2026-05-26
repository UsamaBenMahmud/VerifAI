## Goal
Upgrade the current video deepfake pipeline (`/api/analyze-image` → HF Space) with richer, Claude-style bilingual (EN/BN) explanations and a structured risk-factors array, surfaced in the `/detect` result panel. No image flow, no presentations, no edge functions.

## Backend — `src/routes/api/analyze-image.ts`
1. After parsing the HF verdict (REAL/FAKE %), call **Lovable AI Gateway** (`google/gemini-3-flash-preview`, via `LOVABLE_API_KEY` — already in secrets) using AI SDK `generateText` + `Output.object` with a Zod schema:
   ```
   { explanation_en, explanation_bn, risk_factors: [{severity, label, label_bn, detail, detail_bn}] }
   ```
   Replaces the current ad-hoc text prompt. Prompt mirrors the pasted Claude prompt: never 100% certain, score-band-aware tone, end with action step, BN simple/no jargon.
2. Build `sub_scores`: `{ vision, metadata, context, audio_sync }`. Vision = `100 - fakePct`; metadata/context = sensible defaults (88/72) until those agents exist; audio_sync = null.
3. Persist new fields to `analyses` (already in schema): `explanation_en`, `explanation_bn`, `claude_latency_ms` (reuse as "AI explanation latency"), `hf_latency_ms`.
4. Response JSON adds `risk_factors` and `sub_scores` alongside existing fields. Keep existing shape backward-compatible.
5. If Lovable AI fails (429/402/timeout), fall back to deterministic EN/BN text + a minimal risk-factors array derived from the score band, so analysis still completes.

## Frontend — `src/lib/detectApi.ts` + `src/routes/detect.tsx`
1. Extend `AnalysisResult.riskFactors` to use the server-provided array directly (severity HIGH/MED/LOW/SAFE, EN+BN label & detail) instead of the single-item synthesized one.
2. Wire `sub_scores` into the existing sub-score display (vision uses real value; metadata/context/audio show their values or "—" if null).
3. Render multiple risk factor cards (already partially designed) — color by severity using existing tokens.
4. Keep the existing loading/progress UI and Bangla i18n; just feed real data in.

## Out of scope
- No image upload branch.
- No presentations feature.
- No new edge functions (TanStack server route only).
- No Anthropic/Claude key — using Lovable AI Gateway.

## Technical notes
- AI SDK packages (`ai`, `@ai-sdk/openai-compatible`, `zod`) — add if not already installed.
- Helper `src/lib/ai-gateway.server.ts` for the gateway provider (per TanStack AI knowledge).
- All AI calls happen inside the route handler; `LOVABLE_API_KEY` read via `process.env` server-side only.
