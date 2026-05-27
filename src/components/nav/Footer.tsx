import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { useEffect, useState } from "react";
import { getSubmissionLinks } from "@/lib/localStore";

export function Footer() {
  const [links, setLinks] = useState({ github: "", huggingface: "", telegram: "" });
  useEffect(() => {
    const s = getSubmissionLinks();
    setLinks({ github: s.github, huggingface: s.huggingface, telegram: "" });
  }, []);

  return (
    <footer className="border-t border-[color:var(--border)] mt-24 bg-[color:var(--bg-surface)]/40">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Bangladesh's first Bangla-native deepfake detection platform.
          </p>
          <p className="mt-2 text-xs text-muted-foreground font-bangla max-w-xs">
            বাংলাদেশের প্রথম বাংলা-নেটিভ ডিপফেক শনাক্তকরণ প্ল্যাটফর্ম।
          </p>
          <p className="mt-3 text-xs text-cyan/80 font-mono">Built for The Infinity AI BuildFest 2026</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            {links.github && <a href={links.github} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded border border-[color:var(--border)] hover:border-cyan/40 hover:text-cyan">GitHub</a>}
            {links.huggingface && <a href={links.huggingface} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded border border-[color:var(--border)] hover:border-cyan/40 hover:text-cyan">HuggingFace</a>}
            <a href="#" className="text-xs px-2 py-1 rounded border border-[color:var(--border)] hover:border-cyan/40 hover:text-cyan">Telegram Bot</a>
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-cyan mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/detect" className="hover:text-foreground">Detect</Link></li>
            <li><Link to="/submit-rumor" className="hover:text-foreground">Report Rumor</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            <li><Link to="/history" className="hover:text-foreground">History</Link></li>
            <li><Link to="/admin" className="hover:text-foreground">API Keys</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-cyan mb-3">Legal & Help</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/laws" className="hover:text-foreground">Cyber Laws</Link></li>
            <li><Link to="/help" className="hover:text-foreground">Help & Support</Link></li>
            <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
            <li className="text-danger font-mono">Victims Hotline: 109</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest text-cyan mb-3">Powered by</h4>
          <div className="flex flex-wrap gap-2">
            {["Supabase", "Anthropic", "HuggingFace", "Lovable", "n8n"].map((p) => (
              <span key={p} className="text-xs px-2 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-cyan font-mono">{p}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[color:var(--border)] py-4 px-6 text-xs text-muted-foreground font-mono grid sm:grid-cols-3 gap-2 text-center">
        <span className="sm:text-left">© 2026 VerifAI. Open-source. MIT License.</span>
        <span>Build Locally. Lead Globally. 🇧🇩</span>
        <span className="sm:text-right">v1.0.0 · BuildFest 2026 · Track 5</span>
      </div>
    </footer>
  );
}
