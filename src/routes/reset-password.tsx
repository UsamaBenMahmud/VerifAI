import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { GridBackground } from "@/components/brand/GridBackground";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — VerifAI" }] }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== confirm) return toast.error("Passwords don't match");
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Signing you in...");
    nav({ to: "/detect" });
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <GridBackground />
      <div className="relative w-full max-w-md glass-strong rounded-2xl p-8">
        <div className="flex justify-center"><Logo size="lg" /></div>
        <h1 className="mt-6 font-display text-2xl font-bold text-center">Set a new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="password" required minLength={8} placeholder="New password" value={pw} onChange={e => setPw(e.target.value)}
            className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
          <PasswordStrength pw={pw} />
          <input type="password" required placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)}
            className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none" />
          {confirm && (pw === confirm
            ? <div className="text-xs text-safe">✓ Passwords match</div>
            : <div className="text-xs text-danger">Passwords don't match</div>)}
          <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan disabled:opacity-50">
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
