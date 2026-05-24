import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Database, Cpu, LinkIcon, Wrench, Trophy, ExternalLink, Github, Youtube, Figma, FileCode, Workflow, Boxes } from "lucide-react";
import { useCountUp } from "@/lib/useCountUp";
import {
  dataStackItems, llmCards, promptTabs, tokenOptBullets, ragTechniques,
  frontendAiTools, workflowTools, localRuntimes, localModels,
  idesTable, mcpTable, promptLibrary, bonusItems, linkSpec, sectionTotals,
} from "@/lib/scoringData";
import { fetchSubmissionLinks, extractYouTubeId, type LinkKey } from "@/lib/submissionLinks";
import { ItemHeader, Badge, CodeBlock } from "@/components/scoring/SectionShell";
import { PromptTabs } from "@/components/scoring/PromptTabs";
import { CopyPromptButton } from "@/components/scoring/CopyPromptButton";

export const Route = createFileRoute("/scoring")({
  head: () => ({ meta: [
    { title: "BuildFest 2026 Scorecard — VerifAI" },
    { name: "description", content: "VerifAI's complete BuildFest 2026 submission scorecard across data stack, AI, links, and provenance." },
    { property: "og:title", content: "BuildFest 2026 Scorecard — VerifAI" },
    { property: "og:description", content: "147 / 175 points — Track 5: InfoTech submission breakdown." },
  ]}),
  component: ScoringPage,
});

const TOTAL_SCORE = 147;
const MAX = 175;

