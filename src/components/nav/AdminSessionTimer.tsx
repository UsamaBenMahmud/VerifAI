import { useEffect, useState } from "react";

const SESSION_MS = 30 * 60 * 1000;

export function AdminSessionTimer({ onExpire }: { onExpire?: () => void }) {
  const [remaining, setRemaining] = useState(SESSION_MS);

  useEffect(() => {
    const start = Number(sessionStorage.getItem("adminSessionStart") || Date.now());
    if (!sessionStorage.getItem("adminSessionStart")) {
      sessionStorage.setItem("adminSessionStart", String(start));
    }
    const tick = () => {
      const elapsed = Date.now() - start;
      const left = SESSION_MS - elapsed;
      setRemaining(left);
      if (left <= 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  const left = Math.max(0, remaining);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const low = left < 5 * 60 * 1000;
  return (
    <span className={`hidden md:inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded border ${
      low ? "text-danger border-danger/40 bg-danger/10 animate-pulse" : "text-cyan border-cyan/30 bg-cyan/5"
    }`}>
      Session: {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
