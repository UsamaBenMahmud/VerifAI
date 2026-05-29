# Plan: Functional Actions + Honest Scores + Slide Deck Viewer

## 1. Sub-scores — only real HF data (Image 2)

Your HF Space returns: `fake_probability`, `real_probability`, `trust_score`, `confidence`. Everything else (Metadata 88, Context 72, Audio 0) is hardcoded and misleading.

**Fix in `src/lib/detectApi.ts` + `src/routes/detect.tsx`:**
- Keep **2 real cards**:
  - **Facial Artifact Score** = `100 - fake_probability*100` (real, from HF)
  - **Model Confidence** = `confidence` from HF (real)
- Replace Metadata / Context / Audio cards with a single **"Roadmap signals"** card listing what's coming (greyed, no fake number) — or remove entirely. Pick one in build.
- Risk factors: drop the two hardcoded "Borderline / Moderate confidence" entries when HF returns no `risk_factors[]`. Show only what HF actually returned, plus the bilingual verdict.

Result: every number on screen traces back to a HF field. Judges can't catch you inventing data.

## 2. Action buttons — make all 7 work (Image 1)

| Button | Implementation |
|---|---|
| Download PDF Report | `jspdf` — generate a real multi-page PDF from the current `AnalysisResult` (cover, verdict, score gauge, evidence list, methodology). Client-side, no server call. |
| Share as Image | `html2canvas` on the result card → PNG → `<a download>`. |
| Copy Link | Each analysis gets a permalink `/?a=<analysis.id>`. Detect page reads `?a=` and rehydrates from DB. Button copies the URL. |
| Report | New `analysis_reports` table (reporter_id, analysis_id, reason). Opens a small dialog → inserts row → toast. Admin sees them in `/admin`. |
| Embed Badge | Generate `<iframe src="https://verifaibd.lovable.app/embed/<id>" width="320" height="120">` snippet → copy to clipboard. Add minimal `/embed/$id` route showing score badge only. |
| Compare Models | Already toggles a panel — keep, but populate from real `modelResults[]` (currently only EfficientNet-B2). Add a stub row for "Gemini explainer" using its latency. |
| Newsroom Export (CSV) | Already works — verify it includes only real fields. |

Two new deps: `jspdf`, `html2canvas`.

## 3. Slide-deck viewer for `/docs`

You want a page that shows your pitch deck as one image per slide (like Google Slides preview), with the source `.pptx` and `.pdf` available for download.

Database already has the `presentations` table with `slide_image_urls[]`, `pptx_url`-style fields can be added.

**Admin side (`/admin`):**
- New "Presentations" panel
- Upload form accepting: title, `.pptx` file, `.pdf` file, and multiple slide images (one PNG/JPG per slide, in order)
- Files go to a public `presentations` Storage bucket
- Inserts a row in `presentations` table with `is_active=true` (deactivates previous active row)

**Public side (`/docs`):**
- Reads the active presentation
- Shows slide images in a deck-style viewer (prev / next, slide counter, fullscreen, keyboard arrows)
- "Download PPTX" and "Download PDF" buttons link to the storage URLs

Why image-per-slide: rendering `.pptx` natively in a browser is impossible without a heavy converter. Pre-exporting slides as images (you do this once before the demo) gives pixel-perfect playback with zero runtime cost.

## 4. Database changes (one migration)

- `analysis_reports` table (id, analysis_id, reporter_id nullable, reason text, status, created_at) + RLS: anyone can insert, only admins can read
- Add columns to `presentations`: `pptx_url text`, `pdf_url text`
- Create Storage bucket `presentations` (public read, admin write)

## 5. Out of scope (intentionally)

- Real EXIF/C2PA metadata parsing — stays roadmap
- Real reverse image search — stays roadmap
- Real audio-visual sync — stays roadmap
- Server-side PDF rendering — client-side is enough for hackathon

## Technical notes

- `jspdf` + `html2canvas` are pure JS, bundle ~200KB, no server runtime concerns
- PPT/PDF storage paths: `presentations/{id}/deck.pptx`, `presentations/{id}/deck.pdf`, `presentations/{id}/slides/01.png`
- Permalink rehydration: detect page checks `?a=<uuid>`, queries `analyses` table, renders without re-running HF
- Embed route renders only a compact 320×120 score badge iframe, no nav

## Build order

1. Migration (presentations cols, analysis_reports, storage bucket)
2. Score-cards honesty fix + risk-factor cleanup
3. Permalink rehydration + Copy Link + Embed route + Embed Badge
4. PDF + Share as Image (install deps)
5. Report dialog + admin list
6. Admin presentation upload + `/docs` deck viewer
