// POST /api/analyze-image — TruthLens BD pipeline (VIDEO):
// upload to Storage → Gradio 4 queue flow against HF Space → parse verdict
// string → call Lovable AI for bilingual explanation → save to DB → return.
import { createFileRoute } from "@tanstack/react-router";

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

function normalizeHfSpaceUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/$/, "");
  const match = trimmed.match(/^https:\/\/huggingface\.co\/spaces\/([^/]+)\/([^/]+)$/i);
  if (!match) return trimmed;
  return `https://${match[1]}-${match[2]}.hf.space`;
}

function isSleepingText(s: string): boolean {
  return /sleep|starting|loading|building|waking/i.test(s);
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

          // 1. Parse form (video file)
          const formData = await request.formData();
          const file = formData.get("file");
          if (!(file instanceof File)) return json({ error: "No file provided" }, 400);
          if (!file.type.startsWith("video/")) return json({ error: "Only video files are supported" }, 400);
          if (file.size > 50 * 1024 * 1024) return json({ error: "Max 50MB" }, 400);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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
          const mediaUrl = urlData.signedUrl;

          // 3. Run HF Space (video deepfake detector, Gradio 4 queue flow)
          const modelResult = await callDeepfakeModel(file, buffer, normalizeHfSpaceUrl(HF_MODEL_URL));

          // 4. Generate bilingual explanation via Lovable AI
          const explanation = await generateBilingualExplanation(modelResult, LOVABLE_API_KEY);

          // 5. Save to DB (image_url column stores any media URL; cosmetic)
          const { data: analysis, error: dbError } = await supabaseAdmin
            .from("analyses")
            .insert({
              image_url: mediaUrl,
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
          if (message.startsWith("HF_SLEEPING:")) {
            return json({ error: "Model is waking up, try again in ~30s" }, 503);
          }
          return json({ error: message }, 500);
        }
      },
    },
  },
});

// ----- Hugging Face Space (Gradio 4 video queue flow) -----
type ModelResult = {
  trust_score: number;
  fake_probability: number;
  real_probability: number;
  verdict: string;
  verdict_bn: string;
  confidence: number;
  model_version: string;
};

