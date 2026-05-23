import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [
    { title: "Technical Documentation — VerifAI" },
    { name: "description", content: "Architecture, PRD, APIs, data flow, and roadmap for the VerifAI deepfake detection platform." },
  ]}),
  component: DocsPage,
});

const tabs = [
  { id: "presentation", label: "📑 Presentation" },
  { id: "prd", label: "📋 PRD" },
  { id: "architecture", label: "🏗️ Architecture" },
  { id: "database", label: "🗄️ Database" },
  { id: "apis", label: "🔌 APIs" },
  { id: "dataflow", label: "🌊 Data Flow" },
  { id: "auth", label: "🔐 Auth & RBAC" },
  { id: "edge", label: "⚡ Edge Functions" },
  { id: "routes", label: "🛣️ Routes" },
  { id: "stack", label: "🛠️ Tech Stack" },
  { id: "roadmap", label: "🗺️ Roadmap" },
];

function DocsPage() {
  const [tab, setTab] = useState("presentation");
  return (
    <div>
      <div className="border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Technical Documentation</h1>
          <p className="mt-2 text-muted-foreground">VerifAI — Bangla-First Deepfake Detection Infrastructure</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["v1.0.0", "BuildFest 2026", "Track 5: InfoTech", "Open Methodology"].map(b =>
              <span key={b} className="text-xs px-2 py-1 rounded-full border border-cyan/40 text-cyan bg-cyan/5 font-mono">{b}</span>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4 overflow-x-auto scrollbar-cyan">
          <div className="flex gap-2 min-w-max">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition ${tab === t.id ? "bg-cyan/15 border-cyan text-cyan glow-cyan" : "border-[color:var(--border)] text-muted-foreground hover:border-cyan/40 hover:text-foreground"}`}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {tab === "presentation" && <Presentation />}
        {tab === "prd" && <PRD />}
        {tab === "architecture" && <Architecture />}
        {tab === "database" && <DatabaseTab />}
        {tab === "apis" && <APIs />}
        {tab === "dataflow" && <DataFlow />}
        {tab === "auth" && <Auth />}
        {tab === "edge" && <EdgeFns />}
        {tab === "routes" && <RoutesTab />}
        {tab === "stack" && <Stack />}
        {tab === "roadmap" && <Roadmap />}
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-bold text-cyan mt-8 mb-4 text-glow-cyan">{children}</h2>;
}

function Presentation() {
  const defaultSlides = [
    "The Problem — 60M Users, Zero Protection",
    "Meet VerifAI — Bangla-First Detection",
    "Live Demo — Trust Score in Action",
    "4-Agent AI Architecture",
    "Data Strategy & Knowledge Graph",
    "Ethical Safeguards & Privacy",
    "KPIs & Accuracy Targets",
    "Roadmap — Build Locally, Lead Globally",
  ];
  const [isAdmin, setIsAdmin] = useState(false);
  const [deckUrl, setDeckUrl] = useState<string | null>(null);
  const [deckName, setDeckName] = useState<string | null>(null);
  const [slideImgs, setSlideImgs] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      setIsAdmin(p?.role === "admin");
    })();
    setDeckUrl(localStorage.getItem("verifai-deck-url"));
    setDeckName(localStorage.getItem("verifai-deck-name"));
    try { setSlideImgs(JSON.parse(localStorage.getItem("verifai-deck-slides") || "[]")); } catch {}
  }, []);

  const readFile = (f: File) => new Promise<string>((res, rej) => {
    const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f);
  });

  const onUploadDeck = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error("Deck too large (max 10MB)"); return; }
    try {
      const b64 = await readFile(f);
      localStorage.setItem("verifai-deck-url", b64);
      localStorage.setItem("verifai-deck-name", f.name);
      setDeckUrl(b64); setDeckName(f.name);
      toast.success("Deck uploaded");
    } catch { toast.error("Upload failed (storage full?)"); }
  };

  const onUploadSlides = async (files: FileList) => {
    const imgs = await Promise.all(Array.from(files).slice(0, 20).map(readFile));
    const next = [...slideImgs, ...imgs].slice(0, 20);
    try {
      localStorage.setItem("verifai-deck-slides", JSON.stringify(next));
      setSlideImgs(next); toast.success(`${imgs.length} slide(s) added`);
    } catch { toast.error("Storage full — try fewer/smaller images"); }
  };

  const clearAll = () => {
    localStorage.removeItem("verifai-deck-url"); localStorage.removeItem("verifai-deck-name"); localStorage.removeItem("verifai-deck-slides");
    setDeckUrl(null); setDeckName(null); setSlideImgs([]); toast.success("Cleared");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <H2>Slide Deck</H2>
        {deckUrl && (
          <a href={deckUrl} download={deckName || "verifai-deck.pptx"} className="rounded-md bg-cyan px-4 py-2 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan">Download Deck</a>
        )}
      </div>

      {isAdmin && (
        <div className="glass rounded-2xl p-5 mb-6 border border-violet/30">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="font-display font-semibold text-violet">🛠️ Admin upload</div>
            {(deckUrl || slideImgs.length > 0) && <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-danger hover:underline"><Trash2 className="h-3 w-3" /> Clear all</button>}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="border-2 border-dashed border-violet/40 rounded-lg p-4 text-center cursor-pointer hover:bg-violet/5">
              <Upload className="h-5 w-5 text-violet mx-auto" />
              <div className="mt-2 text-sm font-semibold">Upload PPTX / PDF</div>
              <div className="text-xs text-muted-foreground">Max 10MB · saved to your browser</div>
              <input type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="hidden" onChange={e => e.target.files?.[0] && onUploadDeck(e.target.files[0])} />
            </label>
            <label className="border-2 border-dashed border-violet/40 rounded-lg p-4 text-center cursor-pointer hover:bg-violet/5">
              <Images className="h-5 w-5 text-violet mx-auto" />
              <div className="mt-2 text-sm font-semibold">Upload Slide Images</div>
              <div className="text-xs text-muted-foreground">PNG / JPG · up to 20</div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onUploadSlides(e.target.files)} />
            </label>
          </div>
        </div>
      )}

      {/* Main viewer */}
      <div className="glass rounded-2xl p-4 mb-6">
        {deckUrl ? (
          deckUrl.startsWith("data:application/pdf") ? (
            <iframe src={deckUrl} title={deckName || "deck"} className="w-full h-[70vh] rounded-lg bg-black" />
          ) : (
            <div className="aspect-video rounded-lg bg-gradient-to-br from-cyan/10 to-violet/10 border border-cyan/20 flex flex-col items-center justify-center text-center p-6">
              <FileText className="h-12 w-12 text-cyan mb-3" />
              <div className="font-display text-lg">{deckName}</div>
              <p className="text-xs text-muted-foreground mt-1">PPTX preview not supported inline. Use the Download button above to view.</p>
            </div>
          )
        ) : (
          <div className="aspect-video rounded-lg bg-gradient-to-br from-cyan/10 to-violet/10 border border-cyan/20 flex items-center justify-center text-center p-6">
            <div>
              <FileText className="h-12 w-12 text-cyan mx-auto mb-3" />
              <div className="font-display text-lg">No deck uploaded yet</div>
              <p className="text-xs text-muted-foreground mt-1">{isAdmin ? "Use the admin upload above." : "Ask an admin to upload the deck."}</p>
            </div>
          </div>
        )}
      </div>

      {/* Slide card deck */}
      <h3 className="font-display text-lg font-semibold mb-3">Deck Slides</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slideImgs.length > 0 ? slideImgs.map((src, i) => (
          <button key={i} onClick={() => setActive(i)} className="glass rounded-xl overflow-hidden text-left hover:border-cyan/40 transition group">
            <div className="aspect-video bg-black overflow-hidden">
              <img src={src} alt={`Slide ${i + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="font-mono text-xs text-cyan">SLIDE {String(i + 1).padStart(2, "0")}</span>
              <span className="text-xs text-muted-foreground group-hover:text-cyan">⛶ Open</span>
            </div>
          </button>
        )) : defaultSlides.map((s, i) => (
          <div key={s} className="glass rounded-xl aspect-video p-6 flex flex-col justify-between hover:border-cyan/40 transition">
            <div>
              <div className="font-mono text-xs text-cyan">SLIDE {String(i + 1).padStart(2, "0")}</div>
              <div className="mt-3 font-display text-xl font-semibold">{s}</div>
            </div>
            <span className="self-end text-xs text-muted-foreground">Placeholder</span>
          </div>
        ))}
      </div>

      {active !== null && slideImgs[active] && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setActive(null)}>
          <div className="relative max-w-6xl w-full" onClick={e => e.stopPropagation()}>
            <img src={slideImgs[active]} alt="" className="w-full rounded-lg" />
            <div className="mt-3 flex items-center justify-between text-sm">
              <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0} className="text-cyan disabled:opacity-30">← Prev</button>
              <span className="font-mono text-cyan">{active + 1} / {slideImgs.length}</span>
              <button onClick={() => setActive(Math.min(slideImgs.length - 1, active + 1))} disabled={active === slideImgs.length - 1} className="text-cyan disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PRD() {
  return (
    <div className="prose-invert max-w-none space-y-4 text-sm leading-relaxed">
      <H2>Problem Statement</H2>
      <p>Bangladesh has 60+ million internet users and zero native AI-trust infrastructure. Existing global detectors are English-only, expensive, and trained on Western faces. Deepfake-driven harassment, political disinformation, and commercial fraud are surging while fact-checkers have no fast, affordable, Bangla-native tooling.</p>
      <H2>Target Users</H2>
      <table className="w-full glass rounded-xl overflow-hidden">
        <thead className="bg-[color:var(--bg-surface)]/70 text-cyan text-xs uppercase tracking-widest"><tr><th className="text-left px-4 py-2">Segment</th><th className="text-left px-4 py-2">Need</th></tr></thead>
        <tbody>
          {[["Journalists", "Verify clips before publishing"], ["Fact-checkers (Rumor Scanner BD)", "Bulk API + audit trail"], ["Citizens", "Quick check via WhatsApp/Telegram"], ["Law enforcement", "Legal-grade evidence PDF"]].map(r => <tr key={r[0]} className="border-t border-[color:var(--border)]"><td className="px-4 py-2 font-semibold">{r[0]}</td><td className="px-4 py-2 text-muted-foreground">{r[1]}</td></tr>)}
        </tbody>
      </table>
      <H2>Core Features (Priority)</H2>
      <table className="w-full glass rounded-xl overflow-hidden">
        <thead className="bg-[color:var(--bg-surface)]/70 text-cyan text-xs uppercase tracking-widest"><tr><th className="text-left px-4 py-2">Priority</th><th className="text-left px-4 py-2">Feature</th></tr></thead>
        <tbody>{[
          ["P0", "Upload + 4-agent pipeline + trust score"], ["P0", "Bangla + English explanation"], ["P0", "Privacy: 24h auto-delete"],
          ["P1", "Public threat dashboard"], ["P1", "Legal PDF report export"], ["P1", "Source credibility graph"],
          ["P2", "Telegram bot"], ["P2", "Browser extension"], ["P2", "Bulk API"],
        ].map(r => <tr key={r[1]} className="border-t border-[color:var(--border)]"><td className="px-4 py-2"><span className={`text-xs px-2 py-1 rounded font-mono ${r[0] === "P0" ? "bg-danger/20 text-danger" : r[0] === "P1" ? "bg-warning/20 text-warning" : "bg-cyan/15 text-cyan"}`}>{r[0]}</span></td><td className="px-4 py-2">{r[1]}</td></tr>)}</tbody>
      </table>
      <H2>Success Metrics</H2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
        <li>≥85% detection accuracy on test set</li><li>&lt;6s p95 latency</li><li>&lt;৳2 average cost per analysis</li><li>10k analyses processed in first 90 days</li>
      </ul>
      <H2>Out of Scope (v1)</H2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
        <li>Real-time livestream verification</li><li>Generating synthetic media (defensive only)</li><li>Personal face database / identity matching</li>
      </ul>
    </div>
  );
}

