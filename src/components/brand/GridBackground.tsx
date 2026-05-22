export function GridBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 grid-bg radial-fade opacity-60 ${className}`} aria-hidden />
  );
}
