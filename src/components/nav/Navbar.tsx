import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { UserMenu } from "@/components/nav/UserMenu";
import { AdminSessionTimer } from "@/components/nav/AdminSessionTimer";
import { getHistory } from "@/lib/localStore";

const baseLinks = [
  { to: "/", label: "Home" },
  { to: "/detect", label: "Detect" },
  { to: "/submit-rumor", label: "🚨 Report Rumor", danger: true },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/history", label: "History", historyOnly: true },
  { to: "/laws", label: "Laws" },
  { to: "/help", label: "Help" },
  { to: "/docs", label: "Docs" },
  { to: "/scoring", label: "Scoring" },
] as const;
const adminLink = { to: "/admin", label: "Admin" } as const;

export function Navbar() {
  const { lang, toggle } = useLang();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<{ email: string; id: string } | null>(null);
  const [role, setRole] = useState<"admin" | "user">("user");
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    setHasHistory(getHistory().length > 0);
    let cancelled = false;

    const syncProfileRole = async (userId: string, fallbackRole: unknown) => {
      const initialRole = fallbackRole === "admin" ? "admin" : "user";
      setRole(initialRole);
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      if (!cancelled) setRole(profile?.role === "admin" ? "admin" : initialRole);
    };

    const applySession = (session: any) => {
      const u = session?.user;
      if (!u) { setAuthed(null); setRole("user"); return; }
      setAuthed({ email: u.email ?? "", id: u.id });
      const fallbackRole = u.user_metadata?.role;
      window.setTimeout(() => { void syncProfileRole(u.id, fallbackRole); }, 0);
    };

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) applySession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [path]);

  const onAdminExpire = async () => {
    sessionStorage.removeItem("adminSessionStart");
    await supabase.auth.signOut();
  };

  const visibleLinks = baseLinks.filter((l: any) => !l.historyOnly || hasHistory || authed);

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-[color:var(--border)]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="shrink-0"><Logo /></Link>
        <ul className="hidden lg:flex items-center gap-1">
          {[...visibleLinks, ...(role === "admin" ? [adminLink] : [])].map((l: any) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            const danger = !!l.danger;
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  title={danger ? "Report suspicious content" : undefined}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition inline-flex items-center gap-1.5 ${
                    danger
                      ? (active ? "text-danger" : "text-danger/80 hover:text-danger")
                      : (active ? "text-cyan text-glow-cyan" : "text-muted-foreground hover:text-foreground")
                  }`}
                >
                  {danger && <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse-dot" />}
                  {l.label}
                </Link>
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
            {[...visibleLinks, ...(role === "admin" ? [adminLink] : [])].map((l: any) => (
              <li key={l.to}>
                <Link to={l.to} onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm ${l.danger ? "text-danger hover:bg-danger/10" : "hover:bg-cyan/10"}`}>
                  {l.danger && <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />}{l.label}
                </Link>
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
