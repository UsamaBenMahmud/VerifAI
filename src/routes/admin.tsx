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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid md:grid-cols-[220px_1fr] gap-6">
      <aside className="glass rounded-xl p-3 h-fit md:sticky md:top-20">
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
  const keys = [
    { name: "Rumor Scanner BD", key: "vai_live_••••8a2f", usage: "12,432", limit: "100k/mo" },
    { name: "Prothom Alo Newsroom", key: "vai_live_••••3c1d", usage: "4,201", limit: "50k/mo" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">API Keys</h2><button className="rounded-md bg-cyan px-3 py-2 text-sm text-[color:var(--bg-deep)] font-semibold glow-cyan">Generate Key</button></div>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--bg-surface)]/60 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="text-left px-3 py-3">Name</th><th className="text-left px-3 py-3">Key</th><th className="text-left px-3 py-3">Usage</th><th className="text-left px-3 py-3">Rate Limit</th><th className="text-left px-3 py-3">Actions</th></tr>
          </thead>
          <tbody>{keys.map(k => (
            <tr key={k.key} className="border-t border-[color:var(--border)]">
              <td className="px-3 py-2">{k.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-cyan">{k.key}</td>
              <td className="px-3 py-2">{k.usage}</td>
              <td className="px-3 py-2">{k.limit}</td>
              <td className="px-3 py-2"><button className="text-xs text-danger hover:underline">Revoke</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
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
