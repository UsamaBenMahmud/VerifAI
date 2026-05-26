# VerifAI Backend — Adapted to Lovable Cloud + TanStack Start

Your project runs on **Lovable Cloud (managed Supabase)** and **TanStack Start**, not raw Supabase CLI + Deno Edge Functions. I'll deliver the same end-to-end pipeline — Storage upload → HF model → LLM Bangla explanation → DB save — but adapted to this stack. No `.env.local`, no `supabase init`, no `supabase functions deploy` needed.

## What changes vs. your guide


| Your guide                           | Lovable Cloud equivalent                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.local` with keys               | Secrets via `add_secret` tool (HF_MODEL_URL, ANTHROPIC_API_KEY)                                                                             |
| SQL Editor → run schema              | `supabase--migration` tool (auto-applied)                                                                                                   |
| Create `uploads` bucket in dashboard | Migration creates bucket + RLS policies                                                                                                     |
| Deno Edge Function `analyze-image`   | TanStack server route `/api/analyze-image` (`createFileRoute`)                                                                              |
| `supabase functions deploy`          | Auto-deployed with the app                                                                                                                  |
| `Deno.env.get(...)`                  | `process.env.*` inside the route handler                                                                                                    |
| Claude API direct                    | **Option A**: Lovable AI Gateway (Gemini/GPT, no key needed) — recommended. **Option B**: Anthropic Claude (you supply `ANTHROPIC_API_KEY`) |


## Database schema (migration)

Creates `analyses` table with all your columns, indexes, RLS:

- `INSERT` allowed for everyone (anonymous uploads)
- `SELECT` only own rows OR anonymous rows (`user_id IS NULL`)
- `public_analyses` view (last 30 days, no PII) granted to `anon`/`authenticated`
- `uploads` storage bucket (private) + policies for public insert and signed-URL reads

## Backend endpoint

`**src/routes/api/analyze-image.ts**` — TanStack server route, POST multipart/form-data:

1. Validate file (image/*, ≤10MB)
2. Upload to `uploads` bucket via `supabaseAdmin`
3. Create 24h signed URL
4. Call HF Gradio endpoint (`${HF_MODEL_URL}/run/predict`) with base64 data URL
5. Call LLM for bilingual explanation → `{ en, bn }`
6. Insert row into `analyses`, return the saved record
7. Returns JSON; CORS headers included

Path `/api/analyze-image` (NOT under `/api/public/` since this is called by your own frontend on the same origin).

## Secrets needed

- `HF_MODEL_URL` — your HF Space URL (required)
- `ANTHROPIC_API_KEY` — only if you pick Option B

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already provisioned.

## Frontend wiring

Your existing `/detect` page calls `fetch('/api/analyze-image', { method: 'POST', body: formData })`. I'll update `src/lib/detectApi.ts` to hit this endpoint and shape the response for the existing UI (no UI redesign).

## One decision needed from you

**Which LLM for Bangla explanations?**

- **A) Lovable AI Gateway (Gemini 2.5 Flash)** — free during promo, no API key, faster setup. Recommended.
- **B) Anthropic Claude 3.5 Sonnet** — matches your guide exactly, requires you to paste `ANTHROPIC_API_KEY`.

Reply with **A** or **B** (and confirm your HF Space URL) and I'll switch to build mode and ship it.