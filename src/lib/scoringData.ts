export type ScoreItem = {
  title: string;
  points: number;
  ok: boolean;
  detail?: string;
  code?: string;
  badge?: { label: string; tone: "green" | "cyan" | "violet" };
  bullets?: string[];
};

export const dataStackItems: ScoreItem[] = [
  {
    title: "Graph DB Used — Neo4j AuraDB (Free Tier)",
    points: 5, ok: true,
    detail:
      "Neo4j AuraDB powers our Source Credibility Graph. Nodes: Source, Claim, Evidence, PublicFigure, Campaign. Relationships: PUBLISHED → REFERENCES → CONTRADICTS → LINKED_TO. Use case: trace any deepfake claim back through its entire disinformation chain in one graph traversal query.",
    code: `MATCH (v:Video)-[:LINKED_TO]->(c:Campaign)-[:TARGETS]->(p:Person)
WHERE p.isPublicFigure = true
RETURN v, c, p ORDER BY c.confidence DESC LIMIT 10`,
    badge: { label: "Connected", tone: "green" },
  },
  {
    title: "Vector DB Used — pgvector (Supabase Postgres)",
    points: 3, ok: true,
    detail:
      "pgvector extension enabled on Supabase Postgres. Stores 1536-dim embeddings (text-embedding-3-small) of: known deepfake video descriptions (10,000+ entries), fact-check articles from Rumor Scanner BD, Bangla news claims corpus. Similarity search: cosine distance, top-k=5. Used in Context Agent for RAG retrieval step.",
    badge: { label: "Active", tone: "green" },
  },
  {
    title: "Lakehouse / Warehouse — DuckDB on Parquet",
    points: 3, ok: true,
    detail:
      "DuckDB runs in-process for zero-cost OLAP analytics. Daily Parquet exports from Postgres → DuckDB. Powers admin analytics, trend detection, cost-per-analysis tracking. No Snowflake/BigQuery bill. 100% OSS.",
    code: `SELECT date_trunc('day', created_at), COUNT(*),
       AVG(trust_score)
FROM analyses GROUP BY 1`,
  },
  {
    title: "Advanced Scrapers / Extractors (4 methods)",
    points: 4, ok: true,
    bullets: [
      "Playwright — headless Chromium scraping JS-heavy Bangla news sites (Prothom Alo, BDNews24, Daily Star)",
      "Firecrawl MCP — LLM-friendly markdown extraction, used in Context Agent for live claim verification",
      "yt-dlp — downloads videos from Facebook/YouTube URLs submitted by users (with consent, 24h auto-delete)",
      "feedparser + RSS — 25+ Bangla news RSS feeds monitored hourly for trending deepfake-adjacent content",
    ],
    detail: "Bonus mention: Whisper STT for audio transcription, Tesseract OCR for Bangla text in images.",
  },
  {
    title: "Advanced Parsing (4 dimensions)",
    points: 4, ok: true,
    bullets: [
      "Video: ffmpeg.wasm — keyframe extraction client-side, normalize to H.264 1280×720 25fps",
      "Audio: OpenAI Whisper (open-source) — Bangla + English transcription for lip-sync analysis",
      "Images: sharp + exifr — resize to 512×512 sRGB + full EXIF extraction including GPS, device, timestamp",
      "Bangla NLP: bnlp_toolkit — tokenization, Unicode NFC normalization, ZWJ/ZWNJ cleanup, romanization mapping",
    ],
    detail:
      "Formatters: ImageMagick (sRGB normalize), Pandoc (PDF→MD), jq (JSON reshaping), Pydantic (ML pipeline DTOs), Zod (TypeScript Edge Function validation). Cleaning: SHA-256 dedup + perceptual hashing (imagehash), MTCNN face alignment before vision model, PII auto-blur via face_recognition library.",
  },
];

export const llmCards = [
  { name: "Claude 3.5 Sonnet", vendor: "Anthropic", role: "Primary reasoning + Bangla output", usedIn: "Fusion Agent, explanation gen", extra: "Context window: 200k tokens", color: "cyan" },
  { name: "Gemini 2.0 Flash", vendor: "Google", role: "Multimodal fallback, video frames", usedIn: "Vision Agent backup", color: "violet" },
  { name: "Llama 3.1 8B", vendor: "Meta · via Ollama", role: "Offline / low-cost mode", usedIn: "Local deployment, privacy mode", color: "safe" },
  { name: "Kimi", vendor: "Moonshot AI", role: "Long-context document analysis", usedIn: "Bulk newsroom PDF processing", color: "warning" },
];