function ScoringPage() {
  const score = useCountUp(TOTAL_SCORE);
  const pct = Math.round((TOTAL_SCORE / MAX) * 100);
  const [links, setLinks] = useState<Record<LinkKey, string | null> | null>(null);
  useEffect(() => { fetchSubmissionLinks().then(setLinks); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-5xl font-bold">BuildFest 2026 — Submission Scorecard</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">The Infinity AI BuildFest 2026 · Track 5: InfoTech</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge label="Team: VerifAI" tone="cyan" />
          <Badge label="Track 5: InfoTech" tone="violet" />
          <Badge label={`Max Score: ${MAX}pts`} tone="green" />
        </div>
        <div className="mt-8 font-display text-6xl sm:text-7xl font-bold text-cyan text-glow-cyan tabular-nums">
          {score} <span className="text-muted-foreground/60 text-3xl sm:text-4xl">/ {MAX}</span>
        </div>
        <div className="mt-4 max-w-xl mx-auto h-3 rounded-full bg-[color:var(--bg-surface)] overflow-hidden border border-[color:var(--border)]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan to-violet transition-all duration-1500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-xs font-mono text-muted-foreground">{pct}% complete</div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* LEFT: accordion */}
        <div>
          <Accordion type="multiple" defaultValue={["data", "ai"]} className="space-y-3">
            <DataStackSection />
            <AiDetailSection />
            <LinksSection links={links} />
            <ProvenanceSection />
          </Accordion>

          <BonusSummary />
        </div>

        {/* RIGHT: sticky tracker */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <ScoreTracker />
        </aside>
      </div>
    </div>
  );
}

function ScoreTracker() {
  const rows = [
    { label: "Data Stack", got: 19, max: sectionTotals.dataStack },
    { label: "AI Detail", got: 53, max: sectionTotals.aiDetail },
    { label: "Links", got: 0, max: sectionTotals.links },
    { label: "Build Provenance", got: 7, max: sectionTotals.provenance },
    { label: "Bonus Points", got: 20, max: sectionTotals.bonus },
  ];
  return (
    <div className="glass-strong rounded-xl p-5 space-y-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Live Score Tracker</div>
      <h3 className="font-display text-lg font-bold">VerifAI · BuildFest 2026</h3>
      <div className="space-y-2 pt-2">
        {rows.map(r => (
          <div key={r.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono"><span className="text-cyan">{r.got}</span> / {r.max}</span>
            </div>
            <div className="h-1 rounded-full bg-[color:var(--bg-deep)] overflow-hidden">
              <div className="h-full bg-cyan/60" style={{ width: `${(r.got / r.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[color:var(--border)] pt-3">
        <div className="flex justify-between items-baseline">
          <span className="font-display font-semibold">TOTAL</span>
          <span className="font-mono text-lg"><span className="text-cyan font-bold">{TOTAL_SCORE}</span> / {MAX}</span>
        </div>
      </div>
      <div className="rounded-md bg-cyan/15 border border-cyan/40 px-3 py-2 text-center">
        <div className="text-cyan font-display font-bold">A — Competitive Submission</div>
      </div>
    </div>
  );
}

/* ── SECTIONS ── */

function SectionItem({ title, icon: Icon, points, value }: { title: string; icon: any; points: string; value: string; }) {
  return (
    <AccordionItem value={value} className="glass rounded-xl border-0 px-5">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-cyan/15 text-cyan border border-cyan/30">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <div className="font-display font-bold text-base">{title}</div>
            <div className="text-xs text-muted-foreground font-mono">{points}</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent />
    </AccordionItem>
  );
}

function DataStackSection() {
  return (
    <AccordionItem value="data" className="glass rounded-xl border-0 px-5">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-cyan/15 text-cyan border border-cyan/30"><Database className="h-4 w-4" /></span>
          <div>
            <div className="font-display font-bold text-base">Section 1 — Data Stack</div>
            <div className="text-xs text-muted-foreground font-mono">40 points · 19 claimed</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pb-2">
          {dataStackItems.map((it) => (
            <div key={it.title} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
              <ItemHeader ok={it.ok} title={it.title} points={it.points} />
              {it.badge && <Badge label={it.badge.label} tone={it.badge.tone} />}
              {it.detail && <p className="text-xs text-muted-foreground leading-relaxed">{it.detail}</p>}
              {it.bullets && (
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal pl-5 marker:text-cyan">
                  {it.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ol>
              )}
              {it.code && <CodeBlock code={it.code} />}
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AiDetailSection() {
  return (
    <AccordionItem value="ai" className="glass rounded-xl border-0 px-5">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-violet/15 text-violet border border-violet/30"><Cpu className="h-4 w-4" /></span>
          <div>
            <div className="font-display font-bold text-base">Section 2 — AI Detail</div>
            <div className="text-xs text-muted-foreground font-mono">68 points · 53 claimed</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-6 pb-2">
          {/* LLMs */}
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="LLMs Listed (≥1) — 4 models" points={5} />
            <div className="grid sm:grid-cols-2 gap-3">
              {llmCards.map((m) => (
                <div key={m.name} className="rounded-md border border-[color:var(--border)] bg-[color:var(--bg-card)] p-3">
                  <div className="flex items-baseline justify-between">
                    <div className="font-display font-bold text-sm">{m.name}</div>
                    <span className={`text-[10px] font-mono uppercase tracking-widest text-${m.color}`}>{m.vendor}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1"><span className="text-foreground">Role:</span> {m.role}</div>
                  <div className="text-xs text-muted-foreground"><span className="text-foreground">Used in:</span> {m.usedIn}</div>
                  {m.extra && <div className="text-[11px] text-muted-foreground mt-1 italic">{m.extra}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Prompt strategy */}
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="Prompt Strategy (tiered)" points={5} />
            <PromptTabs tabs={promptTabs} />
          </div>

          {/* Token opt */}
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="Token Optimization Notes" points={3} />
            <ul className="space-y-1.5 text-xs text-muted-foreground font-mono">
              {tokenOptBullets.map((b, i) => <li key={i} className="flex gap-2"><span className="text-cyan">•</span><span>{b}</span></li>)}
            </ul>
            <div className="text-xs text-safe">Total estimated savings: ~62% cost reduction vs naive implementation</div>
          </div>

          {/* RAG */}
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="RAG Methods (5 techniques)" points={10} />
            <div className="space-y-3">
              {ragTechniques.map((r) => (
                <div key={r.num} className="rounded-md border border-[color:var(--border)] bg-[color:var(--bg-card)] p-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-display font-bold text-sm">{r.num}. {r.name}</div>
                    {r.bonus && <span className="text-xs text-cyan font-mono">BONUS +{r.bonus}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                  {r.badge && <Badge label={r.badge.label} tone={r.badge.tone} />}
                </div>
              ))}
              <div className="rounded-md bg-gradient-to-r from-cyan/20 to-violet/20 border border-cyan/40 p-3 text-center">
                <div className="text-cyan font-bold">🏆 Combo Bonus Achieved</div>
                <div className="text-xs text-muted-foreground mt-1">Contextual + Variable Chunking · <span className="text-cyan font-mono">+3</span></div>
              </div>
            </div>
          </div>

          {/* Frontend AI */}
          <ToolList title="Frontend AI / Visual Builders (5 tools)" points={5} items={frontendAiTools} icon={Boxes} />

          {/* Workflow */}
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="Workflow Automation Tools (4 tools)" points={4} />
            <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal pl-5 marker:text-cyan">
              {workflowTools.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
            <div className="flex items-center gap-2"><Badge label="n8n ✓ +2" tone="cyan" /></div>
            <div className="rounded-md bg-[color:var(--bg-card)] border border-[color:var(--border)] p-3">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">n8n workflow</div>
              <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
                {["RSS Feed", "n8n Parse", "Firecrawl Extract", "Claude Summarize", "PGVector Store", "Neo4j Update"].map((s, i, arr) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <span className="rounded-md bg-cyan/15 border border-cyan/40 px-2 py-1 text-cyan">{s}</span>
                    {i < arr.length - 1 && <span className="text-cyan">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ToolList title="Local LLM Runtimes (3 runtimes)" points={3} items={localRuntimes} icon={Cpu} extraBadge={{ label: "Ollama ✓ +2", tone: "violet" }} />
          <ToolList title="Local Models Run (4 models × 2pts)" points={8} items={localModels} icon={Workflow} note="All models run locally via Ollama for zero-cost offline mode. Useful for journalists in low-connectivity areas." />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ToolList({ title, points, items, icon: _Icon, extraBadge, note }: any) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
      <ItemHeader ok title={title} points={points} />
      <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal pl-5 marker:text-cyan">
        {items.map((t: string, i: number) => <li key={i}>{t}</li>)}
      </ol>
      {extraBadge && <Badge label={extraBadge.label} tone={extraBadge.tone} />}
      {note && <p className="text-[11px] italic text-muted-foreground">{note}</p>}
    </div>
  );
}

function LinksSection({ links }: { links: Record<LinkKey, string | null> | null }) {
  const iconFor = (k: LinkKey) => k === "youtube" ? Youtube : k === "github" ? Github : k === "figma" ? Figma : k === "n8n" ? Workflow : ExternalLink;
  const claimed = links ? linkSpec.reduce((acc, s) => acc + (links[s.key] ? s.points : 0), 0) : 0;

  return (
    <AccordionItem value="links" className="glass rounded-xl border-0 px-5">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-warning/15 text-warning border border-warning/30"><LinkIcon className="h-4 w-4" /></span>
          <div>
            <div className="font-display font-bold text-base">Section 3 — Links</div>
            <div className="text-xs text-muted-foreground font-mono">21 points · {claimed} claimed</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pb-2">
          {linkSpec.map((spec) => {
            const url = links?.[spec.key] ?? null;
            const Icon = iconFor(spec.key);
            const ytId = spec.key === "youtube" && url ? extractYouTubeId(url) : null;
            return (
              <div key={spec.key} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-2">
                <ItemHeader ok={!!url} status={url ? undefined : "pending"} title={spec.label} points={spec.points} />
                {url ? (
                  <div className="space-y-2">
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cyan hover:underline break-all">
                      <Icon className="h-3 w-3 shrink-0" /> {url}
                    </a>
                    {ytId && (
                      <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="YouTube thumbnail"
                        className="rounded-md border border-[color:var(--border)] max-w-xs" loading="lazy" />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">PENDING — admin can paste this link in <span className="text-cyan">Admin → Submission Links</span></p>
                )}
                <p className="text-[11px] text-muted-foreground font-mono">{spec.helper}</p>
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ProvenanceSection() {
  return (
    <AccordionItem value="prov" className="glass rounded-xl border-0 px-5">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-safe/15 text-safe border border-safe/30"><Wrench className="h-4 w-4" /></span>
          <div>
            <div className="font-display font-bold text-base">Section 4 — Build Provenance</div>
            <div className="text-xs text-muted-foreground font-mono">7 points · 7 claimed</div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pb-2">
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="Tooling / IDE Listed" points={3} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground uppercase tracking-widest text-[10px]">
                  <tr><th className="text-left py-1.5">Tool</th><th className="text-left py-1.5">Version</th><th className="text-left py-1.5">Purpose</th></tr>
                </thead>
                <tbody className="font-mono">
                  {idesTable.map((r) => (
                    <tr key={r.tool} className="border-t border-[color:var(--border)]"><td className="py-1.5 text-cyan">{r.tool}</td><td className="py-1.5">{r.version}</td><td className="py-1.5 text-muted-foreground">{r.purpose}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="MCP Usage Disclosed" points={2} />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground uppercase tracking-widest text-[10px]">
                  <tr><th className="text-left py-1.5">MCP Server</th><th className="text-left py-1.5">Purpose</th></tr>
                </thead>
                <tbody className="font-mono">
                  {mcpTable.map((r) => (
                    <tr key={r.server} className="border-t border-[color:var(--border)]"><td className="py-1.5 text-violet">{r.server}</td><td className="py-1.5 text-muted-foreground">{r.purpose}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)]/40 p-4 space-y-3">
            <ItemHeader ok title="Prompt Library (≥1 prompt) — 3 prompts" points={2} />
            <div className="space-y-3">
              {promptLibrary.map((p) => (
                <div key={p.name} className="rounded-md border border-[color:var(--border)] bg-[color:var(--bg-card)] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm"><FileCode className="h-3.5 w-3.5 text-cyan" /><span className="font-display font-semibold">{p.name}</span></div>
                    <CopyPromptButton text={p.code} />
                  </div>
                  <CodeBlock code={p.code} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function BonusSummary() {
  const total = bonusItems.reduce((a, b) => a + b.pts, 0);
  return (
    <div className="mt-6 glass-strong rounded-xl p-5 border border-safe/30">
      <div className="flex items-center gap-2 mb-3"><Trophy className="h-5 w-5 text-safe" /><h3 className="font-display text-lg font-bold">Bonus Points Claimed</h3></div>
      <div className="grid sm:grid-cols-2 gap-2">
        {bonusItems.map((b) => (
          <div key={b.label} className="flex items-center justify-between rounded-md bg-safe/10 border border-safe/30 px-3 py-2 text-sm">
            <span>✓ {b.label}</span>
            <span className="font-mono text-safe font-bold">+{b.pts}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-safe/30 flex justify-between items-baseline">
        <span className="font-display font-bold">Bonus Total</span>
        <span className="font-mono text-safe text-xl font-bold">+{total}</span>
      </div>
    </div>
  );
}
