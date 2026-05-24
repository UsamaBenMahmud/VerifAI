export function passwordScore(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Too short", color: "bg-muted" },
    { label: "Weak", color: "bg-danger" },
    { label: "Fair", color: "bg-warning" },
    { label: "Strong", color: "bg-safe" },
  ] as const;
  return { score: s as 0 | 1 | 2 | 3, ...map[s] };
}

export function PasswordStrength({ pw }: { pw: string }) {
  const { score, label, color } = passwordScore(pw);
  if (!pw) return null;
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i < score ? color : "bg-[color:var(--border)]"}`} />
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
