import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { UserMenu } from "@/components/nav/UserMenu";
import { AdminSessionTimer } from "@/components/nav/AdminSessionTimer";

const links = [
  { to: "/", label: "Home" },
  { to: "/detect", label: "Detect" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/laws", label: "Laws" },
  { to: "/help", label: "Help" },
  { to: "/docs", label: "Docs" },
  { to: "/scoring", label: "Scoring" },
  { to: "/admin", label: "Admin" },
] as const;

export function Navbar() {
  const { lang, toggle } = useLang();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<{ email: string; id: string } | null>(null);
  const [role, setRole] = useState<"admin" | "user">("user");

  useEffect(() => {
    const refresh = async (sessionUser?: { id: string; email: string | null } | null) => {
      const u = sessionUser ?? (await supabase.auth.getUser()).data.user;
      if (!u) { setAuthed(null); setRole("user"); return; }
      setAuthed({ email: u.email ?? "", id: u.id });
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", u.id).maybeSingle();
      setRole(profile?.role === "admin" ? "admin" : "user");
    };
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => refresh(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const onAdminExpire = async () => {
    sessionStorage.removeItem("adminSessionStart");
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-[color:var(--border)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <ul className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            return (
              <li key={l.to}>
                <Link to={l.to} className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                  active ? "text-cyan text-glow-cyan" : "text-muted-foreground hover:text-foreground"
                }`}>{l.label}</Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <button onClick={toggle}
            className="rounded-md border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-mono hover:border-cyan transition"
            title="Toggle language">
            {lang === "bn" ? "🇧🇩 বাং" : "🇬🇧 EN"}
          </button>

          {authed ? (
            <>
              {role === "admin" && <AdminSessionTimer onExpire={onAdminExpire} />}
              <UserMenu initial={(authed.email[0] || "U").toUpperCase()} email={authed.email} role={role} />
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition">Login</Link>
              <Link to="/login" search={{ mode: "user", intent: "signup" }}
                className="rounded-md bg-cyan px-3 py-1.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan hover:glow-cyan-strong transition">
                Try Free →
              </Link>
            </div>
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
            {!authed ? (
              <>
                <li><Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-muted-foreground text-sm">Login</Link></li>
                <li><Link to="/login" search={{ mode: "user", intent: "signup" }} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md text-cyan text-sm font-semibold">Try Free →</Link></li>
              </>
            ) : (
              <li>
                <button onClick={async () => { sessionStorage.removeItem("adminSessionStart"); await supabase.auth.signOut(); setOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-danger text-sm">Logout</button>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
