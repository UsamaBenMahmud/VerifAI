import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bandFor } from "@/lib/detectApi";

export const Route = createFileRoute("/embed/$id")({
  head: ({ params }) => ({ meta: [
    { title: `VerifAI Badge — ${params.id}` },
    { name: "robots", content: "noindex" },
  ]}),
  component: EmbedBadge,
});

function EmbedBadge() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("analyses").select("trust_score, verdict, fake_probability, confidence").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) setErr(error?.message || "Not found");
      else setRow(data);
    });
  }, [id]);

  if (err) return <div className="p-3 text-xs font-mono text-danger">VerifAI: {err}</div>;
  if (!row) return <div className="p-3 text-xs font-mono text-muted-foreground">Loading…</div>;

  const score = Math.round(row.trust_score ?? 50);
  const band = bandFor(score);

  return (
    <a
      href={`https://verifaibd.lovable.app/?a=${id}`}
      target="_blank"
      rel="noreferrer"
      className="block w-full h-full no-underline"
      style={{ background: "var(--bg-deep)", color: "white", padding: 12, borderRadius: 8, border: `1px solid ${band.color}`, fontFamily: "system-ui, sans-serif" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            height: 64, width: 64, borderRadius: "50%",
            background: band.color, color: "#06070b",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 22, boxShadow: `0 0 18px ${band.color}80`,
          }}
        >
          {score}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: band.color }}>VerifAI Trust</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{band.en.replace(/^[^A-Za-z]+/, "")}</div>
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
            Confidence {Math.round(row.confidence ?? 0)}%  ·  Tap to view full report
          </div>
        </div>
      </div>
    </a>
  );
}
