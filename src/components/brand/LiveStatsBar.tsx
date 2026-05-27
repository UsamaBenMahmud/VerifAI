import { useEffect, useState } from "react";
import { bumpAndGetLiveStats } from "@/lib/localStore";
import { useCountUp } from "@/lib/useCountUp";

export function LiveStatsBar() {
  const [stats, setStats] = useState(() => bumpAndGetLiveStats());
  useEffect(() => {
    const id = setInterval(() => setStats(bumpAndGetLiveStats()), 5000);
    return () => clearInterval(id);
  }, []);
  const scans = useCountUp(stats.analyses);
  const detected = useCountUp(stats.deepfakes);
  const users = useCountUp(stats.citizens);
  return (
    <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
      <Stat label="Scans" value={scans} />
      <Stat label="Detected" value={detected} accent="danger" />
      <Stat label="Users" value={users} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "danger" }) {
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--bg-surface)]/60 px-3 py-2">
      <div className={`font-mono text-lg ${accent === "danger" ? "text-danger" : "text-cyan"}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
