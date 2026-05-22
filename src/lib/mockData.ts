export type TrendingItem = {
  id: string;
  title: string;
  titleBn: string;
  category: "Political" | "Harassment" | "Commercial" | "Unknown";
  trustScore: number;
  source: string;
  sourceCredibility: number;
  detectedAt: string;
  status: "Verified Deepfake" | "Pending Review" | "Authentic";
};

export const trendingDeepfakes: TrendingItem[] = [
  { id: "VAI-2026-0847", title: "Fake video of MP making inflammatory remarks", titleBn: "এমপির উস্কানিমূলক মন্তব্যের ভুয়া ভিডিও", category: "Political", trustScore: 8, source: "bdnews-fake.xyz", sourceCredibility: 8, detectedAt: "2 min ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0846", title: "Manipulated clip of cricketer endorsing crypto scam", titleBn: "ক্রিপ্টো স্ক্যামে ক্রিকেটারের জাল এন্ডোর্সমেন্ট", category: "Commercial", trustScore: 12, source: "win-bd-247.com", sourceCredibility: 14, detectedAt: "14 min ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0845", title: "NCII synthetic image targeting university student", titleBn: "বিশ্ববিদ্যালয়ের শিক্ষার্থীর বিরুদ্ধে এনসিআইআই", category: "Harassment", trustScore: 4, source: "telegram://leak-channel", sourceCredibility: 2, detectedAt: "32 min ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0844", title: "AI voice of central bank governor announcing fake policy", titleBn: "কেন্দ্রীয় ব্যাংক গভর্নরের জাল কণ্ঠ", category: "Political", trustScore: 17, source: "facebook.com/page/fake-bb", sourceCredibility: 22, detectedAt: "1 hr ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0843", title: "Doctored sermon clip going viral on WhatsApp", titleBn: "হোয়াটসঅ্যাপে ভাইরাল জাল ওয়াজ ক্লিপ", category: "Political", trustScore: 22, source: "whatsapp-forward", sourceCredibility: 11, detectedAt: "2 hr ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0842", title: "Synthetic celebrity endorsement for fraud betting app", titleBn: "জুয়ার অ্যাপের ভুয়া তারকা প্রচারণা", category: "Commercial", trustScore: 9, source: "bet365-bd.xyz", sourceCredibility: 5, detectedAt: "3 hr ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0841", title: "Authentic press briefing footage", titleBn: "প্রকৃত প্রেস ব্রিফিং ফুটেজ", category: "Political", trustScore: 91, source: "pmo.gov.bd", sourceCredibility: 96, detectedAt: "4 hr ago", status: "Authentic" },
  { id: "VAI-2026-0840", title: "Suspected face-swap on news anchor reel", titleBn: "সংবাদ পাঠকের সন্দেহজনক ফেস-সোয়াপ", category: "Unknown", trustScore: 34, source: "tiktok-clone.app", sourceCredibility: 18, detectedAt: "5 hr ago", status: "Pending Review" },
  { id: "VAI-2026-0839", title: "Manipulated protest footage from Dhaka rally", titleBn: "ঢাকার সমাবেশের সম্পাদিত ফুটেজ", category: "Political", trustScore: 19, source: "x.com/anon-acct", sourceCredibility: 28, detectedAt: "7 hr ago", status: "Verified Deepfake" },
  { id: "VAI-2026-0838", title: "Cloned voice scam targeting elderly", titleBn: "প্রবীণদের লক্ষ্য করে ক্লোন কণ্ঠ প্রতারণা", category: "Commercial", trustScore: 11, source: "voip-unknown", sourceCredibility: 6, detectedAt: "9 hr ago", status: "Verified Deepfake" },
];

export const dailyDetections = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${30 - i}`,
  detected: Math.round(20 + Math.sin(i / 3) * 12 + Math.random() * 18),
  authentic: Math.round(40 + Math.cos(i / 4) * 10 + Math.random() * 14),
}));

export const categoryBreakdown = [
  { name: "Mon", Political: 12, Harassment: 8, Commercial: 6, Unknown: 4 },
  { name: "Tue", Political: 16, Harassment: 10, Commercial: 9, Unknown: 3 },
  { name: "Wed", Political: 22, Harassment: 7, Commercial: 11, Unknown: 5 },
  { name: "Thu", Political: 18, Harassment: 12, Commercial: 8, Unknown: 6 },
  { name: "Fri", Political: 28, Harassment: 14, Commercial: 13, Unknown: 4 },
  { name: "Sat", Political: 31, Harassment: 11, Commercial: 16, Unknown: 7 },
  { name: "Sun", Political: 24, Harassment: 9, Commercial: 12, Unknown: 5 },
];

export const adminAnalyses = Array.from({ length: 24 }, (_, i) => ({
  id: `VAI-2026-${(900 - i).toString().padStart(4, "0")}`,
  user: `usr_${(Math.random().toString(36).slice(2, 8))}`,
  type: ["Video", "Image", "URL", "Audio"][i % 4],
  trustScore: Math.round(Math.random() * 100),
  vision: Math.round(Math.random() * 100),
  metadata: Math.round(Math.random() * 100),
  context: Math.round(Math.random() * 100),
  reasoning: Math.round(Math.random() * 100),
  duration: (3 + Math.random() * 4).toFixed(1) + "s",
  costBdt: (1.4 + Math.random() * 1.2).toFixed(2),
  ts: `2026-05-22 ${(10 + (i % 12)).toString().padStart(2, "0")}:${(i * 7 % 60).toString().padStart(2, "0")}`,
}));

export const hourly = Array.from({ length: 24 }, (_, i) => ({
  hr: `${i}:00`,
  runs: Math.round(20 + Math.sin(i / 3) * 14 + Math.random() * 10),
}));

export const agentPerf = [
  { agent: "Vision", accuracy: 89, latency: 1.8, errors: 0.4 },
  { agent: "Metadata", accuracy: 94, latency: 0.6, errors: 0.1 },
  { agent: "Context", accuracy: 82, latency: 2.1, errors: 1.2 },
  { agent: "Reasoning", accuracy: 91, latency: 1.4, errors: 0.6 },
];