async function callDeepfakeModel(
  file: File,
  buffer: ArrayBuffer,
  hfUrl: string,
): Promise<ModelResult> {
  const base = hfUrl.replace(/\/$/, "");
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 60_000);

  try {
    // --- Step 1: upload the video file to Gradio's tmp storage ---
    const uploadForm = new FormData();
    uploadForm.append("files", new Blob([buffer], { type: file.type }), file.name);
    const uploadRes = await fetch(`${base}/gradio_api/upload`, {
      method: "POST",
      body: uploadForm,
      signal: ctrl.signal,
    });
    if (uploadRes.status === 503) throw new Error("HF_SLEEPING:upload 503");
    if (!uploadRes.ok) {
      const txt = await uploadRes.text().catch(() => "");
      if (isSleepingText(txt)) throw new Error(`HF_SLEEPING:${txt.slice(0, 80)}`);
      throw new Error(`HF upload failed ${uploadRes.status}: ${txt.slice(0, 200)}`);
    }
    const uploaded = (await uploadRes.json()) as unknown;
    const serverPath = Array.isArray(uploaded) && typeof uploaded[0] === "string" ? uploaded[0] : null;
    if (!serverPath) throw new Error("HF upload did not return a file path");

    // --- Step 2: enqueue predict with FileData payload ---
    const fileDataPayload = {
      path: serverPath,
      url: `${base}/gradio_api/file=${serverPath}`,
      orig_name: file.name,
      size: file.size,
      mime_type: file.type,
      meta: { _type: "gradio.FileData" },
    };
    const enqueueRes = await fetch(`${base}/gradio_api/call/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [fileDataPayload] }),
      signal: ctrl.signal,
    });
    if (enqueueRes.status === 503) throw new Error("HF_SLEEPING:enqueue 503");
    if (!enqueueRes.ok) {
      const txt = await enqueueRes.text().catch(() => "");
      if (isSleepingText(txt)) throw new Error(`HF_SLEEPING:${txt.slice(0, 80)}`);
      throw new Error(`HF enqueue failed ${enqueueRes.status}: ${txt.slice(0, 200)}`);
    }
    const { event_id: eventId } = (await enqueueRes.json()) as { event_id?: string };
    if (!eventId) throw new Error("HF enqueue did not return event_id");

    // --- Step 3: SSE-poll for the complete event ---
    const streamRes = await fetch(`${base}/gradio_api/call/predict/${eventId}`, {
      method: "GET",
      signal: ctrl.signal,
    });
    if (streamRes.status === 503) throw new Error("HF_SLEEPING:stream 503");
    if (!streamRes.ok || !streamRes.body) {
      const txt = await streamRes.text().catch(() => "");
      if (isSleepingText(txt)) throw new Error(`HF_SLEEPING:${txt.slice(0, 80)}`);
      throw new Error(`HF stream failed ${streamRes.status}: ${txt.slice(0, 200)}`);
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let result: unknown = null;
    let sawComplete = false;
    while (!sawComplete) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of frame.split("\n")) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        const dataStr = dataLines.join("\n");
        if (eventName === "complete") {
          try {
            const parsed = JSON.parse(dataStr) as unknown[];
            result = parsed?.[0];
          } catch {
            throw new Error(`HF complete payload not JSON: ${dataStr.slice(0, 200)}`);
          }
          sawComplete = true;
          break;
        }
        if (eventName === "error") {
          if (isSleepingText(dataStr)) throw new Error(`HF_SLEEPING:${dataStr.slice(0, 80)}`);
          throw new Error(`HF returned error: ${dataStr.slice(0, 200)}`);
        }
      }
    }
    if (!sawComplete) throw new Error("HF stream ended without complete event");

    return parseVerdict(result);
  } finally {
    clearTimeout(timeout);
  }
}

// HF Space may return:
//   "FAKE (87.2%) ⚠️"            (single label + pct)
//   "REAL: 0.56% | FAKE: 99.44%"  (both labels)
//   { label: "FAKE", confidence: 0.872 }  (structured)
// Always derive fake_probability directly from a FAKE match when present.
function parseVerdict(payload: unknown): ModelResult {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload ?? "");
  console.log("[analyze-image] HF raw verdict:", raw.slice(0, 500));

  // Find every label→number pair in the string
  const pairs: Array<{ label: "REAL" | "FAKE"; pct: number }> = [];
  const re = /(REAL|FAKE)[^\d-]*?(\d+(?:\.\d+)?)/gi;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(raw)) !== null) {
    const label = mm[1].toUpperCase() as "REAL" | "FAKE";
    let n = parseFloat(mm[2]);
    if (n <= 1) n = n * 100; // decimal probability → percent
    pairs.push({ label, pct: Math.max(0, Math.min(100, n)) });
  }
  if (pairs.length === 0) throw new Error(`Could not parse HF verdict: ${raw.slice(0, 200)}`);

  // Prefer the FAKE pair if we have one; else infer from REAL.
  const fakePair = pairs.find((p) => p.label === "FAKE");
  const realPair = pairs.find((p) => p.label === "REAL");
  const fakePct = fakePair ? fakePair.pct : 100 - (realPair?.pct ?? 0);

  const fakeProb = fakePct / 100;
  const realProb = 1 - fakeProb;
  const isFake = fakeProb >= 0.5;
  const trustScore = Math.round(realProb * 100);
  const confidence = Math.round(Math.max(fakePct, 100 - fakePct));
  return {
    trust_score: trustScore,
    fake_probability: Number(fakeProb.toFixed(4)),
    real_probability: Number(realProb.toFixed(4)),
    verdict: isFake ? "Likely Deepfake" : "Likely Authentic",
    verdict_bn: isFake ? "সম্ভবত ডিপফেক" : "সম্ভবত আসল",
    confidence,
    model_version: "efficientnet-b2-6ch-v1",
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
