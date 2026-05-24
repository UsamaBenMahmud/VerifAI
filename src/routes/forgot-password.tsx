import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { GridBackground } from "@/components/brand/GridBackground";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — VerifAI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <GridBackground />
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-8">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <h1 className="mt-6 font-display text-2xl font-bold text-center">Forgot password?</h1>
        <p className="text-center text-sm text-muted-foreground" lang="bn">পাসওয়ার্ড রিসেট লিংক পাঠান</p>

        {sent ? (
          <div className="mt-6 rounded-md border border-safe/40 bg-safe/10 p-4 text-sm text-safe text-center">
            Check your email for reset instructions.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
            <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-cyan hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
