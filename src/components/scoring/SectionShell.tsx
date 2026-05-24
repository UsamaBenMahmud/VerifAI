import { Check, X, Clock } from "lucide-react";

export function ItemHeader({ ok, title, points, status }: { ok: boolean; title: string; points: number; status?: "pending" }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded ${
        status === "pending" ? "bg-warning/20 text-warning" : ok ? "bg-safe/20 text-safe" : "bg-danger/20 text-danger"
      }`}>
        {status === "pending" ? <Clock className="h-3 w-3" /> : ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
      </div>
      <span className="text-cyan font-mono text-sm font-bold shrink-0">+{points}</span>
    </div>
  );
}

export function Badge({ label, tone }: { label: string; tone: "green" | "cyan" | "violet" | "warning" | "danger" }) {
  const map = {
    green: "bg-safe/15 text-safe border-safe/30",
    cyan: "bg-cyan/15 text-cyan border-cyan/40",
    violet: "bg-violet/15 text-violet border-violet/40",
    warning: "bg-warning/15 text-warning border-warning/40",
    danger: "bg-danger/15 text-danger border-danger/40",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border ${map[tone]}`}>
      {label}
    </span>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] p-3 text-xs font-mono overflow-x-auto text-cyan/90 scrollbar-cyan">
      <code>{code}</code>
    </pre>
  );
}