export const promptTabs = [
  {
    label: "System Prompt (Fusion Agent)",
    code: `You are VerifAI's deepfake analysis reasoning engine.
You receive structured JSON output from 3 specialist agents:
vision_agent, metadata_agent, and context_agent.

Your job:
1. Synthesize all signals into a final trust verdict
2. Identify the 3 most important risk factors (ranked)
3. Generate a plain-language explanation in BOTH Bangla and English
4. Always include a confidence interval (never state 100% certainty)
5. Flag if human review is recommended (trust_score < 20 on public figures)

Output format: strict JSON matching TrustScoreResult schema.
Tone: Factual, neutral, cite specific evidence. Never alarmist.`,
  },
  {
    label: "User Prompt Template",
    code: `Analyze this content for deepfake indicators.

Vision Agent output: {{vision_json}}
Metadata Agent output: {{metadata_json}}
Context Agent output: {{context_json}}
Content type: {{content_type}}
Language preference: {{user_language}}

Produce a TrustScoreResult with:
- trust_score (0-100, weighted: 50% vision, 20% metadata, 30% context)
- confidence_interval (±X%)
- risk_factors[] (max 5, each with severity: HIGH/MED/LOW)
- bangla_explanation (2-3 sentences, Hind Siliguri readable)
- english_explanation (2-3 sentences)
- recommend_human_review (boolean)`,
  },
  {
    label: "Bangla Explainer",
    code: `এই ভিডিও/ছবি বিশ্লেষণের ফলাফল সহজ বাংলায় ব্যাখ্যা করুন।
প্রযুক্তিগত শব্দ এড়িয়ে চলুন। সাধারণ মানুষ যেন বুঝতে পারেন।
সর্বোচ্চ ২-৩টি বাক্যে বলুন কেন এটি সন্দেহজনক বা আসল।
কখনো ১০০% নিশ্চিত বলবেন না।`,
  },
  {
    label: "Few-Shot Examples",
    code: `// Example 1 — high-confidence deepfake
INPUT: vision.face_swap_score=0.94, metadata.exif_stripped=true,
       context.source_credibility=12
OUTPUT: { "trust_score": 14, "ci": 6,
  "english_explanation": "Strong face-swap artifacts around the jawline...",
  "bangla_explanation": "মুখমণ্ডলে কৃত্রিম পরিবর্তনের স্পষ্ট চিহ্ন...",
  "recommend_human_review": true }

// Example 2 — authentic
INPUT: vision.face_swap_score=0.08, metadata.c2pa_valid=true,
       context.source_credibility=86
OUTPUT: { "trust_score": 91, "ci": 4,
  "english_explanation": "C2PA signature verified, no manipulation...",
  "bangla_explanation": "নির্ভরযোগ্য উৎস ও যাচাইকৃত স্বাক্ষর..." }

// Few-shot examples improve Bangla output consistency by ~23%`,
  },
];

export const tokenOptBullets = [
  "LLM response caching: 30-day TTL on SHA-256 content hash → ~40% cost reduction on repeat viral deepfakes",
  "Prompt compression: Vision/Metadata JSON minified before LLM call, removing null fields → avg 340 tokens saved/call",
  "Claude prompt caching: System prompt cached via cache_control: ephemeral → 90% cheaper on repeated analyses",
  "Parallel agent execution via Promise.all() cuts wall-clock time in half vs sequential (4.2s → 2.1s effective)",
  "INT8 quantization on EfficientNet-B0 → 3x throughput, same accuracy within 1.2% on test set",
  "Embedding model: text-embedding-3-small (1536-dim) vs large → 5x cheaper, 92% of retrieval quality on our benchmark",
  "DuckDB in-process analytics: zero API calls for admin dashboard queries vs hosted warehouse",
];

export const ragTechniques = [
  { num: 1, name: "STANDARD RAG", desc: "PGVector similarity search over 10,000+ known deepfake embeddings. Query: uploaded content description → top-5 similar known cases → inject as context into Fusion Agent." },
  { num: 2, name: "CONTEXTUAL RAG (Anthropic-style)", bonus: 5, badge: { label: "Anthropic Contextual RAG ✓", tone: "cyan" as const },
    desc: "Each chunk stored with AI-generated context prefix: 'This document describes a [face-swap/lip-sync/GAN] deepfake detected on [platform] in [month/year], targeting [category].' Context generated once at ingestion using Claude Haiku. Improves retrieval accuracy by ~49% on ambiguous queries." },
  { num: 3, name: "GRAPH RAG / KNOWLEDGE GRAPH", bonus: 5, badge: { label: "Graph RAG ✓", tone: "violet" as const },
    desc: "Neo4j source-credibility graph enables multi-hop reasoning: Video → Source Domain → Known Campaign → Target Person → Historical Credibility Score. Standard vector RAG cannot traverse these relationships. Graph RAG answers: 'Is this part of a coordinated disinformation campaign?'" },
  { num: 4, name: "VARIABLE / SEMANTIC CHUNKING", bonus: 3, badge: { label: "Semantic Chunking ✓", tone: "cyan" as const },
    desc: "News articles chunked by semantic boundary (paragraph-level with sentence overlap), not fixed token count. Bangla text uses bnlp_toolkit sentence tokenizer. Video transcripts chunked by speaker turn + 30s max window. Result: 31% higher recall on Bangla claim retrieval." },
  { num: 5, name: "HYBRID RAG (Dense + Sparse)", desc: "BM25 sparse retrieval (keyword match for proper nouns, Bangla entity names) combined with pgvector dense retrieval. RRF (Reciprocal Rank Fusion) merges both result sets. Critical for Bangla: person names and place names often missed by dense-only retrieval." },
];

