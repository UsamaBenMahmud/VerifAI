# VerifAI — Audit Against BuildFest Criteria

Scoring: ✅ strong · ⚠️ partial · ❌ missing

## 1. Clear problem & user definition — ⚠️ Partial
- **Present:** Hero copy names the problem (deepfakes) and users (journalists, fact-checkers, 60M citizens). BuildFest badge sets context.
- **Gap:** No dedicated "Problem" section quantifying impact (e.g. Bangla misinformation volume, election context, % of viral fakes targeting Bangladesh). Judges scanning the home page see the tagline but no evidence of why this matters *now* in Bangladesh.
- **Fix:** Add a `Problem` band on `/` with 3 stats + 1 short user-story card (journalist, fact-checker, citizen).

## 2. AI-native approach — ⚠️ Partial
- **Present:** Real pipeline in `src/routes/api/analyze-image.ts` — HuggingFace EfficientNet-B2 (6-ch) deepfake detector + Lovable AI Gateway (Gemini 2.5 Flash) for bilingual explanation/risk factors. This is genuinely AI-native (ML model + LLM reasoning layer).
- **Gap:** Nowhere in the UI explains the architecture. Marketing says "multi-agent" but only one model + one LLM call run. No RAG, no graph, no model ensemble despite `modelResults[]` shape implying it.
- **Fix:** Either (a) add a real second signal (metadata EXIF check, reverse-image lookup via web search tool) so "multi-agent" is truthful, or (b) rewrite copy to "ML detector + LLM forensic explainer" and add a "How it works" diagram on `/docs` or `/`.

## 3. Basic system flow (input → AI → output) — ✅ Strong
- Flow is implemented end-to-end: Upload/URL/Camera → Supabase Storage → HF Space (Gradio queue) → Gemini explanation → DB → UI with score, sub-scores, risk factors, bilingual verdict.
- Sub-scores `metadata: 88` and `context: 72` are hardcoded constants — judges who read the code will notice. Either compute them or remove from the UI.

## 4. Initial demo / prototype — ✅ Strong
- Working at `/detect` with 3 input methods (Upload, URL, Live Camera) and Compare mode. Dashboard, History, Watchlist, Scoring routes exist.
- **Gap:** Cold-start UX — HF Space sleeps and returns 503. There is handling (`HfSleepingError`) but no "wake up the model" affordance or pre-loaded demo result for judges who can't wait 30s.
- **Fix:** Add a "Try sample video" button on `/detect` that runs against a pre-cached analysis row so the demo never depends on HF cold start.

## 5. Bangla / localization — ⚠️ Partial
- **Present:** `i18n.tsx` with en/bn toggle, `font-bangla` class, hero subtitle in Bangla, marquee Bangla string, verdict_bn + explanation_bn returned by API.
- **Gap:** `t()` is barely used — most page copy is English-only. Toggling language likely changes very little. Bangla is decorative rather than functional.
- **Fix:** Audit `/`, `/detect`, `/dashboard` for hardcoded English strings and route them through `t()`. Verify Bangla rendering for at least the home + detect pages.

## 6. Defined potential impact (KPIs) — ❌ Missing
- LiveStatsBar shows running counters ("47 deepfakes detected today") but these are mock/local-store values, not real KPIs tied to outcomes.
- No stated success metrics: detection accuracy %, time-to-verdict, # journalists onboarded target, election misinformation prevented, etc.
- **Fix:** Add an "Impact & KPIs" section (home or `/docs`) with: model accuracy on FaceForensics++/Celeb-DF benchmarks, target latency (<6s), target reach (Year-1: 1000 journalists, 50k citizens), and what success looks like.

## Recommended fix order (lowest effort → highest judge impact)
1. **Problem + Impact bands on home page** — addresses criteria #1 and #6 in one edit (~30 min).
2. **"Try sample video" button on /detect** — removes the cold-start demo risk (~20 min).
3. **Truthful "How it works" diagram** — 3 nodes (HF detector → Gemini explainer → bilingual verdict) on `/` or `/docs` (~20 min).
4. **Bangla i18n pass** — route home + detect copy through `t()` (~45 min).
5. **Replace hardcoded sub-scores or remove from UI** — code honesty (~15 min).
6. **(Stretch) Add a real second signal** — EXIF metadata check or web reverse-search so "multi-agent" is real (~1–2 hr).

## Out of scope for this audit
Visual polish, additional routes, auth flows, payments, watchlist deepening — those exist and aren't blockers for the 6 criteria.

Approve this plan and I'll implement items 1–5 in build mode. Item 6 (real second signal) I'll ask before starting since it changes backend behavior.
