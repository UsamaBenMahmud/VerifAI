import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Microscope, Users, Bot, DollarSign, Flag, Key, Settings, Link2, Presentation as PresentationIcon, Upload, Trash2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { adminAnalyses, hourly, agentPerf } from "@/lib/mockData";
import { fetchSubmissionLinks, saveSubmissionLink, validateLink, extractYouTubeId, type LinkKey } from "@/lib/submissionLinks";
import { linkSpec } from "@/lib/scoringData";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Admin — VerifAI" },
    { name: "description", content: "VerifAI admin dashboard. Analyses, users, agent performance, costs." },
  ]}),
  component: AdminPage,
});

const sideLinks = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analyses", label: "All Analyses", icon: Microscope },
  { id: "users", label: "Users", icon: Users },
  { id: "agents", label: "Agent Performance", icon: Bot },
  { id: "cost", label: "Cost & Usage", icon: DollarSign },
  { id: "flagged", label: "Flagged Reports", icon: Flag },
  { id: "presentation", label: "Presentation", icon: PresentationIcon },
  { id: "links", label: "Submission Links", icon: Link2 },
  { id: "apikeys", label: "API Keys", icon: Key },
  { id: "settings", label: "Settings", icon: Settings },
];

function AdminPage() {
  const [tab, setTab] = useState("overview");
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid md:grid-cols-[220px_1fr] gap-6 pb-24 md:pb-8">
      <aside className="hidden md:block glass rounded-xl p-3 h-fit md:sticky md:top-20">
        <div className="text-xs uppercase tracking-widest text-muted-foreground px-3 py-2">Admin</div>
        <ul className="space-y-1">
          {sideLinks.map(l => (
            <li key={l.id}>
              <button onClick={() => setTab(l.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition ${tab === l.id ? "bg-cyan/15 text-cyan border border-cyan/30" : "hover:bg-cyan/5 text-muted-foreground"}`}>
                <l.icon className="h-4 w-4" /> {l.label}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section>
        {tab === "overview" && <Overview />}
        {tab === "analyses" && <Analyses />}
        {tab === "users" && <UsersTab />}
        {tab === "agents" && <AgentsTab />}
        {tab === "cost" && <CostTab />}
        {tab === "flagged" && <FlaggedTab />}
        {tab === "presentation" && <PresentationTab />}
        {tab === "links" && <LinksTab />}
        {tab === "apikeys" && <ApiKeysTab />}
        {tab === "settings" && <SettingsTab />}
      </section>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--bg-deep)]/95 backdrop-blur">
        <div className="flex overflow-x-auto no-scrollbar">
          {sideLinks.map(l => (
            <button key={l.id} onClick={() => setTab(l.id)} className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[68px] text-[10px] shrink-0 transition ${tab === l.id ? "text-cyan" : "text-muted-foreground"}`}>
              <l.icon className="h-4 w-4" />
              <span className="truncate max-w-[64px]">{l.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LinksTab() {
  const [vals, setVals] = useState<Record<LinkKey, string>>({
    youtube: "", github: "", demo: "", figma: "", huggingface: "", api_docs: "", n8n: "",
  });
  const [saved, setSaved] = useState<Record<LinkKey, string | null>>({
    youtube: null, github: null, demo: null, figma: null, huggingface: null, api_docs: null, n8n: null,
  });
  const [busy, setBusy] = useState<LinkKey | "all" | null>(null);

  useEffect(() => {
    fetchSubmissionLinks().then((r) => {
      setSaved(r);
      setVals((v) => {
        const next = { ...v };
        (Object.keys(r) as LinkKey[]).forEach((k) => { next[k] = r[k] ?? ""; });
        return next;
      });
    });
  }, []);

  const saveOne = async (k: LinkKey) => {
    const url = vals[k].trim();
    if (url && !validateLink(k, url)) return toast.error(`Invalid URL for ${k}`);
    setBusy(k);
    const { error } = await saveSubmissionLink(k, url || null);
    setBusy(null);
    if (error) return toast.error(error.message);
    setSaved((s) => ({ ...s, [k]: url || null }));
    toast.success(`${k} saved`);
  };

  const saveAll = async () => {
    setBusy("all");
    for (const s of linkSpec) {
      const url = vals[s.key].trim();
      if (url && !validateLink(s.key, url)) { toast.error(`Invalid URL for ${s.key}`); continue; }
      await saveSubmissionLink(s.key, url || null);
    }
    const r = await fetchSubmissionLinks();
    setSaved(r);
    setBusy(null);
    toast.success("Links saved and published to scoring page");
  };

  const statusOf = (k: LinkKey) => {
    const v = vals[k].trim();
    if (!v) return saved[k] ? { tone: "safe", label: "✅ Saved" } : { tone: "warning", label: "⏳ Pending" };
    if (!validateLink(k, v)) return { tone: "danger", label: "❌ Invalid URL" };
    if (saved[k] === v) return { tone: "safe", label: "✅ Saved" };
    return { tone: "warning", label: "⏳ Unsaved changes" };
  };

  const previewFor = (k: LinkKey, url: string | null) => {
    if (!url || !validateLink(k, url)) return null;
    if (k === "youtube") {
      const id = extractYouTubeId(url);
      if (id) return <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" className="mt-2 max-w-[200px] rounded border border-[color:var(--border)]" loading="lazy" />;
    }
    try {
      const host = new URL(url).hostname;
      return (
        <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`} alt="" className="h-4 w-4" />
          <span>{host}</span>
        </div>
      );
    } catch { return null; }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Submission Links</h2>
        <p className="text-sm text-muted-foreground">Fill these in before submission. They appear live on the <Link to="/scoring" className="text-cyan hover:underline">/scoring</Link> page.</p>
      </div>
      <div className="space-y-3">
        {linkSpec.map((spec) => {
          const st = statusOf(spec.key);
          return (
            <div key={spec.key} className="glass rounded-xl p-4 space-y-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <label className="font-display font-semibold">{spec.label} <span className="text-xs text-cyan font-mono">+{spec.points}</span></label>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border bg-${st.tone}/15 text-${st.tone} border-${st.tone}/40`}>{st.label}</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={vals[spec.key]}
                  onChange={(e) => setVals({ ...vals, [spec.key]: e.target.value })}
                  placeholder={spec.helper}
                  className="flex-1 rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none"
                />
                <button onClick={() => saveOne(spec.key)} disabled={busy !== null}
                  className="rounded-md bg-cyan/15 border border-cyan/40 text-cyan px-3 py-2 text-sm hover:bg-cyan/25 disabled:opacity-50">
                  {busy === spec.key ? "..." : "Save"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">{spec.helper}</p>
              {previewFor(spec.key, vals[spec.key].trim() || saved[spec.key])}
            </div>
          );
        })}
      </div>
      <button onClick={saveAll} disabled={busy !== null}
        className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan disabled:opacity-50">
        {busy === "all" ? "Saving..." : "Save All Links"}
      </button>
    </div>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold text-cyan mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label="Total Analyses" value="1,247" />
        <KPI label="Deepfakes" value="451" sub="36%" />
        <KPI label="Authentic" value="796" sub="64%" />
        <KPI label="Avg Latency" value="4.2s" />
        <KPI label="Cost Today" value="$4.21" />
        <KPI label="Active Users" value="89" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <h3 className="font-display font-semibold mb-3">Analyses Per Hour (24h)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourly}>
              <defs><linearGradient id="g1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00E5FF" stopOpacity={0.5} /><stop offset="100%" stopColor="#00E5FF" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="rgba(0,229,255,0.08)" />
              <XAxis dataKey="hr" tick={{ fill: "#8899BB", fontSize: 10 }} />
              <YAxis tick={{ fill: "#8899BB", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#141B2D", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="runs" stroke="#00E5FF" fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-display font-semibold mb-3">Agent Accuracy Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={agentPerf}>
              <CartesianGrid stroke="rgba(0,229,255,0.08)" />
              <XAxis dataKey="agent" tick={{ fill: "#8899BB", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8899BB", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#141B2D", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }} />
              <Bar dataKey="accuracy" fill="#00E5FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-xl p-5">
        <h3 className="font-display font-semibold mb-3">Cost Per Analysis Trend</h3>
        <div className="h-32 relative">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-warning/50" />
          <div className="absolute right-2 top-[calc(50%-12px)] text-xs text-warning">Target: ৳2</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourly.map(h => ({ ...h, cost: 1.4 + Math.random() * 1.2 }))}>
              <defs><linearGradient id="g2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00C896" stopOpacity={0.5} /><stop offset="100%" stopColor="#00C896" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="hr" hide />
              <YAxis hide domain={[0, 3]} />
              <Area type="monotone" dataKey="cost" stroke="#00C896" fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Analyses() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">All Analyses</h2>
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--bg-surface)]/60 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="text-left px-3 py-3">ID</th><th className="text-left px-3 py-3">User</th><th className="text-left px-3 py-3">Type</th><th className="text-left px-3 py-3">Trust</th><th className="text-left px-3 py-3 hidden lg:table-cell">Vision</th><th className="text-left px-3 py-3 hidden lg:table-cell">Meta</th><th className="text-left px-3 py-3 hidden lg:table-cell">Context</th><th className="text-left px-3 py-3 hidden lg:table-cell">Reason</th><th className="text-left px-3 py-3">Dur</th><th className="text-left px-3 py-3">Cost</th><th className="text-left px-3 py-3 hidden md:table-cell">Time</th></tr>
          </thead>
          <tbody>
            {adminAnalyses.map(r => (
              <tr key={r.id} className="border-t border-[color:var(--border)] hover:bg-cyan/5">
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.user}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2"><span className={`text-xs font-bold ${r.trustScore < 30 ? "text-danger" : r.trustScore < 60 ? "text-warning" : "text-safe"}`}>{r.trustScore}</span></td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{r.vision}</td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{r.metadata}</td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{r.context}</td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{r.reasoning}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.duration}</td>
                <td className="px-3 py-2 font-mono text-xs">৳{r.costBdt}</td>
                <td className="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">{r.ts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const users = Array.from({ length: 8 }, (_, i) => ({
    id: `usr_${(Math.random().toString(36).slice(2, 9))}`,
    role: ["citizen", "journalist", "admin", "api-user"][i % 4],
    runs: Math.round(Math.random() * 200),
    plan: ["Free", "Pro", "Org", "Free"][i % 4],
    joined: `2026-0${1 + (i % 5)}-${10 + i}`,
    last: `${1 + i}h ago`,
  }));
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Users</h2>
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--bg-surface)]/60 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="text-left px-3 py-3">User ID</th><th className="text-left px-3 py-3">Role</th><th className="text-left px-3 py-3">Runs</th><th className="text-left px-3 py-3">Plan</th><th className="text-left px-3 py-3 hidden md:table-cell">Joined</th><th className="text-left px-3 py-3">Last Active</th></tr>
          </thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-t border-[color:var(--border)] hover:bg-cyan/5">
              <td className="px-3 py-2 font-mono text-xs">{u.id}</td>
              <td className="px-3 py-2"><span className="text-xs px-2 py-1 rounded border border-[color:var(--border)]">{u.role}</span></td>
              <td className="px-3 py-2">{u.runs}</td>
              <td className="px-3 py-2 text-cyan">{u.plan}</td>
              <td className="px-3 py-2 hidden md:table-cell text-muted-foreground text-xs">{u.joined}</td>
              <td className="px-3 py-2 text-muted-foreground text-xs">{u.last}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function AgentsTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Agent Performance</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {agentPerf.map(a => (
          <div key={a.agent} className="glass rounded-xl p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg font-semibold">{a.agent} Agent</h3>
              <span className="text-cyan text-2xl font-bold">{a.accuracy}%</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Latency</div><div className="font-mono text-lg">{a.latency}s</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Errors</div><div className="font-mono text-lg text-warning">{a.errors}%</div></div>
              <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Last 100</div><div className="font-mono text-lg text-safe">↑</div></div>
            </div>
            <div className="mt-4 h-16 flex items-end gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => <div key={i} className="flex-1 bg-cyan/40 rounded-sm" style={{ height: `${30 + Math.random() * 70}%` }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Cost & Usage</h2>
      <div className="grid grid-cols-3 gap-3">
        <KPI label="Cost Today" value="$4.21" sub="497 calls" />
        <KPI label="Cost This Month" value="$87.42" />
        <KPI label="Avg / Analysis" value="৳1.84" sub="Target: ৳2" />
      </div>
      <div className="glass rounded-xl p-5">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={hourly}>
            <defs><linearGradient id="g3" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7B2FFF" stopOpacity={0.5} /><stop offset="100%" stopColor="#7B2FFF" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="rgba(0,229,255,0.08)" />
            <XAxis dataKey="hr" tick={{ fill: "#8899BB", fontSize: 10 }} />
            <YAxis tick={{ fill: "#8899BB", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#141B2D", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }} />
            <Area dataKey="runs" stroke="#7B2FFF" fill="url(#g3)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FlaggedTab() {
  const initial = [
    { id: "VAI-2026-0847", who: "Public figure (politician)", score: 8, category: "Political", source: "bdnews-fake.xyz", credibility: 8, status: "pending" as Status },
    { id: "VAI-2026-0844", who: "Central bank governor (voice)", score: 17, category: "Financial", source: "fakenews-bd.com", credibility: 12, status: "pending" as Status },
    { id: "VAI-2026-0840", who: "News anchor", score: 34, category: "Media", source: "viral-bd.net", credibility: 24, status: "pending" as Status },
    { id: "VAI-2026-0836", who: "Cricket celebrity", score: 22, category: "Celebrity", source: "fbpage_unverified", credibility: 18, status: "pending" as Status },
  ];
  type Status = "pending" | "verified" | "authentic" | "hidden";
  type Item = typeof initial[number];
  const [items, setItems] = useState<Item[]>(initial);
  const categories = ["Political", "Financial", "Media", "Celebrity", "Personal", "Other"];

  const update = (id: string, patch: Partial<Item>) => {
    setItems(items.map(it => it.id === id ? { ...it, ...patch } : it));
    toast.success("Updated " + id);
  };

  const visible = items.filter(it => it.status !== "hidden");
  const hiddenCount = items.length - visible.length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl font-bold">Flagged Reports</h2>
          <p className="text-sm text-muted-foreground">Queue: trust score &lt; 35 on public figures requires human review.</p>
        </div>
        {hiddenCount > 0 && (
          <button onClick={() => setItems(items.map(i => i.status === "hidden" ? { ...i, status: "pending" } : i))} className="text-xs text-cyan hover:underline">Restore {hiddenCount} hidden</button>
        )}
      </div>
      {visible.map(it => (
        <div key={it.id} className="glass rounded-xl p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-24 rounded bg-gradient-to-br from-danger/20 to-violet/20 border border-danger/30" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-cyan">{it.id}</span>
                <StatusBadge status={it.status} />
              </div>
              <div className="font-display mt-1">{it.who}</div>
              <div className="text-xs text-muted-foreground">Trust score: <span className="text-danger font-bold">{it.score}/100</span> · Source: <span className="font-mono text-cyan">{it.source}</span></div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="text-muted-foreground uppercase tracking-widest">Category</span>
              <select value={it.category} onChange={e => update(it.id, { category: e.target.value })} className="mt-1 w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-2 py-1.5 text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground uppercase tracking-widest">Source credibility: <span className={it.credibility < 30 ? "text-danger" : it.credibility < 60 ? "text-warning" : "text-safe"}>{it.credibility}/100</span></span>
              <input type="range" min={0} max={100} value={it.credibility} onChange={e => update(it.id, { credibility: Number(e.target.value) })} className="mt-1 w-full accent-cyan" />
            </label>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => update(it.id, { status: "verified" })} className="rounded-md bg-danger px-3 py-1.5 text-sm text-white">✓ Verify Deepfake</button>
            <button onClick={() => update(it.id, { status: "authentic" })} className="rounded-md border border-safe text-safe px-3 py-1.5 text-sm hover:bg-safe/10">Mark Authentic</button>
            <button onClick={() => update(it.id, { status: "hidden" })} className="rounded-md border border-warning text-warning px-3 py-1.5 text-sm hover:bg-warning/10">Hide from feed</button>
            <button onClick={() => { navigator.clipboard?.writeText(it.id); toast.success("ID copied"); }} className="rounded-md border border-cyan/40 text-cyan px-3 py-1.5 text-sm hover:bg-cyan/10">Copy ID</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "verified" | "authentic" | "hidden" }) {
  const map = {
    pending: { c: "warning", l: "Pending review" },
    verified: { c: "danger", l: "✓ Verified deepfake" },
    authentic: { c: "safe", l: "Authentic" },
    hidden: { c: "muted", l: "Hidden" },
  } as const;
  const s = map[status];
  return <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded bg-${s.c}/20 text-${s.c} border border-${s.c}/30`}>{s.l}</span>;
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<import("@/lib/localStore").ApiKey[]>([]);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<"free" | "journalist" | "enterprise">("free");
  const [justCreated, setJustCreated] = useState<import("@/lib/localStore").ApiKey | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [codeTab, setCodeTab] = useState<"curl" | "python" | "js" | "bn">("curl");

  useEffect(() => {
    import("@/lib/localStore").then((m) => setKeys(m.getApiKeys()));
  }, []);

  const persist = (next: import("@/lib/localStore").ApiKey[]) => {
    setKeys(next);
    import("@/lib/localStore").then((m) => m.saveApiKeys(next));
  };

  const generate = async () => {
    if (!name.trim()) return toast.error("Enter a key name");
    const mod = await import("@/lib/localStore");
    const k = mod.generateApiKey(name.trim(), plan);
    const next = [k, ...keys];
    persist(next);
    setJustCreated(k);
    setName("");
    toast.success("API key generated");
  };

  const toggleReveal = (id: string) => {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
    setTimeout(() => setRevealed((r) => ({ ...r, [id]: false })), 5000);
  };
  const copyKey = (key: string) => { navigator.clipboard?.writeText(key); toast.success("Copied"); };
  const toggleActive = (id: string) => persist(keys.map((k) => k.id === id ? { ...k, is_active: !k.is_active } : k));
  const remove = (id: string) => { if (confirm("Delete this key?")) persist(keys.filter((k) => k.id !== id)); };
  const simulate = (id: string) => persist(keys.map((k) => k.id === id
    ? { ...k, requests_today: k.requests_today + 1, requests_total: k.requests_total + 1, last_used: new Date().toISOString() } : k));

  const mask = (key: string) => `${key.slice(0, 5)}${"•".repeat(16)}`;
  const stats = { total: keys.length, active: keys.filter((k) => k.is_active).length, today: keys.reduce((s, k) => s + k.requests_today, 0) };

  const codeSamples = {
    curl: `curl -X POST "https://api.verifai.app/v1/analyze" \\
  -H "Authorization: Bearer vfai_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_url": "https://example.com/image.jpg"}'`,
    python: `import requests

response = requests.post(
    "https://api.verifai.app/v1/analyze",
    headers={"Authorization": "Bearer vfai_YOUR_KEY"},
    json={"image_url": "https://example.com/image.jpg"}
)
result = response.json()
print(f"Trust Score: {result['trust_score']}/100")
print(f"Verdict: {result['verdict_bn']}")`,
    js: `const response = await fetch("https://api.verifai.app/v1/analyze", {
  method: "POST",
  headers: {
    "Authorization": "Bearer vfai_YOUR_KEY",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ image_url: "https://example.com/image.jpg" })
});
const result = await response.json();
console.log(\`Trust Score: \${result.trust_score}/100\`);`,
    bn: `# আপনার API কী ব্যবহার করে যেকোনো ছবি বিশ্লেষণ করুন।
# Authorization হেডারে আপনার কী যোগ করুন।

curl -X POST "https://api.verifai.app/v1/analyze" \\
  -H "Authorization: Bearer vfai_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_url": "https://example.com/image.jpg"}'`,
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">API Keys</h2>

      {/* Generator */}
      <div className="glass rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold">Generate New API Key</h3>
        <div className="grid sm:grid-cols-[1fr_180px_140px] gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Key name (e.g. My App, Rumor Scanner Integration)"
            className="rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2 text-sm focus:border-cyan outline-none" />
          <select value={plan} onChange={(e) => setPlan(e.target.value as any)}
            className="rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2 text-sm focus:border-cyan outline-none">
            <option value="free">Free (100/day)</option>
            <option value="journalist">Journalist (1,000/day)</option>
            <option value="enterprise">Enterprise (10,000/day)</option>
          </select>
          <button onClick={generate} className="rounded-md bg-cyan px-3 py-2 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan">+ Generate Key</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <KPI label="Total Keys" value={String(stats.total)} />
        <KPI label="Active Keys" value={String(stats.active)} />
        <KPI label="Requests Today" value={String(stats.today)} />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-[color:var(--bg-surface)]/60 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-3">Name</th>
              <th className="text-left px-3 py-3">Key</th>
              <th className="text-left px-3 py-3">Plan</th>
              <th className="text-left px-3 py-3">Usage</th>
              <th className="text-left px-3 py-3">Created</th>
              <th className="text-left px-3 py-3">Status</th>
              <th className="text-left px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">🔑 No API keys yet — generate your first one above</td></tr>
            ) : keys.map((k) => {
              const pct = (k.requests_today / k.rate_limit) * 100;
              const barColor = pct > 80 ? "bg-danger" : pct > 50 ? "bg-warning" : "bg-safe";
              return (
                <tr key={k.id} className="border-t border-[color:var(--border)] hover:bg-cyan/5">
                  <td className="px-3 py-3">{k.name}</td>
                  <td className="px-3 py-3 font-mono text-xs text-cyan">{revealed[k.id] ? k.key : mask(k.key)}</td>
                  <td className="px-3 py-3"><span className="text-[10px] px-2 py-0.5 rounded border border-cyan/40 text-cyan uppercase font-mono">{k.plan}</span></td>
                  <td className="px-3 py-3 min-w-[140px]">
                    <div className="text-xs font-mono">{k.requests_today} / {k.rate_limit}</div>
                    <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{k.requests_total} total</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3">{k.is_active
                    ? <span className="text-[10px] text-safe">● Active</span>
                    : <span className="text-[10px] text-muted-foreground">○ Disabled</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap text-[11px]">
                      <button onClick={() => toggleReveal(k.id)} className="px-2 py-1 rounded border border-cyan/40 text-cyan hover:bg-cyan/10">👁</button>
                      <button onClick={() => copyKey(k.key)} className="px-2 py-1 rounded border border-cyan/40 text-cyan hover:bg-cyan/10">📋</button>
                      <button onClick={() => toggleActive(k.id)} className="px-2 py-1 rounded border border-warning/40 text-warning hover:bg-warning/10">{k.is_active ? "⏸" : "▶"}</button>
                      <button onClick={() => simulate(k.id)} className="px-2 py-1 rounded border border-violet/40 text-violet hover:bg-violet/10">+1</button>
                      <button onClick={() => remove(k.id)} className="px-2 py-1 rounded border border-danger/40 text-danger hover:bg-danger/10">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Code examples */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-display font-semibold mb-3">Code Examples</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          {(["curl", "python", "js", "bn"] as const).map((c) => (
            <button key={c} onClick={() => setCodeTab(c)}
              className={`rounded-full border px-3 py-1 text-xs ${codeTab === c ? "border-cyan bg-cyan/15 text-cyan" : "border-[color:var(--border)]"}`}>
              {c === "curl" ? "cURL" : c === "python" ? "Python" : c === "js" ? "JavaScript" : "Bangla (বাংলা)"}
            </button>
          ))}
        </div>
        <pre className="bg-[color:var(--bg-deep)] rounded-md p-3 text-xs font-mono text-cyan/90 overflow-x-auto"><code>{codeSamples[codeTab]}</code></pre>
      </div>

      {/* Success modal */}
      {justCreated && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={() => setJustCreated(null)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold">🔑 API Key Generated</h3>
            <div className="mt-3 rounded-md bg-warning/10 border border-warning/40 p-3 text-xs text-warning">
              ⚠️ Copy this key now. You won't be able to see it again.
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md bg-[color:var(--bg-deep)] border border-cyan/30 p-3">
              <code className="font-mono text-xs text-cyan break-all flex-1">{justCreated.key}</code>
              <button onClick={() => copyKey(justCreated.key)} className="rounded-md bg-cyan/15 border border-cyan/40 text-cyan px-2 py-1 text-xs">📋 Copy</button>
            </div>
            <button onClick={() => setJustCreated(null)} className="mt-4 w-full rounded-md bg-cyan py-2 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan">I've saved my key</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Settings</h2>
      <div className="glass rounded-xl p-5 space-y-4">
        {[
          { l: "Auto-delete uploads after 24h", on: true },
          { l: "Require human review for trust score < 20", on: true },
          { l: "Telegram bot notifications", on: false },
          { l: "Enable C2PA watermark verification", on: true },
        ].map(s => (
          <div key={s.l} className="flex items-center justify-between border-b border-[color:var(--border)] pb-3 last:border-0">
            <span>{s.l}</span>
            <div className={`h-6 w-11 rounded-full p-0.5 ${s.on ? "bg-cyan" : "bg-muted"}`}><div className={`h-5 w-5 rounded-full bg-white transition ${s.on ? "translate-x-5" : ""}`} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PresentationTab() {
  const [data, setData] = useState<string | null>(null);
  const [meta, setMeta] = useState<import("@/lib/localStore").PresentationMeta | null>(null);
  const [slideCount, setSlideCountLocal] = useState(8);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    import("@/lib/localStore").then((m) => {
      const p = m.getPresentation();
      setData(p.data); setMeta(p.meta); setSlideCountLocal(p.slides);
    });
  }, []);

  const onUpload = async (f: File) => {
    if (f.size > 100 * 1024 * 1024) return toast.error("File too large (max 100MB)");
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "pptx") return toast.error("Only .pptx or .pdf");
    setBusy(true);
    try {
      const mod = await import("@/lib/localStore");
      const b64 = await mod.fileToBase64(f);
      const newMeta: import("@/lib/localStore").PresentationMeta = {
        filename: f.name, uploadedAt: Date.now(), fileType: ext as "pdf" | "pptx", size: f.size,
      };
      mod.setPresentation(b64, newMeta);
      setData(b64); setMeta(newMeta);
      toast.success(`✅ Presentation uploaded — ${slideCount} slides ready`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onSlides = (n: number) => {
    setSlideCountLocal(n);
    import("@/lib/localStore").then((m) => m.setSlideCount(n));
  };

  const onClear = async () => {
    if (!confirm("Remove presentation?")) return;
    const mod = await import("@/lib/localStore");
    mod.clearPresentation();
    setData(null); setMeta(null);
    toast.success("Presentation cleared");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Presentation</h2>
        <p className="text-sm text-muted-foreground">Upload the slide deck (PPTX or PDF, max 100MB). It appears live on the <Link to="/docs" className="text-cyan hover:underline">Docs → Presentation</Link> tab for all visitors.</p>
      </div>

      {meta && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 flex-wrap">
          <FileText className="h-6 w-6 text-cyan" />
          <div className="flex-1 min-w-0">
            <div className="font-display truncate">{meta.filename}</div>
            <div className="text-xs text-muted-foreground">
              {(meta.size / 1024 / 1024).toFixed(2)} MB · {meta.fileType.toUpperCase()} · uploaded {new Date(meta.uploadedAt).toLocaleString()}
            </div>
          </div>
          <button onClick={onClear} className="inline-flex items-center gap-1 text-xs text-danger hover:underline">
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      <label className="block border-2 border-dashed border-cyan/40 rounded-xl p-8 text-center cursor-pointer hover:bg-cyan/5">
        <Upload className="h-6 w-6 text-cyan mx-auto" />
        <div className="mt-2 font-display font-semibold">{busy ? "Uploading…" : "Upload PPTX / PDF"}</div>
        <div className="text-xs text-muted-foreground">Max 100MB · Replaces current deck</div>
        <input type="file" accept=".pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="hidden" disabled={busy}
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      </label>

      <div className="glass rounded-xl p-4 flex items-center gap-3">
        <label className="text-sm font-semibold">How many slides?</label>
        <input type="number" min={1} max={100} value={slideCount} onChange={(e) => onSlides(Number(e.target.value))}
          className="w-24 rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-1.5 text-sm" />
        <span className="text-xs text-muted-foreground">Shown as numbered slide cards on the public Docs page</span>
      </div>

      {data && meta?.fileType === "pdf" && (
        <div className="glass rounded-xl p-2">
          <iframe src={data} className="w-full h-[60vh] rounded bg-black" title="Preview" />
        </div>
      )}
    </div>
  );
}
