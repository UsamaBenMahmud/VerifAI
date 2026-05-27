// Client-side localStorage helpers used by admin, detect, history,
// submit-rumor, and the landing page. SSR-safe (guards window).

export type StoredAnalysis = {
  id: string;
  ts: number;
  score: number;
  verdict_en: string;
  verdict_bn: string;
  category?: string;
  thumbnail?: string | null;
  url?: string | null;
  filename?: string | null;
};

export type RumorReport = {
  id: string;
  ts: number;
  url: string;
  category: string;
  platforms: string[];
  description?: string;
  urgent: boolean;
  reporter?: { name?: string; email?: string; org?: string };
};

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  plan: "free" | "journalist" | "enterprise";
  created_at: string;
  last_used: string | null;
  requests_today: number;
  requests_total: number;
  rate_limit: number;
  is_active: boolean;
};

export type SubmissionLinks = {
  youtube: string;
  github: string;
  live_demo: string;
  figma: string;
  huggingface: string;
  api_docs: string;
  n8n_workflow: string;
};

const hasWindow = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or serialization issue */
  }
}

/* ---------- Analysis history ---------- */
const HISTORY_KEY = "verifai_history";
export function getHistory(): StoredAnalysis[] {
  return read<StoredAnalysis[]>(HISTORY_KEY, []);
}
export function pushHistory(item: StoredAnalysis) {
  const all = getHistory();
  all.unshift(item);
  write(HISTORY_KEY, all.slice(0, 50));
}
export function clearHistory() {
  write(HISTORY_KEY, []);
}

/* ---------- Rumor reports ---------- */
const REPORTS_KEY = "verifai_rumor_reports";
export function getReports(): RumorReport[] {
  return read<RumorReport[]>(REPORTS_KEY, []);
}
export function pushReport(r: RumorReport) {
  const all = getReports();
  all.unshift(r);
  write(REPORTS_KEY, all.slice(0, 200));
}

/* ---------- Submission links (links spec) ---------- */
const LINKS_KEY = "verifai_submission_links";
const EMPTY_LINKS: SubmissionLinks = {
  youtube: "", github: "", live_demo: "", figma: "", huggingface: "", api_docs: "", n8n_workflow: "",
};
export function getSubmissionLinks(): SubmissionLinks {
  return { ...EMPTY_LINKS, ...read<Partial<SubmissionLinks>>(LINKS_KEY, {}) };
}
export function setSubmissionLink(key: keyof SubmissionLinks, value: string) {
  const cur = getSubmissionLinks();
  cur[key] = value;
  write(LINKS_KEY, cur);
}

/* ---------- API keys ---------- */
const KEYS_KEY = "verifai_api_keys";
export function getApiKeys(): ApiKey[] {
  return read<ApiKey[]>(KEYS_KEY, []);
}
export function saveApiKeys(keys: ApiKey[]) {
  write(KEYS_KEY, keys);
}
export function generateApiKey(name: string, plan: ApiKey["plan"]): ApiKey {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const limits: Record<ApiKey["plan"], number> = { free: 100, journalist: 1000, enterprise: 10000 };
  return {
    id: crypto.randomUUID(),
    name,
    key: `vfai_${hex}`,
    plan,
    created_at: new Date().toISOString(),
    last_used: null,
    requests_today: 0,
    requests_total: 0,
    rate_limit: limits[plan],
    is_active: true,
  };
}

/* ---------- Presentation (uploaded deck) ---------- */
export type PresentationMeta = {
  filename: string;
  uploadedAt: number;
  fileType: "pdf" | "pptx";
  size: number;
};
const PRES_DATA = "verifai_presentation";
const PRES_META = "verifai_presentation_meta";
const PRES_SLIDES = "verifai_slide_count";

export function getPresentation(): { data: string | null; meta: PresentationMeta | null; slides: number } {
  if (!hasWindow()) return { data: null, meta: null, slides: 8 };
  const data = localStorage.getItem(PRES_DATA);
  const metaRaw = localStorage.getItem(PRES_META);
  const slidesRaw = localStorage.getItem(PRES_SLIDES);
  return {
    data,
    meta: metaRaw ? (JSON.parse(metaRaw) as PresentationMeta) : null,
    slides: slidesRaw ? Math.max(1, Math.min(100, Number(slidesRaw))) : 8,
  };
}
export function setPresentation(dataBase64: string, meta: PresentationMeta) {
  if (!hasWindow()) return;
  localStorage.setItem(PRES_DATA, dataBase64);
  localStorage.setItem(PRES_META, JSON.stringify(meta));
}
export function setSlideCount(n: number) {
  if (!hasWindow()) return;
  localStorage.setItem(PRES_SLIDES, String(Math.max(1, Math.min(100, n))));
}
export function clearPresentation() {
  if (!hasWindow()) return;
  localStorage.removeItem(PRES_DATA);
  localStorage.removeItem(PRES_META);
}

/* ---------- Live stats (landing hero) ---------- */
const STATS_KEY = "verifai_live_stats";
export type LiveStats = { analyses: number; deepfakes: number; citizens: number };
const BASE: LiveStats = { analyses: 1247, deepfakes: 451, citizens: 3891 };
export function bumpAndGetLiveStats(): LiveStats {
  const cur = read<LiveStats>(STATS_KEY, BASE);
  const next: LiveStats = {
    analyses: cur.analyses + Math.floor(Math.random() * 3) + 1,
    deepfakes: cur.deepfakes + Math.floor(Math.random() * 2),
    citizens: cur.citizens + Math.floor(Math.random() * 5) + 2,
  };
  write(STATS_KEY, next);
  return next;
}

/* ---------- Url validation ---------- */
export const linkValidators: Record<keyof SubmissionLinks, (v: string) => boolean> = {
  youtube: (v) => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(v),
  github: (v) => /^https?:\/\/(www\.)?github\.com\//i.test(v),
  live_demo: (v) => /^https:\/\//i.test(v),
  figma: (v) => /^https?:\/\/(www\.)?figma\.com\//i.test(v),
  huggingface: (v) => /^https?:\/\/(www\.)?huggingface\.co\//i.test(v),
  api_docs: (v) => /^https?:\/\/.+/i.test(v),
  n8n_workflow: (v) => /^https?:\/\/.+/i.test(v),
};

export const linkPoints: Record<keyof SubmissionLinks, number> = {
  youtube: 10, github: 2, live_demo: 5, figma: 1, huggingface: 1, api_docs: 1, n8n_workflow: 1,
};

export function computeLinkScore(links: SubmissionLinks): { earned: number; max: number } {
  let earned = 0;
  let max = 0;
  (Object.keys(linkPoints) as Array<keyof SubmissionLinks>).forEach((k) => {
    max += linkPoints[k];
    if (links[k] && linkValidators[k](links[k])) earned += linkPoints[k];
  });
  return { earned, max };
}

/* ---------- Mulberry32 PRNG (seeded sub-scores) ---------- */
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- File helpers ---------- */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function base64ToBlob(dataUrl: string, fallbackType = "application/octet-stream"): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);base64/.exec(meta)?.[1] || fallbackType;
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
