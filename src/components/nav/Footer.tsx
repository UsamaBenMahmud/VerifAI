import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--border)] mt-24 bg-[color:var(--bg-surface)]/40">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            VerifAI — Build Locally. Lead Globally. Bangla-first deepfake detection infrastructure for South Asia.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-cyan mb-3">Roadmap</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Phase 1: MVP <span className="text-safe">✓</span></li>
            <li>Phase 2: API + Telegram Bot</li>
            <li>Phase 3: Browser Extension</li>
            <li>Phase 4: South Asia</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-cyan mb-3">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/docs" className="hover:text-foreground">API Docs</Link></li>
            <li><a href="#" className="hover:text-foreground">GitHub</a></li>
            <li><Link to="/laws" className="hover:text-foreground">Privacy (BD + GDPR)</Link></li>
            <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-cyan mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>contact@verifai.app</li>
            <li>@VerifAIBot on Telegram</li>
            <li>BD Cyber Crime Unit: 02-9512382</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[color:var(--border)] py-5 text-center text-xs text-muted-foreground font-mono">
        Built for The Infinity AI BuildFest 2026 · Track 5: InfoTech
      </div>
    </footer>
  );
}
