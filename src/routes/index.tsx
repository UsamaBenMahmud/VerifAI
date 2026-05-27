import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Brain, ChartBar, Upload as UploadIcon, Languages, Newspaper, Search, Users, Shield, FileText, Bot, Network, Activity } from "lucide-react";
import { GridBackground } from "@/components/brand/GridBackground";
import { LiveStatsBar } from "@/components/brand/LiveStatsBar";
import { Marquee } from "@/components/brand/Marquee";
import { useLang, t } from "@/lib/i18n";
import { trendingDeepfakes } from "@/lib/mockData";
import { bumpAndGetLiveStats } from "@/lib/localStore";
import { useCountUp } from "@/lib/useCountUp";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "VerifAI — Detect Deepfakes in 6 Seconds" },
    { name: "description", content: "Bangladesh's first AI-native deepfake detection. Multi-agent verification in Bangla and English." },
    { property: "og:title", content: "VerifAI — Bangla-First Deepfake Detection" },
    { property: "og:description", content: "Multi-agent AI deepfake detection for journalists, fact-checkers, and 60 million citizens." },
  ]}),
  component: Home,
});

function ScanReticle() {
  return (
    <div className="relative mx-auto h-72 w-72 sm:h-80 sm:w-80">
      <div className="absolute inset-0 rounded-full border border-cyan/30" />
      <div className="absolute inset-6 rounded-full border border-cyan/20" />
      <div className="absolute inset-12 rounded-full border-2 border-cyan/60 glow-cyan" />
      <svg viewBox="0 0 200 200" className="absolute inset-0 m-auto h-40 w-40 text-cyan/80">
        <path d="M100 50 C 70 50, 55 75, 55 110 C 55 145, 75 170, 100 170 C 125 170, 145 145, 145 110 C 145 75, 130 50, 100 50 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="80" cy="100" r="3" fill="currentColor" />
        <circle cx="120" cy="100" r="3" fill="currentColor" />
        <path d="M85 135 Q100 145 115 135" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {/* detection boxes */}
      <div className="absolute left-[28%] top-[42%] h-6 w-10 border-2 border-danger animate-pulse-dot" style={{ animationDuration: "1.2s" }} />
      <div className="absolute left-[56%] top-[42%] h-6 w-10 border-2 border-danger animate-pulse-dot" style={{ animationDuration: "1.4s" }} />
      <div className="absolute left-[36%] top-[62%] h-7 w-16 border-2 border-warning animate-pulse-dot" />
      {/* scan line */}
      <div className="absolute left-6 right-6 top-6 h-px bg-gradient-to-r from-transparent via-cyan to-transparent animate-scan glow-cyan" />
    </div>
  );
}

