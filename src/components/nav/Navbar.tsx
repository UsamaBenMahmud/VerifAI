import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "Home" },
  { to: "/detect", label: "Detect" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/laws", label: "Laws" },
  { to: "/help", label: "Help" },
  { to: "/docs", label: "Technical Docs" },
  { to: "/admin", label: "Admin" },
] as const;

export function Navbar() {
  const { lang, toggle } = useLang();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const onLogout = async () => { await supabase.auth.signOut(); };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-[color:var(--border)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <ul className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    active ? "text-cyan text-glow-cyan" : "text-muted-foreground hover:text-foreground"
                  }`}
                >{l.label}</Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-md border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-mono hover:border-cyan transition"
            title="Toggle language"
          >
            {lang === "bn" ? "🇧🇩 বাং" : "🇬🇧 EN"}
          </button>
          {authed ? (
            <button onClick={onLogout} className="hidden sm:inline-flex rounded-md border border-cyan/40 px-3 py-1.5 text-sm text-cyan hover:bg-cyan/10 transition">Logout</button>
          ) : (
            <Link to="/login" className="hidden sm:inline-flex rounded-md border border-cyan/60 px-3 py-1.5 text-sm text-cyan hover:bg-cyan/10 hover:glow-cyan transition">Login</Link>
          )}
          <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="lg:hidden border-t border-[color:var(--border)] glass-strong">
          <ul className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md hover:bg-cyan/10 text-sm">{l.label}</Link>
              </li>
            ))}
            {!authed && <li><Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-cyan text-sm">Login</Link></li>}
          </ul>
        </div>
      )}
    </header>
  );
}
