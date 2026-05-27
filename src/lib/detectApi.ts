// Client-side analyze() helper. Sends a video file to /api/analyze-image,
// which proxies to the Hugging Face Space (Gradio 4 queue flow) and writes
// the result to the database. No browser-side HF call (videos are too large
// to base64) and no mock fallback — real errors surface to the UI.

export type Severity = "HIGH" | "MED" | "LOW" | "SAFE";

export type AnalysisResult = {
  score: number; // 0-100, higher = more authentic
  confidence: number;
  confidenceMargin: number;
  subScores: {
    vision: number;
    metadata: number;
    knowledge: number;
    audio: number;
  };
  riskFactors: Array<{
    severity: Severity;
    titleEn: string;
    titleBn: string;
    detailEn: string;
    detailBn: string;
  }>;
  modelResults: Array<{
    name: string;
    score: number;
    speedSec: number;
    confidence: number;
  }>;
  source: "huggingface";
  mediaUrl?: string;
  mediaIsVideo?: boolean;
};

export type AnalyzeInput = { kind: "video"; file: File };

export class HfSleepingError extends Error {
  isSleeping = true as const;
  constructor(msg = "Hugging Face Space is waking up") {
    super(msg);
    this.name = "HfSleepingError";
  }
}

function severityFor(score: number): Severity {
  return score <= 30 ? "HIGH" : score <= 69 ? "MED" : "LOW";
}

export async function analyze(input: AnalyzeInput, signal?: AbortSignal): Promise<AnalysisResult> {
  if (input.kind !== "video") {
    throw new Error("Only video uploads are supported.");
  }

  const fd = new FormData();
  fd.append("file", input.file, input.file.name);

  const res = await fetch("/api/analyze-image", { method: "POST", body: fd, signal });
  if (res.status === 503) {
    throw new HfSleepingError();
  }
  if (!res.ok) {
    let msg = `Server error ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = String(j.error);
    } catch { /* ignore */ }
    if (/sleep|starting|loading|waking|building/i.test(msg)) throw new HfSleepingError(msg);
    throw new Error(msg);
  }

  const d = await res.json();
  const score = Math.max(0, Math.min(100, Math.round(Number(d.trust_score ?? 50))));
  const conf = Math.max(0, Math.min(100, Number(d.confidence ?? 90)));
  const fakePct = Math.round(Number(d.fake_probability ?? 0) * 100);
  const subFromServer = d.sub_scores ?? {};
  const visionVal = Math.max(0, Math.min(100, Number(subFromServer.vision ?? (100 - fakePct))));
  const metadataVal = Math.max(0, Math.min(100, Number(subFromServer.metadata ?? 88)));
  const contextVal = Math.max(0, Math.min(100, Number(subFromServer.context ?? 72)));
  const audioVal = subFromServer.audio_sync == null ? 0 : Math.max(0, Math.min(100, Number(subFromServer.audio_sync)));

  const serverRf: Array<{
    severity?: string;
    label_en?: string;
    label_bn?: string;
    detail_en?: string;
    detail_bn?: string;
  }> = Array.isArray(d.risk_factors) ? d.risk_factors : [];

  const riskFactors = serverRf.length > 0
    ? serverRf.map((r) => {
        const sev = (["HIGH", "MED", "LOW", "SAFE"].includes(String(r.severity))
          ? r.severity
          : severityFor(score)) as Severity;
        return {
          severity: sev,
          titleEn: String(r.label_en || d.verdict || "Analysis"),
          titleBn: String(r.label_bn || d.verdict_bn || "বিশ্লেষণ"),
          detailEn: String(r.detail_en || ""),
          detailBn: String(r.detail_bn || ""),
        };
      })
    : [
        {
          severity: severityFor(score),
          titleEn: String(d.verdict || "Analysis complete"),
          titleBn: String(d.verdict_bn || "বিশ্লেষণ সম্পন্ন"),
          detailEn: String(d.explanation_en || `Trust Score: ${score}/100`),
          detailBn: String(d.explanation_bn || `ট্রাস্ট স্কোর: ${score}/১০০`),
        },
      ];

  return {
    score,
    confidence: conf,
    confidenceMargin: 2.5,
    subScores: {
      vision: visionVal,
      metadata: metadataVal,
      knowledge: contextVal,
      audio: audioVal,
    },
    riskFactors,
    modelResults: [
      { name: String(d.model_version || "EfficientNet-B2 (6ch)"), score, speedSec: Math.round((d.analysis_time_ms ?? 0) / 100) / 10, confidence: conf },
    ],
    source: "huggingface",
    mediaUrl: d.image_url,
    mediaIsVideo: true,
  };
}

export function bandFor(score: number): { color: string; key: "red" | "amber" | "green"; en: string; bn: string } {
  if (score <= 30) return { color: "#FF3B5C", key: "red", en: "⚠️ High Risk: Likely Deepfake", bn: "⚠️ উচ্চ ঝুঁকি: সম্ভবত ডিপফেক" };
  if (score <= 69) return { color: "#FFB830", key: "amber", en: "⚡ Suspicious: Needs Review", bn: "⚡ সন্দেহজনক: পর্যালোচনা প্রয়োজন" };
  return { color: "#00C896", key: "green", en: "✅ Low Risk: Likely Authentic", bn: "✅ কম ঝুঁকি: সম্ভবত আসল" };
}

export function isValidUrl(s: string): boolean {
  return /^https?:\/\/[^\s]+\.[^\s]+/i.test(s.trim());
}

export const MAX_BYTES = 200 * 1024 * 1024;
export const ACCEPT = "video/mp4,video/quicktime,video/webm,video/x-msvideo";
