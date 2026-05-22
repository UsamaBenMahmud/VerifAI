import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";
import { GridBackground } from "@/components/brand/GridBackground";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — VerifAI" }, { name: "description", content: "Sign in to your VerifAI account." }]}),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back."); nav({ to: "/detect" });
  };
  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); return; }
    if (!result.redirected) { toast.success("Signed in."); nav({ to: "/detect" }); }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <GridBackground />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-cyan/10 blur-3xl" />
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-8">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <h1 className="mt-6 font-display text-2xl font-bold text-center">Sign in to VerifAI</h1>
        <form onSubmit={onLogin} className="mt-6 space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
          <input type="password" required placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
          <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan hover:glow-cyan-strong disabled:opacity-50">{loading ? "Signing in..." : "Login with Email"}</button>
        </form>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-[color:var(--border)]" />OR<div className="flex-1 h-px bg-[color:var(--border)]" /></div>
        <button onClick={onGoogle} className="mt-4 w-full rounded-md border border-cyan/40 py-2.5 text-sm hover:bg-cyan/10">Continue with Google</button>
        <p className="mt-6 text-center text-sm text-muted-foreground">Don't have an account? <Link to="/signup" className="text-cyan hover:underline">Sign up</Link></p>
        <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Powered by Lovable Cloud</p>
      </div>
    </div>
  );
}
