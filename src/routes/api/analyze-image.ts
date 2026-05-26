// POST /api/analyze-image — TruthLens BD pipeline:
// upload to Storage → call HF deepfake model → call Lovable AI for bilingual
// explanation → save to DB → return result.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/analyze-image")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      POST: async ({ request }) => {
        const startTime = Date.now();
        try {
          const HF_MODEL_URL = process.env.HF_MODEL_URL;
          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!HF_MODEL_URL) return json({ error: "HF_MODEL_URL not configured" }, 500);
          if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

          // 1. Parse form
          const formData = await request.formData();
          const file = formData.get("file");
          if (!(file instanceof File)) return json({ error: "No file provided" }, 400);
          if (!file.type.startsWith("image/")) return json({ error: "Only images allowed" }, 400);
          if (file.size > 10 * 1024 * 1024) return json({ error: "Max 10MB" }, 400);

          // 2. Upload to Storage
          const fileName = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
          const buffer = await file.arrayBuffer();
          const { error: uploadError } = await supabaseAdmin.storage
            .from("uploads")
            .upload(fileName, buffer, { contentType: file.type, upsert: false });
          if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

          const { data: urlData, error: urlError } = await supabaseAdmin.storage
            .from("uploads")
            .createSignedUrl(fileName, 86400);
          if (urlError || !urlData) throw new Error(`Signed URL failed: ${urlError?.message}`);
          const imageUrl = urlData.signedUrl;

          // 3. Call Hugging Face model
          const modelResult = await callDeepfakeModel(file, buffer, HF_MODEL_URL);

          // 4. Generate bilingual explanation via Lovable AI
          const explanation = await generateBilingualExplanation(modelResult, LOVABLE_API_KEY);

          // 5. Save to DB
          const { data: analysis, error: dbError } = await supabaseAdmin
            .from("analyses")
            .insert({
              image_url: imageUrl,
              original_filename: file.name,
              file_size_bytes: file.size,
              trust_score: modelResult.trust_score,
              fake_probability: modelResult.fake_probability,
              real_probability: modelResult.real_probability,
              verdict: modelResult.verdict,
              verdict_bn: modelResult.verdict_bn,
              confidence: modelResult.confidence,
              model_version: modelResult.model_version,
              explanation_en: explanation.en,
              explanation_bn: explanation.bn,
              analysis_time_ms: Date.now() - startTime,
            })
            .select()
            .single();
          if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

          return json(analysis);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[analyze-image]", message);
          return json({ error: message }, 500);
        }
      },
    },
  },
});

// ----- Hugging Face Space (Gradio) -----
type ModelResult = {
  trust_score: number;
  fake_probability: number;
  real_probability: number;
  verdict: string;
  verdict_bn: string;
  confidence: number;
  model_version: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function callDeepfakeModel(
  file: File,
  buffer: ArrayBuffer,
  hfUrl: string,
): Promise<ModelResult> {
  const base64 = bytesToBase64(new Uint8Array(buffer));
  const dataUrl = `data:${file.type};base64,${base64}`;

  const res = await fetch(`${hfUrl.replace(/\/$/, "")}/run/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [dataUrl] }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HF model error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const result = (await res.json()) as { data?: unknown[] };
  const payload = result.data?.[0];
  if (!payload || typeof payload !== "object") {
    throw new Error("HF model returned unexpected shape");
  }
  const p = payload as Partial<ModelResult>;
  return {
    trust_score: Number(p.trust_score ?? 0),
    fake_probability: Number(p.fake_probability ?? 0),
    real_probability: Number(p.real_probability ?? 0),
    verdict: String(p.verdict ?? ""),
    verdict_bn: String(p.verdict_bn ?? ""),
    confidence: Number(p.confidence ?? 0),
    model_version: String(p.model_version ?? "unknown"),
  };
}

// ----- Lovable AI Gateway (Gemini) for bilingual explanation -----
async function generateBilingualExplanation(
  m: ModelResult,
  apiKey: string,
): Promise<{ en: string; bn: string }> {
  const prompt = `You are a forensic AI analyst for TruthLens BD, a Bangla-first deepfake detection platform.

Analysis Results:
- Trust Score: ${m.trust_score}/100
- Fake Probability: ${(m.fake_probability * 100).toFixed(1)}%
- Verdict: ${m.verdict}
- Confidence: ${m.confidence}%

Generate a clear, calm, professional explanation in BOTH Bangla and English.
- Never claim 100% certainty
- Explain what the score means
- Suggest what the user should do next
- Keep each explanation under 80 words
- Use simple, accessible language

Return ONLY valid JSON in this exact format:
{"en": "English explanation here...", "bn": "বাংলা ব্যাখ্যা এখানে..."}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate limit exceeded. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response missing JSON");
  const parsed = JSON.parse(match[0]) as { en?: string; bn?: string };
  return { en: parsed.en ?? "", bn: parsed.bn ?? "" };
}
