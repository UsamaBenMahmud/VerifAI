import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Search } from "lucide-react";
import { trendingDeepfakes, dailyDetections, categoryBreakdown } from "@/lib/mockData";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Live Threat Dashboard — VerifAI" },
    { name: "description", content: "Real-time deepfake detection data for Bangladesh and South Asia." },
    { property: "og:title", content: "VerifAI Live Threat Dashboard" },
    { property: "og:description", content: "Trending deepfakes, category breakdown, and source credibility graph." },
  ]}),
  component: Dashboard,
});

function Dashboard() {
  const { lang } = useLang();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const rows = useMemo(() => trendingDeepfakes.filter(r =>
    (cat === "All" || r.category === cat) &&
    (q === "" || (lang === "bn" ? r.titleBn : r.title).toLowerCase().includes(q.toLowerCase()) || r.source.includes(q))
  ), [q, cat, lang]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Live Threat Intelligence Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time deepfake detection data for Bangladesh and South Asia.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { n: "247", l: "Analyzed Today", icon: "📊", c: "text-cyan" },
          { n: "89", l: "Deepfakes Detected", icon: "🔴", c: "text-danger" },
          { n: "36%", l: "Detection Rate", icon: "📈", c: "text-warning" },
          { n: "4.2s", l: "Avg Speed", icon: "⚡", c: "text-cyan" },
          { n: "৳1.84", l: "Avg Cost", icon: "💰", c: "text-safe" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-xl p-4">
            <div className="text-lg">{s.icon}</div>
            <div className={`font-display text-2xl font-bold ${s.c}`}>{s.n}</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <div className="glass rounded-xl p-5">
          <h3 className="font-display font-semibold mb-3">Deepfakes Detected Per Day (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailyDetections}>
              <CartesianGrid stroke="rgba(0,229,255,0.08)" />
              <XAxis dataKey="day" tick={{ fill: "#8899BB", fontSize: 10 }} />
              <YAxis tick={{ fill: "#8899BB", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#141B2D", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="detected" stroke="#00E5FF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="authentic" stroke="#00C896" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-xl p-5">
          <h3 className="font-display font-semibold mb-3">Category Breakdown (7 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid stroke="rgba(0,229,255,0.08)" />
              <XAxis dataKey="name" tick={{ fill: "#8899BB", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8899BB", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#141B2D", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Political" stackId="a" fill="#00E5FF" />
              <Bar dataKey="Harassment" stackId="a" fill="#FF3B5C" />
              <Bar dataKey="Commercial" stackId="a" fill="#7B2FFF" />
              <Bar dataKey="Unknown" stackId="a" fill="#FFB830" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: "🏛️", l: "Political", v: "34%", c: "text-cyan" },
          { icon: "👤", l: "Harassment/NCII", v: "28%", c: "text-danger" },
          { icon: "📢", l: "Commercial Fraud", v: "22%", c: "text-violet" },
          { icon: "❓", l: "Unclassified", v: "16%", c: "text-warning" },
        ].map((c) => (
          <div key={c.l} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="text-2xl">{c.icon}</div>
            <div><div className={`font-display text-xl font-bold ${c.c}`}>{c.v}</div><div className="text-xs text-muted-foreground">{c.l}</div></div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-[color:var(--border)]">
          <h3 className="font-display font-semibold mr-auto">Trending Deepfakes</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-md pl-8 pr-3 py-2 text-sm focus:border-cyan outline-none" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:border-cyan outline-none">
            {["All", "Political", "Harassment", "Commercial", "Unknown"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--bg-surface)]/60 text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="text-left px-4 py-3">Content</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Trust</th><th className="text-left px-4 py-3 hidden md:table-cell">Source</th><th className="text-left px-4 py-3 hidden md:table-cell">First Seen</th><th className="text-left px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-[color:var(--border)] hover:bg-cyan/5">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-9 w-12 rounded bg-gradient-to-br from-cyan/20 to-violet/20 border border-cyan/30 shrink-0" /><div className="min-w-0"><div className="truncate max-w-[240px]">{lang === "bn" ? r.titleBn : r.title}</div><div className="text-xs text-muted-foreground font-mono">{r.id}</div></div></div></td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded border border-[color:var(--border)]">{r.category}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded ${r.trustScore < 30 ? "bg-danger/15 text-danger" : r.trustScore < 60 ? "bg-warning/15 text-warning" : "bg-safe/15 text-safe"}`}>{r.trustScore}/100</span></td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">{r.source}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.detectedAt}</td>
                  <td className="px-4 py-3"><span className={`text-xs ${r.status === "Authentic" ? "text-safe" : r.status === "Pending Review" ? "text-warning" : "text-danger"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-xl p-5 mt-8">
        <h3 className="font-display font-semibold mb-4">Knowledge Graph Preview</h3>
        <svg viewBox="0 0 800 300" className="w-full h-72">
          {/* edges */}
          {[
            [400, 150, 200, 80], [400, 150, 200, 220], [400, 150, 600, 80], [400, 150, 600, 220],
            [200, 80, 80, 40], [200, 80, 100, 150], [600, 80, 720, 40], [600, 220, 720, 260], [200, 220, 100, 270],
          ].map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,229,255,0.25)" strokeWidth="1" />)}
          {[
            { x: 400, y: 150, r: 28, label: "Claim", c: "#7B2FFF" },
            { x: 200, y: 80, r: 22, label: "src1", c: "#00E5FF" },
            { x: 200, y: 220, r: 22, label: "src2", c: "#00E5FF" },
            { x: 600, y: 80, r: 22, label: "src3", c: "#FF3B5C" },
            { x: 600, y: 220, r: 22, label: "src4", c: "#FFB830" },
            { x: 80, y: 40, r: 14, label: "ev", c: "#00C896" },
            { x: 100, y: 150, r: 14, label: "ev", c: "#00C896" },
            { x: 720, y: 40, r: 14, label: "ev", c: "#FF3B5C" },
            { x: 720, y: 260, r: 14, label: "ev", c: "#FFB830" },
            { x: 100, y: 270, r: 14, label: "ev", c: "#00C896" },
          ].map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={n.r} fill={`${n.c}33`} stroke={n.c} strokeWidth="1.5" />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fill="#F0F4FF" fontSize="10">{n.label}</text>
            </g>
          ))}
        </svg>
        <p className="text-xs text-center text-muted-foreground">Interactive graph showing interconnected sources, claims, and evidence (Neo4j-powered in production).</p>
      </div>
    </div>
  );
}
