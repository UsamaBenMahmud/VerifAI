import { supabase } from "@/integrations/supabase/client";

export type LinkKey = "youtube" | "github" | "demo" | "figma" | "huggingface" | "api_docs" | "n8n";

export type LinkRow = { key: LinkKey; url: string | null; updated_at: string };

export async function fetchSubmissionLinks(): Promise<Record<LinkKey, string | null>> {
  const { data, error } = await supabase.from("submission_links").select("key, url");
  const out: Record<string, string | null> = {
    youtube: null, github: null, demo: null, figma: null,
    huggingface: null, api_docs: null, n8n: null,
  };
  if (!error && data) data.forEach((r) => (out[r.key] = r.url));
  return out as Record<LinkKey, string | null>;
}

export async function saveSubmissionLink(key: LinkKey, url: string | null) {
  return supabase
    .from("submission_links")
    .upsert({ key, url, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export function validateLink(key: LinkKey, url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    switch (key) {
      case "youtube": return /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === "youtu.be";
      case "github": return /(^|\.)github\.com$/.test(u.hostname);
      case "figma": return /(^|\.)figma\.com$/.test(u.hostname);
      default: return true;
    }
  } catch { return false; }
}

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/").pop() || null;
    }
  } catch { /* noop */ }
  return null;
}
