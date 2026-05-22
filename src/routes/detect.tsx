import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Camera, Link as LinkIcon, FileText, Share2, Flag, Code2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/detect")({
  head: () => ({ meta: [
    { title: "Detect — VerifAI" },
    { name: "description", content: "Upload a video, image, or URL and get a deepfake trust score in 6 seconds." },
    { property: "og:title", content: "VerifAI — Analyze Content" },
    { property: "og:description", content: "Multi-agent deepfake analysis with Bangla + English reasoning." },
  ]}),
  component: DetectPage,
});

type Stage = "idle" | "analyzing" | "results";

const agents = [
  { name: "Vision Agent", desc: "Scanning face artifacts..." },
  { name: "Metadata Agent", desc: "Checking EXIF & watermarks..." },
  { name: "Context Agent", desc: "Searching knowledge graph..." },
  { name: "Reasoning Agent", desc: "Generating Bangla explanation..." },
];

function DetectPage() {
  const { lang } = useLang();
  const [stage, setStage] = useState<Stage>("idle");
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showAgents, setShowAgents] = useState(false);

  const start = () => {
    setStage("analyzing"); setStep(0); setElapsed(0);
    const t0 = Date.now();
    const ti = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100);
    const steps = [900, 1700, 2500, 3300];
    steps.forEach((ms, i) => setTimeout(() => setStep(i + 1), ms));
    setTimeout(() => { clearInterval(ti); setStage("results"); }, 4000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Analyze Content</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload media to run the 4-agent verification pipeline.</p>
        </div>
      </div>

      {stage === "idle" && (
        <div className="glass rounded-2xl p-8 sm:p-12">
          <div onClick={start} className="cursor-pointer border-2 border-dashed border-cyan/40 rounded-xl p-12 text-center hover:border-cyan hover:bg-cyan/5 transition group">
            <Upload className="h-12 w-12 text-cyan mx-auto mb-4 group-hover:scale-110 transition" />
            <p className="font-display text-xl">Drop video, image, or paste URL here</p>
            <p className="mt-2 text-sm text-muted-foreground">MP4 · AVI · MOV · JPG · PNG · WEBP · URLs</p>
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <button onClick={(e) => { e.stopPropagation(); start(); }} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><Camera className="h-4 w-4" /> Use Live Camera</button>
              <button onClick={(e) => { e.stopPropagation(); start(); }} className="inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-semibold glow-cyan"><Upload className="h-4 w-4" /> Upload File</button>
              <button onClick={(e) => { e.stopPropagation(); start(); }} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><LinkIcon className="h-4 w-4" /> Paste URL</button>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">🔒 Your upload is encrypted and auto-deleted in 24 hours. We never store your face.</p>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="glass rounded-2xl p-8">
          <h2 className="font-display text-2xl text-center">VerifAI is analyzing<span className="text-cyan animate-pulse">...</span></h2>
          <div className="mt-8 space-y-3">
            {agents.map((a, i) => {
              const done = step > i;
              const active = step === i;
              return (
                <div key={a.name} className={`flex items-center gap-4 rounded-lg p-4 border transition ${done ? "border-safe/40 bg-safe/5" : active ? "border-cyan/60 bg-cyan/5 glow-cyan" : "border-[color:var(--border)] opacity-50"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-mono text-xs shrink-0 ${done ? "bg-safe text-[color:var(--bg-deep)]" : active ? "bg-cyan text-[color:var(--bg-deep)] animate-pulse" : "bg-muted text-muted-foreground"}`}>{done ? "✓" : i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.desc}</div>
                  </div>
                  {done && <span className="text-xs text-safe font-mono uppercase tracking-widest">complete</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-6 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan to-violet transition-all" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="mt-3 text-center text-xs font-mono text-muted-foreground">{elapsed.toFixed(1)}s elapsed...</div>
        </div>
      )}

      {stage === "results" && (
        <div className="space-y-6">
          {/* Trust Gauge */}
          <div className="glass rounded-2xl p-8 grid md:grid-cols-[260px_1fr] gap-8 items-center">
            <TrustGauge score={12} />
            <div>
              <div className="text-xs uppercase tracking-widest text-danger font-mono">⚠️ High Probability</div>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold">Likely Deepfake</h2>
              <p className="mt-1 text-cyan font-bangla text-lg">উচ্চ সম্ভাবনা: ডিপফেক</p>
              <p className="mt-3 text-sm text-muted-foreground font-mono">Confidence: 94.2% ± 3.1%</p>
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                {[
                  { l: "Vision", v: "89% suspicious", bad: true },
                  { l: "Metadata", v: "No C2PA credentials", bad: true },
                  { l: "Context", v: "7 similar known", bad: true },
                  { l: "Audio Sync", v: "Mismatch detected", bad: true },
                ].map((s) => (
                  <div key={s.l} className="rounded-md border border-[color:var(--border)] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
                    <div className="text-sm text-danger">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Face heatmap */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-3">Face Manipulation Heatmap</h3>
            <div className="relative mx-auto h-64 w-64 rounded-lg border border-cyan/30 bg-gradient-to-br from-[color:var(--bg-surface)] to-[color:var(--bg-card)] overflow-hidden">
              <svg viewBox="0 0 200 200" className="absolute inset-0 m-auto h-full w-full opacity-90">
                <path d="M100 50 C 70 50, 55 75, 55 110 C 55 145, 75 170, 100 170 C 125 170, 145 145, 145 110 C 145 75, 130 50, 100 50 Z" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" />
                <ellipse cx="100" cy="140" rx="35" ry="20" fill="rgba(255,59,92,0.55)" />
                <ellipse cx="100" cy="155" rx="22" ry="10" fill="rgba(255,59,92,0.75)" />
                <ellipse cx="100" cy="125" rx="40" ry="8" fill="rgba(255,184,48,0.45)" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-center text-muted-foreground">Lip region <span className="text-danger font-semibold">89%</span> · Jaw boundary <span className="text-warning font-semibold">71%</span></p>
          </div>

          {/* Agent transparency */}
          <div className="glass rounded-2xl">
            <button onClick={() => setShowAgents(!showAgents)} className="w-full flex items-center justify-between p-6">
              <h3 className="font-display text-lg font-semibold">How did we reach this score?</h3>
              <ChevronDown className={`h-5 w-5 transition ${showAgents ? "rotate-180" : ""}`} />
            </button>
            {showAgents && (
              <div className="px-6 pb-6 space-y-3 text-sm">
                {[
                  { a: "Vision Agent", t: "EfficientNet-B4 detected frequency anomalies in 3 facial regions. Xception cross-validation: AGREE." },
                  { a: "Metadata Agent", t: "No SynthID watermark. C2PA credentials absent. EXIF creation timestamp inconsistent with upload date." },
                  { a: "Context Agent", t: "Matched 7 similar deepfakes in knowledge graph. Original source domain credibility score: 8/100." },
                  { a: "Reasoning Agent (Claude)", t: "Combined evidence indicates synthetic generation with high probability. Recommend flagging for human review and notifying source authority." },
                ].map((x) => (
                  <div key={x.a} className="rounded-md border-l-2 border-cyan bg-cyan/5 p-3">
                    <div className="text-xs uppercase tracking-widest text-cyan font-mono">{x.a}</div>
                    <div className="mt-1 text-foreground/90">{x.t}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Explanation cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 border-l-4 border-cyan">
              <div className="text-xs uppercase tracking-widest text-cyan font-mono mb-2">বাংলা ব্যাখ্যা</div>
              <p className="font-bangla text-base leading-relaxed">এই ভিডিওতে ঠোঁটের নড়াচড়া এবং অডিও সিঙ্কে অসঙ্গতি রয়েছে। মুখের নিচের অংশে frequency anomaly শনাক্ত করা হয়েছে। উৎস ডোমেইনের বিশ্বাসযোগ্যতা স্কোর মাত্র ৮/১০০। এই কনটেন্টটি ৭টি পরিচিত অপপ্রচার অভিযানের সাথে মিলে যায়।</p>
            </div>
            <div className="glass rounded-2xl p-6 border-l-4 border-violet">
              <div className="text-xs uppercase tracking-widest text-violet font-mono mb-2">English Explanation</div>
              <p className="text-base leading-relaxed">The video shows lip movement inconsistent with audio track. Frequency anomalies detected in lower face region. Source domain credibility score: 8/100. Pattern matches 7 known disinformation campaigns.</p>
            </div>
          </div>

          {/* Source credibility graph */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Source Credibility Graph</h3>
            <svg viewBox="0 0 600 220" className="w-full h-56">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10" fill="rgba(0,229,255,0.6)" /></marker>
              </defs>
              <line x1="80" y1="110" x2="220" y2="110" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="280" y1="110" x2="420" y2="60" stroke="rgba(255,59,92,0.4)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="280" y1="110" x2="420" y2="160" stroke="rgba(255,184,48,0.4)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <circle cx="60" cy="110" r="28" fill="rgba(0,229,255,0.15)" stroke="#00E5FF" /><text x="60" y="115" textAnchor="middle" fill="#F0F4FF" fontSize="11">Video</text>
              <circle cx="250" cy="110" r="34" fill="rgba(123,47,255,0.15)" stroke="#7B2FFF" /><text x="250" y="108" textAnchor="middle" fill="#F0F4FF" fontSize="10">bdnews-</text><text x="250" y="120" textAnchor="middle" fill="#F0F4FF" fontSize="10">fake.xyz</text>
              <circle cx="450" cy="60" r="32" fill="rgba(255,59,92,0.15)" stroke="#FF3B5C" /><text x="450" y="58" textAnchor="middle" fill="#F0F4FF" fontSize="10">Cred</text><text x="450" y="70" textAnchor="middle" fill="#FF3B5C" fontSize="14" fontWeight="bold">8/100</text>
              <circle cx="450" cy="160" r="32" fill="rgba(255,184,48,0.15)" stroke="#FFB830" /><text x="450" y="158" textAnchor="middle" fill="#F0F4FF" fontSize="10">Campaigns</text><text x="450" y="172" textAnchor="middle" fill="#FFB830" fontSize="14" fontWeight="bold">7</text>
            </svg>
          </div>

          {/* Similar */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-3">Similar Known Deepfakes</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[91, 87, 82].map((sim, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="aspect-video rounded bg-gradient-to-br from-cyan/20 to-violet/20 border border-cyan/20" />
                  <div className="mt-3 flex justify-between text-xs"><span className="text-cyan font-semibold">{sim}% match</span><span className="text-muted-foreground">2026-05-1{i + 2}</span></div>
                  <div className="text-sm mt-1">Political · Verified</div>
                  <button className="mt-2 text-xs text-cyan hover:underline">View Evidence →</button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="glass rounded-2xl p-5 flex flex-wrap gap-3">
            <button onClick={() => toast.success("PDF report generated")} className="inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-semibold glow-cyan"><FileText className="h-4 w-4" /> Download PDF Report</button>
            <button onClick={() => { navigator.clipboard?.writeText("https://verifai.app/a/VAI-2026-0847"); toast.success("Share link copied"); }} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><Share2 className="h-4 w-4" /> Copy Share Link</button>
            <button onClick={() => toast.warning("Reported to BD Cyber Crime Unit")} className="inline-flex items-center gap-2 rounded-md border border-danger/50 text-danger px-4 py-2 text-sm hover:bg-danger/10"><Flag className="h-4 w-4" /> Report to Authorities</button>
            <button onClick={() => toast("Embed snippet shown below")} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><Code2 className="h-4 w-4" /> Embed Trust Badge</button>
          </div>

          <div className="glass rounded-xl p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
            <div className="text-cyan mb-2 uppercase tracking-widest">Embed Snippet</div>
            &lt;iframe src=&quot;https://verifai.app/badge/VAI-2026-0847&quot; width=&quot;320&quot; height=&quot;120&quot; frameborder=&quot;0&quot;&gt;&lt;/iframe&gt;
          </div>

          <div className="rounded-xl border border-cyan/30 bg-gradient-to-r from-cyan/10 to-violet/10 p-5 flex items-center gap-3 flex-wrap">
            <span className="text-2xl">🤖</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Report suspicious videos via Telegram</div>
              <div className="text-sm text-muted-foreground">Forward any video to <span className="font-mono text-cyan">@VerifAIBot</span> and get results in 6 seconds.</div>
            </div>
          </div>

          <div className="text-center pt-4">
            <button onClick={() => setStage("idle")} className="text-sm text-cyan hover:underline">← Analyze another</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrustGauge({ score }: { score: number }) {
  const r = 80, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score < 30 ? "#FF3B5C" : score < 60 ? "#FFB830" : "#00C896";
  return (
    <div className="relative mx-auto h-56 w-56">
      <svg viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
        <circle cx="100" cy="100" r={r} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-6xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Trust Score</div>
      </div>
    </div>
  );
}
