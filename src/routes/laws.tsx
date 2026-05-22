import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/laws")({
  head: () => ({ meta: [
    { title: "Cyber Laws — VerifAI" },
    { name: "description", content: "Cyber laws and deepfake regulations in Bangladesh, USA, UK, and India." },
  ]}),
  component: LawsPage,
});

const countries: Record<string, { flag: string; name: string; laws: { title: string; year: number; desc: string; penalty: string; link: string }[] }> = {
  bd: {
    flag: "🇧🇩", name: "Bangladesh",
    laws: [
      { title: "Digital Security Act", year: 2018, desc: "Criminalizes publishing offensive, false, or threatening content through digital means. Applies to AI-generated synthetic media.", penalty: "Up to 10 years imprisonment + fine", link: "https://police.gov.bd" },
      { title: "Personal Data Protection Act", year: 2023, desc: "Protects biometric data including facial likeness. Synthetic generation without consent is a violation.", penalty: "Up to 5 years + BDT 5 lakh", link: "#" },
      { title: "Pornography Control Act", year: 2012, desc: "Covers synthetic NCII (non-consensual intimate imagery) including AI-generated content.", penalty: "Up to 10 years + BDT 5 lakh", link: "#" },
    ],
  },
  us: { flag: "🇺🇸", name: "USA", laws: [
    { title: "DEEPFAKES Accountability Act (proposed)", year: 2023, desc: "Requires creators to disclose AI manipulation; criminalizes deceptive deepfakes.", penalty: "Civil + criminal penalties vary by state", link: "#" },
    { title: "Take It Down Act", year: 2025, desc: "Federal law requiring platforms to remove NCII (including deepfakes) within 48 hours.", penalty: "Criminal penalties + civil suits", link: "#" },
  ]},
  uk: { flag: "🇬🇧", name: "UK", laws: [
    { title: "Online Safety Act", year: 2023, desc: "Criminalizes sharing intimate deepfakes without consent.", penalty: "Up to 2 years prison", link: "#" },
  ]},
  in: { flag: "🇮🇳", name: "India", laws: [
    { title: "IT Act §66E / §67", year: 2000, desc: "Covers privacy violation via electronic media; extended to AI deepfakes.", penalty: "Up to 3 years + ₹2 lakh", link: "#" },
    { title: "Digital Personal Data Protection Act", year: 2023, desc: "Biometric and identity protection.", penalty: "Up to ₹250 crore", link: "#" },
  ]},
};

function LawsPage() {
  const [c, setC] = useState("bd");
  const country = countries[c];
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="rounded-xl border border-danger/40 bg-danger/5 p-4 mb-8 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
        <div className="text-sm">Victim of deepfake harassment? → <Link to="/help" className="text-cyan underline">Get help</Link></div>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold">Cyber Laws & Deepfake Regulation</h1>
      <p className="text-sm text-muted-foreground mt-1">Know your rights. File complaints. Hold platforms accountable.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {Object.entries(countries).map(([k, v]) => (
          <button key={k} onClick={() => setC(k)} className={`px-4 py-2 rounded-full text-sm border transition ${c === k ? "bg-cyan/15 border-cyan text-cyan glow-cyan" : "border-[color:var(--border)] text-muted-foreground hover:border-cyan/40"}`}>
            {v.flag} {v.name}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {country.laws.map(l => (
          <div key={l.title} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold">{l.title} <span className="text-cyan font-mono text-sm">({l.year})</span></h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{l.desc}</p>
              </div>
              <a href={l.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-cyan/40 px-3 py-1.5 text-xs text-cyan hover:bg-cyan/10">File Complaint <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="mt-3 text-xs"><span className="text-warning font-mono uppercase tracking-widest">Penalty:</span> <span className="text-foreground/90">{l.penalty}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
