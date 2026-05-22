import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";
import { GridBackground } from "@/components/brand/GridBackground";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — VerifAI" }, { name: "description", content: "Create a VerifAI account." }]}),
  component: SignupPage,
});

const roles = ["citizen", "journalist", "researcher", "organization"];

function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState("citizen");
  const [loading, setLoading] = useState(false);

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: window.location.origin, data: { role } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created. Check your email to verify."); nav({ to: "/login" });
  };
  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <GridBackground />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-violet/10 blur-3xl" />
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-8">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <h1 className="mt-6 font-display text-2xl font-bold text-center">Join the trust layer</h1>
        <form onSubmit={onSignup} className="mt-6 space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan outline-none" />
          <input type="password" required minLength={6} placeholder="Password (min 6 chars)" value={pw} onChange={e => setPw(e.target.value)} className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan outline-none" />
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">I am a...</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan outline-none capitalize">
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan hover:glow-cyan-strong disabled:opacity-50">{loading ? "Creating..." : "Create Account"}</button>
        </form>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex-1 h-px bg-[color:var(--border)]" />OR<div className="flex-1 h-px bg-[color:var(--border)]" /></div>
        <button onClick={onGoogle} className="mt-4 w-full rounded-md border border-cyan/40 py-2.5 text-sm hover:bg-cyan/10">Continue with Google</button>
        <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-cyan hover:underline">Login</Link></p>
        <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Powered by Lovable Cloud</p>
      </div>
    </div>
  );
}
