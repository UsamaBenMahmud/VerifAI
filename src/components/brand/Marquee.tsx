import type { ReactNode } from "react";

export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      <div className="inline-flex animate-marquee">
        <div className="inline-flex items-center gap-12 px-6">{children}</div>
        <div className="inline-flex items-center gap-12 px-6" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
