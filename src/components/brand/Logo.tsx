export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const dot = size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`${dot} rounded-full bg-cyan animate-pulse-dot`} aria-hidden />
      <span className={`${text} font-display font-bold tracking-[0.18em] text-foreground`}>
        VERIF<span className="text-cyan text-glow-cyan">AI</span>
      </span>
    </div>
  );
}
