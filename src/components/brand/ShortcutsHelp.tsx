import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Keyboard, X } from "lucide-react";

const SHORTCUTS: Array<{ key: string; label: string; to?: string }> = [
  { key: "?", label: "Show this shortcuts dialog" },
  { key: "D", label: "Go to Detect", to: "/detect" },
  { key: "R", label: "Go to Report Rumor", to: "/submit-rumor" },
  { key: "H", label: "Go to History", to: "/history" },
  { key: "Esc", label: "Close modals" },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "?") { e.preventDefault(); setOpen((o) => !o); return; }
      if (e.key === "Escape") { setOpen(false); return; }
      if (open) return;
      const lower = e.key.toLowerCase();
      if (lower === "d") nav({ to: "/detect" });
      else if (lower === "r") nav({ to: "/submit-rumor" });
      else if (lower === "h") nav({ to: "/history" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, nav]);

  // Hide on login pages
  if (path === "/login" || path === "/signup") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed bottom-4 right-4 z-40 items-center gap-1.5 rounded-full border border-cyan/40 bg-[color:var(--bg-surface)]/80 px-3 py-1.5 text-xs text-cyan hover:bg-cyan/10 backdrop-blur"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-3.5 w-3.5" /> ? shortcuts
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Keyboard Shortcuts</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <ul className="space-y-2">
              {SHORTCUTS.map((s) => (
                <li key={s.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <kbd className="rounded border border-[color:var(--border)] bg-[color:var(--bg-deep)] px-2 py-0.5 font-mono text-xs text-cyan">{s.key}</kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
