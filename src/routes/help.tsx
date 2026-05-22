import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Phone } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help & Support — VerifAI" },
    { name: "description", content: "Step-by-step guide for deepfake abuse victims. Crisis hotlines and FAQ." },
  ]}),
  component: HelpPage,
});

const steps = [
  { n: 1, e: "🔍", t: "Analyze it on VerifAI", d: "Run the content through our detection tool to get a forensic-grade evidence report." },
  { n: 2, e: "📸", t: "Screenshot everything", d: "Capture URLs, accounts, timestamps, and original posts before they're deleted." },
  { n: 3, e: "📄", t: "Download the legal PDF report", d: "Our report is formatted for law enforcement and includes the full evidence chain." },
  { n: 4, e: "🚔", t: "File a complaint", d: "Contact BD Cyber Crime Unit, National Emergency Service 999, or your local police." },
  { n: 5, e: "💬", t: "Reach out for support", d: "You are not alone. Connect with mental health and victim support organizations." },
];

const faqs = [
  { q: "Is my upload kept private?", a: "Yes. All uploads are encrypted in transit and storage, and auto-deleted after 24 hours. We never build a face database." },
  { q: "How accurate is VerifAI?", a: "Our ensemble achieves ~85% accuracy on Bangla and English test sets. We always show confidence intervals — never 100% certainty." },
  { q: "Does it work offline?", a: "Phase 3 (Q4 2026) will ship offline detection via Ollama for environments with limited connectivity." },
  { q: "Can I use VerifAI for my newsroom?", a: "Yes — Phase 2 ships a bulk REST API and a dedicated newsroom dashboard. Contact us for early access." },
  { q: "What languages are supported?", a: "Bangla and English at launch. Hindi, Urdu, and Tamil planned for 2027." },
];

function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">I found a deepfake of me — what do I do?</h1>
      <p className="text-sm text-muted-foreground mt-1">Follow these steps. We're here to help.</p>

      <div className="mt-8 space-y-4">
        {steps.map(s => (
          <div key={s.n} className="glass rounded-xl p-5 flex gap-4">
            <div className="h-10 w-10 rounded-full bg-cyan/15 border border-cyan/40 flex items-center justify-center font-display font-bold text-cyan shrink-0">{s.n}</div>
            <div>
              <h3 className="font-display font-semibold text-lg">{s.e} {s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border-2 border-danger/40 bg-danger/5 p-6">
        <h2 className="font-display text-xl font-bold text-danger flex items-center gap-2"><Phone className="h-5 w-5" /> Crisis Hotlines (Bangladesh)</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md bg-[color:var(--bg-deep)]/60 p-3"><div className="text-xs text-muted-foreground uppercase tracking-widest">Women Helpline</div><div className="font-mono text-2xl text-danger mt-1">109</div></div>
          <div className="rounded-md bg-[color:var(--bg-deep)]/60 p-3"><div className="text-xs text-muted-foreground uppercase tracking-widest">Emergency</div><div className="font-mono text-2xl text-danger mt-1">999</div></div>
          <div className="rounded-md bg-[color:var(--bg-deep)]/60 p-3"><div className="text-xs text-muted-foreground uppercase tracking-widest">Cyber Crime Unit</div><div className="font-mono text-lg text-danger mt-1">02-9512382</div></div>
        </div>
        <p className="mt-4 text-sm text-foreground/90">You are not alone. Deepfake abuse is a crime, <strong>not your fault</strong>.</p>
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold">FAQ</h2>
      <div className="mt-4 space-y-2">
        {faqs.map((f, i) => (
          <div key={f.q} className="glass rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-semibold">{f.q}</span>
              <ChevronDown className={`h-4 w-4 transition ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
