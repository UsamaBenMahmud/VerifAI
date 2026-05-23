import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";
import { GridBackground } from "@/components/brand/GridBackground";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — VerifAI" }, { name: "description", content: "Sign in to your VerifAI account, sign up, or access the admin console." }]}),
  component: LoginPage,
});

type Mode = "login" | "signup" | "admin";

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back."); nav({ to: "/detect" });
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: name, role: "citizen" } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created. Check your email to confirm.");
    setMode("login");
  };

  const onAdmin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) { setLoading(false); toast.error(error?.message || "Login failed"); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      toast.error("Not authorized — admin role required");
      return;
    }
    toast.success("Admin signed in"); nav({ to: "/admin" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); return; }
    if (!result.redirected) { toast.success("Signed in."); nav({ to: "/detect" }); }
  };

  const isAdmin = mode === "admin";

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <GridBackground />
      <div className={`absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full blur-3xl ${isAdmin ? "bg-violet/10" : "bg-cyan/10"}`} />
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-8">
        <div className="flex justify-center"><Logo size="lg" /></div>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-3 gap-1 p-1 rounded-lg bg-[color:var(--bg-deep)] border border-[color:var(--border)]">
          {([
            { k: "login", icon: User, label: "Sign In" },
            { k: "signup", icon: User, label: "Sign Up" },
            { k: "admin", icon: Shield, label: "Admin" },
          ] as const).map(({ k, icon: Icon, label }) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-semibold transition ${
                mode === k
                  ? k === "admin"
                    ? "bg-violet/20 text-violet border border-violet/40"
                    : "bg-cyan/20 text-cyan border border-cyan/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {mode === "login" && (
          <>
            <h1 className="mt-6 font-display text-2xl font-bold text-center">Sign in to VerifAI</h1>
            <form onSubmit={onLogin} className="mt-6 space-y-3">
              <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
              <input type="password" required placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
              <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan hover:glow-cyan-strong disabled:opacity-50">{loading ? "Signing in..." : "Login with Email"}</button>
            </form>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-[color:var(--border)]" />OR<div className="flex-1 h-px bg-[color:var(--border)]" /></div>
            <button onClick={onGoogle} className="mt-4 w-full rounded-md border border-cyan/40 py-2.5 text-sm hover:bg-cyan/10">Continue with Google</button>
            <p className="mt-6 text-center text-sm text-muted-foreground">New here? <button onClick={() => setMode("signup")} className="text-cyan hover:underline">Create an account</button></p>
          </>
        )}

        {mode === "signup" && (
          <>
            <h1 className="mt-6 font-display text-2xl font-bold text-center">Create your account</h1>
            <p className="mt-1 text-xs text-center text-muted-foreground">Free forever. No card required.</p>
            <form onSubmit={onSignup} className="mt-6 space-y-3">
              <input required placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
              <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
              <input type="password" required minLength={6} placeholder="Password (6+ chars)" value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
              <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan disabled:opacity-50">{loading ? "Creating..." : "Sign Up"}</button>
            </form>
            <button onClick={onGoogle} className="mt-3 w-full rounded-md border border-cyan/40 py-2.5 text-sm hover:bg-cyan/10">Continue with Google</button>
            <p className="mt-6 text-center text-sm text-muted-foreground">Have an account? <button onClick={() => setMode("login")} className="text-cyan hover:underline">Sign in</button></p>
          </>
        )}

        {mode === "admin" && (
          <>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-violet" />
              <h1 className="font-display text-2xl font-bold text-violet">Admin Console</h1>
            </div>
            <p className="mt-1 text-xs text-center text-muted-foreground">Restricted access. Audit-logged.</p>
            <form onSubmit={onAdmin} className="mt-6 space-y-3">
              <input type="email" required placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-violet/40 px-3 py-2.5 text-sm focus:border-violet focus:ring-2 focus:ring-violet/30 outline-none" />
              <input type="password" required placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-violet/40 px-3 py-2.5 text-sm focus:border-violet focus:ring-2 focus:ring-violet/30 outline-none" />
              <button disabled={loading} className="w-full rounded-md bg-violet py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ boxShadow: "0 0 20px rgba(123,47,255,0.4)" }}>{loading ? "Verifying..." : "Sign in as Admin"}</button>
            </form>
            <p className="mt-4 text-[11px] text-center text-muted-foreground">Admin role is granted by an existing administrator. Contact <span className="text-violet font-mono">admin@verifai.app</span> for access.</p>
          </>
        )}

        <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Powered by Lovable Cloud</p>
      </div>
    </div>
  );
}