function Architecture() {
  const layers = [
    { t: "User Interaction Layer", s: "Lovable + React + TailwindCSS" },
    { t: "Application Logic Layer", s: "TanStack Server Functions + Supabase" },
    { t: "AI Intelligence Layer (MCP)", s: "Vision · Metadata · Context · Fusion agents", children: ["Vision Agent — EfficientNet-B4", "Metadata Agent — EXIF + C2PA + SynthID", "Context Agent — PGVector + Neo4j RAG", "Fusion Agent → Trust Score"] },
    { t: "Knowledge Retrieval Layer", s: "PGVector + Neo4j AuraDB" },
    { t: "Data Infrastructure", s: "Supabase Postgres + Cloudflare R2" },
    { t: "Automation Layer", s: "Firecrawl + n8n + Telegram Bot" },
    { t: "Deployment", s: "Vercel + Supabase + Cloudflare" },
  ];
  return (
    <div>
      <H2>System Architecture</H2>
      <div className="space-y-3">
        {layers.map((l, i) => (
          <div key={l.t}>
            <div className="glass rounded-xl p-5 border-l-4 border-cyan">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-cyan">L{i + 1}</span>
                <h3 className="font-display font-semibold text-lg">{l.t}</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1 ml-9">{l.s}</p>
              {l.children && (
                <ul className="mt-3 ml-9 space-y-1 text-sm">
                  {l.children.map(c => <li key={c} className="text-cyan/80">├── {c}</li>)}
                </ul>
              )}
            </div>
            {i < layers.length - 1 && <div className="text-center text-cyan/40 my-1">▼</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DatabaseTab() {
  const tables = [
    { name: "analyses", cols: ["id (uuid)", "user_id (uuid)", "content_url", "trust_score (int)", "vision_score", "metadata_score", "context_score", "bangla_explanation", "en_explanation", "created_at", "auto_delete_at", "status"] },
    { name: "users", cols: ["id (uuid)", "email", "role (enum)", "plan", "created_at", "analyses_count"] },
    { name: "sources", cols: ["id", "domain", "credibility_score (int)", "known_campaigns (int[])", "last_checked"] },
    { name: "deepfake_embeddings", cols: ["id", "content_hash", "embedding (vector(1536))", "category", "verified_at"] },
    { name: "audit_logs", cols: ["id", "user_id_hash", "action", "analysis_id", "timestamp"] },
  ];
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2"><H2>Database Schema</H2>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded-full border border-safe text-safe">RLS enabled on all tables</span>
          <span className="text-xs px-2 py-1 rounded-full border border-cyan text-cyan">pgvector: enabled</span>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        {tables.map(t => (
          <div key={t.name} className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-cyan/10 border-b border-[color:var(--border)] font-mono text-sm text-cyan">📄 {t.name}</div>
            <ul className="divide-y divide-[color:var(--border)]">
              {t.cols.map(c => <li key={c} className="px-4 py-2 font-mono text-xs text-muted-foreground">{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Endpoint({ method, path, desc, req, res }: { method: string; path: string; desc: string; req?: string; res: string }) {
  const colors: Record<string, string> = { GET: "bg-cyan/15 text-cyan border-cyan/40", POST: "bg-safe/15 text-safe border-safe/40" };
  return (
    <div className="glass rounded-xl p-5 mb-4">
      <div className="flex items-center gap-3">
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${colors[method] || ""}`}>{method}</span>
        <code className="font-mono text-sm">{path}</code>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      {req && <><div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Request</div><pre className="mt-1 bg-[color:var(--bg-deep)] rounded-md p-3 font-mono text-xs overflow-x-auto text-cyan/90">{req}</pre></>}
      <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Response</div>
      <pre className="mt-1 bg-[color:var(--bg-deep)] rounded-md p-3 font-mono text-xs overflow-x-auto text-cyan/90">{res}</pre>
    </div>
  );
}

function APIs() {
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2"><H2>REST API Reference</H2>
        <button className="rounded-md bg-cyan px-3 py-2 text-sm text-[color:var(--bg-deep)] font-semibold glow-cyan">API Playground</button>
      </div>
      <Endpoint method="POST" path="/api/analyze" desc="Upload content for deepfake analysis." req={`{
  "url": "https://example.com/video.mp4",
  "type": "video",
  "language": "bn"
}`} res={`{
  "id": "VAI-2026-0847",
  "trust_score": 12,
  "confidence": 0.942,
  "category": "Political",
  "bangla_explanation": "...",
  "en_explanation": "..."
}`} />
      <Endpoint method="GET" path="/api/analysis/{id}" desc="Retrieve a previous analysis result." res={`{
  "id": "VAI-2026-0847", "trust_score": 12, "status": "complete"
}`} />
      <Endpoint method="GET" path="/api/feed" desc="Public paginated feed of recently verified deepfakes." res={`{
  "items": [ ... ], "next_cursor": "abc123"
}`} />
      <Endpoint method="POST" path="/api/watchlist" desc="Add a journalist watchlist keyword for proactive monitoring." req={`{ "keyword": "election 2026", "alert_email": "..." }`} res={`{ "watchlist_id": "wl_..." }`} />
      <Endpoint method="GET" path="/api/stats" desc="Platform-wide statistics." res={`{ "analyzed_today": 247, "deepfakes": 89 }`} />
      <Endpoint method="POST" path="/api/report" desc="Report a deepfake to authorities." req={`{ "analysis_id": "VAI-2026-0847", "agency": "BD_CCU" }`} res={`{ "report_id": "rpt_...", "status": "submitted" }`} />
    </div>
  );
}

function DataFlow() {
  const steps = [
    { l: "User Upload", c: "cyan" }, { l: "Validation + Virus Scan", c: "cyan" }, { l: "Cloudflare R2 (temp)", c: "cyan" },
    { l: "Edge Orchestrator", c: "violet" }, { l: "4 Agents (parallel)", c: "violet" }, { l: "Weighted Fusion", c: "violet" }, { l: "LLM Bangla Explain", c: "violet" },
    { l: "Store to Postgres", c: "cyan" }, { l: "Return Result", c: "cyan" }, { l: "Auto-delete R2 in 24h", c: "danger" },
  ];
  return (
    <div>
      <H2>Data Flow</H2>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.l} className="flex items-center gap-2">
            <div className={`glass rounded-lg px-3 py-2 text-xs border-l-2 ${s.c === "cyan" ? "border-cyan text-cyan" : s.c === "violet" ? "border-violet text-violet" : "border-danger text-danger"}`}>{s.l}</div>
            {i < steps.length - 1 && <span className="text-cyan/50">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Auth() {
  return (
    <div>
      <H2>Auth Flow</H2>
      <div className="glass rounded-xl p-5 font-mono text-sm flex flex-wrap gap-2 items-center">
        <span className="px-2 py-1 rounded bg-cyan/10 text-cyan">User</span>→
        <span className="px-2 py-1 rounded bg-cyan/10 text-cyan">Supabase GoTrue</span>→
        <span className="px-2 py-1 rounded bg-violet/10 text-violet">JWT Token</span>→
        <span className="px-2 py-1 rounded bg-violet/10 text-violet">Edge Validates</span>→
        <span className="px-2 py-1 rounded bg-safe/10 text-safe">RLS Policy Check</span>→
        <span className="px-2 py-1 rounded bg-safe/10 text-safe">Data Returned</span>
      </div>
      <H2>Roles</H2>
      <table className="w-full glass rounded-xl overflow-hidden">
        <thead className="bg-[color:var(--bg-surface)]/70 text-cyan text-xs uppercase tracking-widest"><tr><th className="text-left px-4 py-2">Role</th><th className="text-left px-4 py-2">Permissions</th></tr></thead>
        <tbody>{[
          ["citizen", "Upload, view own analyses"],
          ["journalist", "Bulk API, watchlist, PDF export"],
          ["admin", "All + user management, model config"],
          ["api_user", "API key auth, rate limited"],
        ].map(r => <tr key={r[0]} className="border-t border-[color:var(--border)]"><td className="px-4 py-2 font-mono text-cyan">{r[0]}</td><td className="px-4 py-2 text-muted-foreground">{r[1]}</td></tr>)}</tbody>
      </table>
      <H2>Example RLS Policy</H2>
      <pre className="glass rounded-xl p-4 font-mono text-xs overflow-x-auto text-cyan/90">{`create policy "users read own analyses"
on public.analyses for select
to authenticated
using (auth.uid() = user_id);`}</pre>
    </div>
  );
}

function EdgeFns() {
  const fns = [
    { n: "analyze-content", t: "POST /api/analyze", d: "Orchestrates 4-agent pipeline.", rt: "~4s" },
    { n: "auto-delete-media", t: "Cron (hourly)", d: "Deletes R2 objects after 24h.", rt: "~200ms" },
    { n: "embed-content", t: "DB trigger after insert", d: "Generates and stores PGVector embeddings.", rt: "~600ms" },
    { n: "watchlist-notify", t: "DB webhook", d: "Checks new deepfakes against journalist watchlists.", rt: "~300ms" },
    { n: "export-pdf-report", t: "POST /api/export", d: "Generates legal evidence PDF.", rt: "~1.2s" },
    { n: "api-key-auth", t: "All /api/* routes", d: "Validates API keys for external callers.", rt: "~50ms" },
  ];
  return (
    <div><H2>Edge Functions</H2>
      <div className="grid sm:grid-cols-2 gap-3">
        {fns.map(f => (
          <div key={f.n} className="glass rounded-xl p-5">
            <div className="font-mono text-sm text-cyan">⚡ {f.n}</div>
            <div className="mt-2 text-xs text-muted-foreground"><span className="text-warning">Trigger:</span> {f.t}</div>
            <p className="mt-2 text-sm">{f.d}</p>
            <div className="mt-3 text-xs font-mono text-safe">runtime ≈ {f.rt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutesTab() {
  const routes = [
    ["/", "Public", "None", "Landing page"],
    ["/detect", "Public", "Optional", "Detection tool"],
    ["/dashboard", "Public", "None", "Live threat feed"],
    ["/admin", "Private", "Admin only", "Admin dashboard"],
    ["/docs", "Public", "None", "This page"],
    ["/laws", "Public", "None", "Cyber laws by country"],
    ["/help", "Public", "None", "Support + crisis hotlines"],
    ["/login", "Public", "None", "Auth"],
    ["/signup", "Public", "None", "Register"],
    ["/api/analyze", "API", "JWT or API Key", "Submit analysis"],
    ["/api/feed", "API", "None", "Public deepfake feed"],
    ["/api/report", "API", "JWT", "Report content"],
  ];
  return (
    <div><H2>Routes</H2>
      <table className="w-full glass rounded-xl overflow-hidden text-sm">
        <thead className="bg-[color:var(--bg-surface)]/70 text-cyan text-xs uppercase tracking-widest"><tr><th className="text-left px-3 py-2">Route</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Auth</th><th className="text-left px-3 py-2">Description</th></tr></thead>
        <tbody>{routes.map(r => <tr key={r[0]} className="border-t border-[color:var(--border)]"><td className="px-3 py-2 font-mono text-cyan">{r[0]}</td><td className="px-3 py-2">{r[1]}</td><td className="px-3 py-2 text-muted-foreground">{r[2]}</td><td className="px-3 py-2">{r[3]}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Stack() {
  const cats = [
    { h: "Frontend", t: ["Lovable", "React", "Vite", "TailwindCSS", "Recharts", "D3.js"] },
    { h: "AI / LLM", t: ["Claude 3.5 Sonnet", "Gemini 2.0", "Ollama / Llama 3.1"] },
    { h: "Vision ML", t: ["EfficientNet-B4", "Xception", "HuggingFace ViT"] },
    { h: "Backend", t: ["Supabase", "PostgreSQL", "TanStack Server Fns"] },
    { h: "Vector DB", t: ["pgvector (Supabase)"] },
    { h: "Graph DB", t: ["Neo4j AuraDB"] },
    { h: "Object Storage", t: ["Cloudflare R2"] },
    { h: "Cache", t: ["Upstash Redis"] },
    { h: "Scraping", t: ["Firecrawl", "Playwright", "yt-dlp"] },
    { h: "Orchestration", t: ["MCP", "n8n"] },
    { h: "Deployment", t: ["Vercel", "Cloudflare CDN"] },
    { h: "Observability", t: ["Grafana", "Prometheus", "OpenTelemetry"] },
  ];
  return (
    <div><H2>Tech Stack</H2>
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2"><span>Open Source Coverage</span><span className="text-safe font-mono font-bold">92%</span></div>
        <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan to-safe" style={{ width: "92%" }} /></div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cats.map(c => (
          <div key={c.h} className="glass rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-widest text-cyan mb-3">{c.h}</h3>
            <div className="flex flex-wrap gap-1.5">{c.t.map(x => <span key={x} className="text-xs px-2 py-1 rounded border border-cyan/30 bg-[color:var(--bg-deep)]/60 font-mono">{x}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Roadmap() {
  const phases = [
    { p: 1, t: "BuildFest 2026 — NOW", s: "IN PROGRESS", c: "cyan", items: ["Web MVP", "4-agent pipeline", "Bangla + English", "Public dashboard", "≥85% accuracy"] },
    { p: 2, t: "Q3 2026", s: "PLANNED", c: "violet", items: ["Public REST API", "Newsroom dashboard", "Telegram bot", "Bulk URL verification"] },
    { p: 3, t: "Q4 2026", s: "PLANNED", c: "violet", items: ["Browser extension", "Mobile app (React Native)", "Offline mode (Ollama)", "Watchlist alerts"] },
    { p: 4, t: "2027", s: "FUTURE", c: "muted", items: ["Hindi + Urdu + Tamil", "South Asia expansion", "Government partnerships", "Open-source model release"] },
  ];
  return (
    <div><H2>Roadmap — Build Locally, Lead Globally</H2>
      <div className="grid md:grid-cols-2 gap-4">
        {phases.map(ph => (
          <div key={ph.p} className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs text-cyan">PHASE {ph.p}</div>
              <span className={`text-xs px-2 py-1 rounded-full font-mono ${ph.c === "cyan" ? "bg-cyan/15 text-cyan" : ph.c === "violet" ? "bg-violet/15 text-violet" : "bg-muted text-muted-foreground"}`}>{ph.s}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold">{ph.t}</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {ph.items.map(i => <li key={i} className="flex items-center gap-2"><span className={ph.c === "cyan" ? "text-cyan" : "text-muted-foreground"}>{ph.c === "cyan" ? "◐" : "○"}</span>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
