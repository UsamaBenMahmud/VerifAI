import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getHistory, type StoredAnalysis } from "@/lib/localStore";
import { EmptyState } from "@/components/brand/EmptyState";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [
    { title: "Analysis History — VerifAI" },
    { name: "description", content: "Your previous deepfake analysis results." },
  ]}),
  component: HistoryPage,
});

type Filter = "all" | "deepfake" | "uncertain" | "authentic";

function bucketOf(s: number): Filter {
  if (s <= 30) return "deepfake";
  if (s <= 69) return "uncertain";
  return "authentic";
}

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

function HistoryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const all = useMemo<StoredAnalysis[]>(() => getHistory(), []);
  const filtered = useMemo(() => {
    return all.filter((a) => {
      if (filter !== "all" && bucketOf(a.score) !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(a.verdict_en.toLowerCase().includes(q) || (a.url ?? "").toLowerCase().includes(q) || (a.filename ?? "").toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [all, filter, search]);

  const stats = {
    total: all.length,
    deepfakes: all.filter((a) => bucketOf(a.score) === "deepfake").length,
    authentic: all.filter((a) => bucketOf(a.score) === "authentic").length,
    avg: all.length ? Math.round(all.reduce((s, a) => s + a.score, 0) / all.length) : 0,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">📋 Your Analysis History</h1>
        <p className="mt-1 text-sm text-muted-foreground">আপনার বিশ্লেষণের ইতিহাস</p>
      </header>

      {all.length === 0 ? (
        <EmptyState icon="🔍" title="No analyses yet" subtitle="Start by uploading a suspicious video." ctaLabel="Analyze Your First Video →" ctaTo="/detect" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Analyses" value={stats.total} color="cyan" />
            <Stat label="Deepfakes Found" value={stats.deepfakes} color="danger" />
            <Stat label="Authentic" value={stats.authentic} color="safe" />
            <Stat label="Avg Score" value={`${stats.avg}/100`} color="warning" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(["all", "deepfake", "uncertain", "authentic"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${filter === f ? "border-cyan bg-cyan/15 text-cyan" : "border-[color:var(--border)] hover:border-cyan/40"}`}>
                {f === "all" ? "All" : f === "deepfake" ? "Deepfakes ⚠️" : f === "uncertain" ? "Uncertain ⚡" : "Authentic ✅"}
              </button>
            ))}
            <input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-full sm:w-56 rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-1.5 text-xs focus:border-cyan outline-none" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">No results match your filters.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a) => {
                const tone = a.score <= 30 ? "danger" : a.score <= 69 ? "warning" : "safe";
                return (
                  <div key={a.id} className="glass rounded-xl p-4 hover:border-cyan/40 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-12 w-16 rounded bg-gradient-to-br from-cyan/20 to-violet/20 border border-cyan/30 grid place-items-center text-2xl">🎬</div>
                      <span className={`text-xs font-bold px-2 py-1 rounded bg-${tone}/15 text-${tone} border border-${tone}/40`}>{a.score}/100</span>
                    </div>
                    <div className="mt-3 font-display text-sm font-semibold truncate">{a.verdict_en}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.verdict_bn}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{relTime(a.ts)}</span>
                      {a.category && <span className="px-1.5 py-0.5 rounded border border-[color:var(--border)]">{a.category}</span>}
                    </div>
                    <Link to="/detect" className="mt-3 block text-xs text-cyan hover:underline">View Report →</Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl font-bold mt-1 text-${color}`}>{value}</div>
    </div>
  );
}