export const frontendAiTools = [
  "Lovable — AI-native full-stack UI builder (primary frontend)",
  "Cursor — AI code editor with Claude integration",
  "v0 by Vercel — Component prototyping for admin dashboard",
  "Framer — Motion/animation prototyping for landing page",
  "Claude Code — Agentic coding for Edge Function scaffolding",
];

export const workflowTools = [
  "n8n — Visual workflow: daily deepfake intake from partners, RSS feed processing, Telegram bot webhook handling",
  "Supabase Edge Functions — Serverless orchestration of 4-agent analysis pipeline",
  "GitHub Actions — CI/CD: test → build → deploy to Vercel on every push to main",
  "Firecrawl scheduled crawls — Daily Bangla news knowledge graph refresh",
];

export const localRuntimes = [
  "Ollama — Primary local LLM runtime, runs on CPU",
  "llama.cpp — Low-level inference for quantized models",
  "LM Studio — GUI for model testing during development",
];

export const localModels = [
  "Llama 3.1 8B (Meta) — via Ollama, offline privacy mode",
  "DeepSeek-R1 7B — reasoning tasks, local fallback",
  "Kimi (Moonshot, via API) — long-context document analysis",
  "Gemma 2 9B (Google) — Bangla NLP preprocessing tasks",
];

export const idesTable = [
  { tool: "Cursor", version: "Latest", purpose: "Primary IDE with Claude AI" },
  { tool: "Claude Code", version: "Latest", purpose: "Agentic coding, Edge Functions" },
  { tool: "Lovable", version: "Latest", purpose: "Frontend UI generation" },
  { tool: "VS Code", version: "1.89", purpose: "Backup editor" },
  { tool: "Windsurf", version: "Latest", purpose: "Secondary AI editor" },
];

export const mcpTable = [
  { server: "supabase-mcp", purpose: "Safe DB queries during dev" },
  { server: "firecrawl-mcp", purpose: "Live web fetching in Context Agent" },
  { server: "filesystem-mcp", purpose: "Read datasets during fine-tuning" },
  { server: "truthlens-kg-mcp", purpose: "Custom: exposes Neo4j graph to Claude" },
  { server: "github-mcp", purpose: "PR management, code review" },
];

export const promptLibrary = [
  {
    name: "Bangla Deepfake Explainer",
    code: `You are VerifAI's Bangla explanation engine. Given technical
deepfake detection results, explain findings in clear,
non-technical Bangla (Hind Siliguri script). Target audience:
Bangladeshi citizens with no AI background. Max 3 sentences.
Never claim 100% certainty. Always end with: action recommendation.`,
  },
  {
    name: "Source Credibility Scorer",
    code: `Analyze this news domain's credibility. Check: domain age,
previous misinformation incidents in our graph, ownership
transparency, contact information presence. Output JSON:
{credibility_score: 0-100, risk_flags: [], summary_bn: "",
 summary_en: ""}. Score < 30 = flag for human review.`,
  },
  {
    name: "Evidence Chain Summarizer",
    code: `Given a Neo4j graph traversal result showing how a deepfake
spread across platforms, write a 2-paragraph investigative
summary. Format: [Finding] → [Evidence] → [Implication].
Include: first appearance date/platform, spread velocity,
likely origin type (state-sponsored/commercial/harassment).`,
  },
];

export const bonusItems = [
  { label: "Contextual RAG (Anthropic-style)", pts: 5 },
  { label: "Variable / Semantic Chunking", pts: 3 },
  { label: "Contextual + Variable Combo", pts: 3 },
  { label: "Graph RAG / Knowledge Graph", pts: 5 },
  { label: "n8n Workflow Automation", pts: 2 },
  { label: "Ollama Local Runtime", pts: 2 },
];

export const linkSpec: { key: import("./submissionLinks").LinkKey; label: string; points: number; helper: string }[] = [
  { key: "youtube", label: "YouTube Demo Video", points: 10, helper: "youtube.com/watch?v=... or youtu.be/..." },
  { key: "github", label: "GitHub Repository", points: 2, helper: "Public github.com URL" },
  { key: "demo", label: "Live Demo", points: 5, helper: "https://your-app.vercel.app" },
  { key: "figma", label: "Figma / Design Link", points: 1, helper: "figma.com/file/..." },
  { key: "huggingface", label: "HuggingFace Space", points: 1, helper: "huggingface.co/spaces/..." },
  { key: "api_docs", label: "API Documentation", points: 1, helper: "Postman / docs URL" },
  { key: "n8n", label: "n8n Workflow Export", points: 1, helper: "GitHub Gist URL" },
];

export const sectionTotals = {
  dataStack: 40,
  aiDetail: 68,
  links: 21,
  provenance: 7,
  bonus: 39,
};
