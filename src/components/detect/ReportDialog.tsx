import { useState } from "react";
import { X, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ReportDialog({ analysisId, onClose }: { analysisId: string | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return toast.error("Tell us why you're reporting this");
    if (!analysisId) return toast.error("Run an analysis first");
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("analysis_reports").insert({
        analysis_id: analysisId,
        reporter_id: user?.id ?? null,
        reporter_email: email.trim() || user?.email || null,
        reason: reason.trim(),
        status: "open",
      });
      if (error) throw error;
      toast.success("Report submitted — admins will review it");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Could not submit report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl font-bold flex items-center gap-2"><Flag className="h-5 w-5 text-danger" /> Report this analysis</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Flag suspicious results, mislabeled verdicts, or content that violates BD Cyber Crime law. Admins will review.</p>
        <label className="text-xs uppercase tracking-widest text-muted-foreground">Reason</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="e.g. This is a known authentic video but flagged as deepfake…"
          className="mt-1 w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-danger" />
        <label className="text-xs uppercase tracking-widest text-muted-foreground mt-3 block">Email (optional)</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com"
          className="mt-1 w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-danger" />
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-md bg-danger text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {busy ? "Submitting…" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}
