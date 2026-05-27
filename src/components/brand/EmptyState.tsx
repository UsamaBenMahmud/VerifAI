import { Link } from "@tanstack/react-router";

export function EmptyState({
  icon, title, subtitle, ctaLabel, ctaTo, onCta,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      {ctaLabel && ctaTo && (
        <Link to={ctaTo} className="mt-5 inline-flex rounded-md bg-cyan px-4 py-2 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan">{ctaLabel}</Link>
      )}
      {ctaLabel && !ctaTo && onCta && (
        <button onClick={onCta} className="mt-5 inline-flex rounded-md bg-cyan px-4 py-2 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan">{ctaLabel}</button>
      )}
    </div>
  );
}
