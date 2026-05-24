import { useState } from "react";

export function PromptTabs({ tabs }: { tabs: { label: string; code: string }[] }) {
  const [i, setI] = useState(0);
  return (
    <div className="rounded-lg border border-[color:var(--border)] overflow-hidden">
      <div className="flex flex-wrap gap-1 bg-[color:var(--bg-deep)] border-b border-[color:var(--border)] p-1">
        {tabs.map((t, idx) => (
          <button
            key={t.label}
            onClick={() => setI(idx)}
            className={`px-3 py-1.5 text-xs rounded transition ${
              i === idx ? "bg-cyan/20 text-cyan border border-cyan/40" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <pre className="bg-[color:var(--bg-deep)] text-xs font-mono p-4 overflow-x-auto text-cyan/90 scrollbar-cyan max-h-[420px]">
        <code>{tabs[i].code}</code>
      </pre>
    </div>
  );
}