function Home() {
  const { lang } = useLang();
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <GridBackground />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-cyan/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="group inline-flex items-center gap-2 rounded-full border border-cyan/40 px-4 py-2 text-[13px] font-mono uppercase tracking-widest text-cyan" style={{ background: "linear-gradient(135deg, rgba(123,47,255,0.2), rgba(0,229,255,0.2))" }}>
              <span className="inline-block transition-transform group-hover:rotate-[5deg]">🏆</span>
              <span>The Infinity AI BuildFest 2026 · Track 5: InfoTech · Bangladesh</span>
            </div>
            <h1 className="mt-6 font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              Detect Deepfakes<br /><span className="text-cyan text-glow-cyan">in 6 Seconds</span>
            </h1>
            <p className="mt-5 text-2xl sm:text-3xl text-cyan/90 font-bangla">৬ সেকেন্ডে ডিপফেক শনাক্ত করুন</p>
            <p className="mt-6 text-base text-muted-foreground max-w-xl leading-relaxed">
              Bangladesh's first AI-native deepfake detection platform. Built for journalists, fact-checkers, and 60 million citizens.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/detect" className="inline-flex items-center gap-2 rounded-md bg-cyan px-5 py-3 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan hover:glow-cyan-strong transition">
                Analyze a Video <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-5 py-3 text-sm text-cyan hover:bg-cyan/10 transition">
                View Live Demo
              </Link>
            </div>
            <LiveStatsBar />
          </div>
          <div className="relative"><ScanReticle /></div>
        </div>
      </section>

      {/* LIVE TICKER */}
      <section className="border-y border-[color:var(--border)] bg-[color:var(--bg-surface)]/70">
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-5 py-3 border-r border-[color:var(--border)] bg-danger/10 text-danger text-xs font-mono uppercase tracking-widest shrink-0">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse-dot" /> LIVE
          </div>
          <Marquee>
            <span className="text-sm text-foreground">47 deepfakes detected today</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-cyan">3 trending in Bangladesh</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm">Last detected: 2 min ago</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-warning">Political category surging +24% this week</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm">৬০ মিলিয়ন নাগরিকের জন্য AI ট্রাস্ট ইনফ্রাস্ট্রাকচার</span>
          </Marquee>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🎯", n: "85%", l: "Detection Accuracy" },
          { icon: "⚡", n: "<6s", l: "Average Analysis" },
          { icon: "💰", n: "<৳2", l: "Per Scan Cost" },
          { icon: "🌐", n: "BN+EN", l: "Native Languages" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-xl p-6 text-center hover:border-cyan/40 transition">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-display text-4xl font-bold text-cyan text-glow-cyan">{s.n}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-center">How It Works</h2>
        <p className="mt-2 text-center text-muted-foreground">Four agents. One trust score. Six seconds.</p>
        <div className="mt-10 grid md:grid-cols-4 gap-4 relative">
          {[
            { icon: UploadIcon, title: "Upload", desc: "Video, image, or URL" },
            { icon: Brain, title: "4 AI Agents", desc: "Parallel analysis" },
            { icon: ChartBar, title: "Trust Score", desc: "0–100 with confidence" },
            { icon: Languages, title: "Explain", desc: "Bangla + English" },
          ].map((step, i) => (
            <div key={step.title} className="glass rounded-xl p-6 relative">
              <div className="absolute -top-3 left-4 font-mono text-xs px-2 py-0.5 rounded bg-cyan text-[color:var(--bg-deep)] font-bold">0{i + 1}</div>
              <step.icon className="h-7 w-7 text-cyan mb-3" />
              <h3 className="font-display font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-center">Who It's For</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { icon: Newspaper, h: "Journalists", p: "Verify before you publish. In 6 seconds." },
            { icon: Search, h: "Fact-Checkers", p: "Bulk API for organizations like Rumor Scanner BD." },
            { icon: Users, h: "Citizens", p: "Forward a suspicious WhatsApp video. Get truth back." },
          ].map((c) => (
            <div key={c.h} className="glass rounded-xl p-6 hover:border-cyan/40 transition">
              <c.icon className="h-7 w-7 text-cyan" />
              <h3 className="mt-3 font-display text-xl font-semibold">{c.h}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EDUCATION — Understanding Deepfakes in Bangladesh */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-center">Understanding Deepfakes in Bangladesh</h2>
        <p className="mt-2 text-center text-cyan/90 font-bangla text-lg">বাংলাদেশে ডিপফেক: যা জানা দরকার</p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            {
              icon: "🧠",
              h: "How Deepfakes Are Made",
              p: "GANs (Generative Adversarial Networks) train two competing neural networks — one generates fake faces, one detects them — until the fake is indistinguishable to humans. Modern tools make this possible in under 30 seconds.",
              bn: "GAN দিয়ে এখন ৩০ সেকেন্ডের কম সময়ে নকল মুখ তৈরি করা যায়।",
            },
            {
              icon: "⚠️",
              h: "Who's Most at Risk",
              p: "Women face NCII (Non-Consensual Intimate Images). Politicians face election deepfakes. Journalists face intimidation. Ordinary citizens face WhatsApp hoaxes in Bangla — with no tools to fight back.",
              bn: "নারী, রাজনীতিবিদ, সাংবাদিক এবং সাধারণ নাগরিক — সবাই ঝুঁকিতে।",
            },
            {
              icon: "🔬",
              h: "How VerifAI Detects Them",
              p: "EfficientNet-B0 analyzes 847 facial landmarks for GAN artifacts. Frequency analysis finds invisible manipulation signatures. Our model is trained on FaceForensics++ and Celeb-DF v2 — the gold standard deepfake datasets.",
              bn: "EfficientNet মডেল ৮৪৭টি ফেসিয়াল ল্যান্ডমার্ক বিশ্লেষণ করে।",
            },
          ].map((c) => (
            <div key={c.h} className="glass rounded-xl p-6 hover:border-cyan/40 transition">
              <div className="text-3xl mb-3">{c.icon}</div>
              <h3 className="font-display text-lg font-semibold">{c.h}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.p}</p>
              <p className="mt-2 text-xs text-cyan/80 font-bangla">{c.bn}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 glass-strong rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { n: "30s", l: "to make a deepfake" },
            { n: "3 days", l: "for journalists to debunk" },
            { n: "6s", l: "with VerifAI" },
            { n: "৳2", l: "per analysis" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl font-bold text-cyan text-glow-cyan">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>


      {/* LIVE FEED */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Recent Verified Deepfakes</h2>
            <p className="text-sm text-muted-foreground">Last 24 hours · Public threat feed</p>
          </div>
          <Link to="/dashboard" className="text-sm text-cyan hover:underline">Full dashboard →</Link>
        </div>
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--bg-surface)]/60 text-xs uppercase tracking-widest text-muted-foreground">
                <tr><th className="text-left px-4 py-3">Content</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Trust</th><th className="text-left px-4 py-3 hidden md:table-cell">Detected</th><th className="text-left px-4 py-3 hidden md:table-cell">Source</th></tr>
              </thead>
              <tbody>
                {trendingDeepfakes.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-t border-[color:var(--border)] hover:bg-cyan/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded bg-gradient-to-br from-cyan/20 to-violet/20 border border-cyan/30 shrink-0" />
                        <div className="min-w-0"><div className="truncate max-w-xs">{lang === "bn" ? r.titleBn : r.title}</div><div className="text-xs text-muted-foreground font-mono">{r.id}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded border border-[color:var(--border)]">{r.category}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded ${r.trustScore < 30 ? "bg-danger/15 text-danger" : r.trustScore < 60 ? "bg-warning/15 text-warning" : "bg-safe/15 text-safe"}`}>{r.trustScore}/100</span></td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.detectedAt}</td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="font-mono text-xs">{r.source}</div><div className="text-[10px] text-muted-foreground">cred {r.sourceCredibility}/100</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-center">Built to Forensic Standards</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Brain, h: "Multi-Agent AI", p: "Vision + Metadata + Knowledge Graph + LLM Reasoning fire in parallel." },
            { icon: Network, h: "Source Credibility Graph", p: "Neo4j-powered graph traces every claim back to its origin." },
            { icon: Activity, h: "Confidence Intervals", p: "Never '100% fake.' Always shows ±uncertainty range." },
            { icon: Shield, h: "Privacy-First", p: "Uploads auto-delete in 24 hours. No face database stored." },
            { icon: FileText, h: "Legal PDF Reports", p: "One-click evidence chain export for law enforcement." },
            { icon: Bot, h: "Telegram Bot", p: "Citizens report suspicious videos directly via Telegram." },
          ].map((f) => (
            <div key={f.h} className="glass rounded-xl p-5 hover:border-cyan/40 transition">
              <f.icon className="h-6 w-6 text-cyan mb-3" />
              <h3 className="font-display font-semibold text-lg">{f.h}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
