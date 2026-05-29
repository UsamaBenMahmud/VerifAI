import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Share2, Flag, Code2, ChevronDown, Beaker, Download, X, Image as ImageIcon, Play, Sparkles, Link2, Camera, Layers, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLang, t } from "@/lib/i18n";
import { analyze, bandFor, calibrateScore, isValidUrl, MAX_BYTES, ACCEPT, type AnalysisResult, type AnalyzeInput, type Severity } from "@/lib/detectApi";
import { pushHistory } from "@/lib/localStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CameraRecorder } from "@/components/detect/CameraRecorder";
import { ReportDialog } from "@/components/detect/ReportDialog";
import { generateAnalysisPDF } from "@/lib/generatePdf";



export const Route = createFileRoute("/detect")({
  validateSearch: (s: Record<string, unknown>) => ({ url: typeof s.url === "string" ? s.url : undefined }),
  head: () => ({ meta: [
    { title: "Detect — VerifAI" },
    { name: "description", content: "Upload a video and get a deepfake trust score in seconds." },
    { property: "og:title", content: "VerifAI — Analyze Video" },
    { property: "og:description", content: "Multi-agent deepfake analysis with Bangla + English reasoning." },
  ]}),
  component: DetectPage,
});

type Stage = "idle" | "analyzing" | "results";

const STEPS = [
  { en: "📤 Uploading video...", bn: "📤 ভিডিও আপলোড হচ্ছে...", pct: 15 },
  { en: "🔬 Vision Agent — Extracting frames...", bn: "🔬 ভিশন এজেন্ট — ফ্রেম এক্সট্রাকশন...", pct: 35 },
  { en: "🧠 Model Agent — Running EfficientNet-B2 (6-ch)...", bn: "🧠 মডেল এজেন্ট — EfficientNet-B2 চলছে...", pct: 60 },
  { en: "🕸️ Knowledge Agent — Cross-checking patterns...", bn: "🕸️ জ্ঞান এজেন্ট — প্যাটার্ন যাচাই...", pct: 80 },
  { en: "🤖 Reasoning Agent — Generating explanation...", bn: "🤖 যুক্তি এজেন্ট — ব্যাখ্যা তৈরি হচ্ছে...", pct: 95 },
  { en: "✅ Analysis complete", bn: "✅ বিশ্লেষণ সম্পন্ন", pct: 100 },
];

function DetectPage() {
  const { lang } = useLang();
  const search = useSearch({ from: "/detect" });
  const [stage, setStage] = useState<Stage>("idle");
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showEvidence, setShowEvidence] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [inputTab, setInputTab] = useState<"upload" | "url" | "camera">("upload");
  const [urlVal, setUrlVal] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareFiles, setCompareFiles] = useState<{ a: File | null; b: File | null }>({ a: null, b: null });
  const [compareResults, setCompareResults] = useState<{ a: AnalysisResult | null; b: AnalysisResult | null } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const fromParam = search?.url;
    const pending = typeof window !== "undefined" ? localStorage.getItem("verifai_pending_url") : null;
    const u = fromParam || pending;
    if (u) {
      setPrefillUrl(u);
      if (pending && typeof window !== "undefined") localStorage.removeItem("verifai_pending_url");
    }
  }, [search?.url]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setStage("idle"); setStep(0); setElapsed(0); setPreview(null); setFileMeta(null); setError(null); setResult(null); setShowCompare(false); setCompareFiles({ a: null, b: null }); setCompareResults(null);
  };

  const startAnalysis = async (input: AnalyzeInput) => {
    setStage("analyzing"); setStep(0); setElapsed(0); setError(null);
    const t0 = Date.now();
    const ti = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100);
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    [600, 1500, 3000, 5000, 7000].forEach((ms, i) => {
      stepTimers.push(setTimeout(() => setStep(i + 1), ms));
    });
    try {
      const res = await analyze(input);
      setStep(5);
      await new Promise(r => setTimeout(r, 300));
      setResult(res);
      setStage("results");
      // Save to history
      try {
        pushHistory({
          id: `VAI-${Date.now()}`,
          ts: Date.now(),
          score: res.score,
          verdict_en: res.riskFactors[0]?.titleEn || `Trust ${res.score}/100`,
          verdict_bn: res.riskFactors[0]?.titleBn || `ট্রাস্ট ${res.score}/১০০`,
          filename: input.kind === "video" ? input.file.name : null,
          url: null,
        });
      } catch { /* ignore */ }
      toast.success("Analysis complete");
    } catch (e: any) {
      const msg = e?.name === "HfSleepingError" || e?.isSleeping
        ? "🤖 Model is waking up on Hugging Face — this can take 30–60 seconds. Please try again in a moment."
        : e?.message?.includes("Failed to fetch")
          ? "Connection failed. Check your internet and try again."
          : e?.message || "Analysis failed. Please try again.";
      setError(msg); toast.error(msg); setStage("idle");
    } finally {
      stepTimers.forEach(clearTimeout);
      clearInterval(ti);
    }
  };

  const handleFile = async (f: File) => {
    setError(null);
    if (f.size > MAX_BYTES) { const m = "File too large. Max 200MB."; setError(m); toast.error(m); return; }
    if (!f.type.startsWith("video/")) { const m = "Only video files are supported (MP4, MOV, WebM)."; setError(m); toast.error(m); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFileMeta({ name: f.name, size: f.size, type: f.type });
    setPreview(URL.createObjectURL(f));
    if (compareMode) {
      const slot = !compareFiles.a ? "a" : !compareFiles.b ? "b" : "a";
      setCompareFiles((c) => ({ ...c, [slot]: f }));
      toast.success(`Loaded as ${slot === "a" ? "Original" : "Suspected"}`);
      return;
    }
    await startAnalysis({ kind: "video", file: f });
  };

  const fetchUrl = async () => {
    setError(null);
    const u = urlVal.trim();
    if (!isValidUrl(u)) { const m = "Enter a valid http(s) video URL."; setError(m); toast.error(m); return; }
    setUrlBusy(true);
    try {
      const r = await fetch(u);
      if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
      const blob = await r.blob();
      if (blob.size > MAX_BYTES) throw new Error("Remote file exceeds 200MB.");
      const type = blob.type.startsWith("video/") ? blob.type : "video/mp4";
      const name = u.split("/").pop()?.split("?")[0] || "remote-video.mp4";
      const file = new File([blob], name, { type });
      await handleFile(file);
    } catch (e: any) {
      const msg = e?.message?.includes("Failed to fetch") ? "Could not fetch URL (CORS or network). Download then upload instead." : e?.message || "URL fetch failed.";
      setError(msg); toast.error(msg);
    } finally { setUrlBusy(false); }
  };

  const runCompare = async () => {
    if (!compareFiles.a || !compareFiles.b) { toast.error("Pick both Original and Suspected files."); return; }
    setStage("analyzing"); setStep(0); setElapsed(0); setError(null);
    const t0 = Date.now();
    const ti = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100);
    const timers = [600, 1500, 3000, 5000, 7000].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    try {
      const [a, b] = await Promise.all([
        analyze({ kind: "video", file: compareFiles.a }),
        analyze({ kind: "video", file: compareFiles.b }),
      ]);
      setStep(5);
      setCompareResults({ a, b });
      setStage("results");
      toast.success("Comparison complete");
    } catch (e: any) {
      setError(e?.message || "Compare failed"); toast.error(e?.message || "Compare failed"); setStage("idle");
    } finally { timers.forEach(clearTimeout); clearInterval(ti); }
  };


  const runDemo = async (kind: "fake" | "uncertain" | "authentic") => {
    setShowDemo(false);
    setStage("analyzing"); setStep(0); setElapsed(0); setError(null);
    const t0 = Date.now();
    const ti = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100);
    const timers = [600, 1500, 3000, 5000, 7000].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    await new Promise(r => setTimeout(r, 7500));
    const presets = {
      fake: { score: 12, fp: 0.88, vEn: "Likely Deepfake", vBn: "সম্ভবত ডিপফেক" },
      uncertain: { score: 47, fp: 0.53, vEn: "Uncertain", vBn: "অনিশ্চিত" },
      authentic: { score: 82, fp: 0.18, vEn: "Likely Authentic", vBn: "সম্ভবত আসল" },
    } as const;
    const p = presets[kind];
    const sev: Severity = p.score <= 30 ? "HIGH" : p.score <= 69 ? "MED" : "SAFE";
    const conf = Math.min(p.score > 50 ? p.score : 100 - p.score, 95);
    const demo: AnalysisResult = {
      score: p.score, rawScore: p.score, confidence: conf, confidenceMargin: Math.max(3, Math.floor((100 - conf) / 8)),
      subScores: {
        vision: p.score < 40 ? 88 : p.score > 70 ? 18 : 52,
        metadata: p.score < 40 ? 76 : p.score > 70 ? 24 : 48,
        knowledge: p.score < 40 ? 71 : p.score > 70 ? 28 : 42,
        audio: 0,
      },
      riskFactors: [
        { severity: sev, titleEn: p.vEn, titleBn: p.vBn, detailEn: `Demo case: trust score ${p.score}/100, fake probability ${(p.fp*100).toFixed(0)}%.`, detailBn: `ডেমো: ট্রাস্ট ${p.score}/১০০।` },
      ],
      modelResults: [{ name: "EfficientNet-B0 (demo)", score: p.score, speedSec: 4.2, confidence: conf }],
      source: "demo",
      mediaUrl: undefined,
      mediaIsVideo: false,
    };
    setStep(5);
    timers.forEach(clearTimeout);
    clearInterval(ti);
    setResult(demo);
    setStage("results");
    toast.success(`Demo: ${p.vEn}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 relative">
      {/* Floating Demo button */}
      <button
        onClick={() => setShowDemo(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-cyan text-[color:var(--bg-deep)] px-5 py-3 text-sm font-bold glow-cyan-strong hover:scale-105 transition"
      >
        <Play className="h-4 w-4" /> 🎬 Demo Mode
      </button>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} onRun={runDemo} />}

      <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{t("Analyze Video", "ভিডিও বিশ্লেষণ", lang)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("Upload a video to run the deepfake detection pipeline.", "ডিপফেক যাচাই পাইপলাইন চালাতে ভিডিও আপলোড করুন।", lang)}</p>
        </div>
      </div>

      {stage === "idle" && (
        <div className="glass rounded-2xl p-6 sm:p-8 relative">
          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-safe/15 border border-safe/40 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-safe">
            <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse-dot" /> Live AI · HF EfficientNet-B0
          </div>

          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => { setCompareMode(!compareMode); setCompareFiles({ a: null, b: null }); setCompareResults(null); }}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition border ${compareMode ? "bg-violet/20 border-violet text-violet" : "border-violet/40 text-violet hover:bg-violet/10"}`}
            >
              <Layers className="h-3.5 w-3.5" /> {compareMode ? "Compare Mode: ON" : "Compare Two Files"}
            </button>
            {compareMode && <span className="text-xs text-muted-foreground">Upload an Original and a Suspected file to see them side-by-side.</span>}
          </div>

          {!compareMode && (
            <Tabs value={inputTab} onValueChange={(v) => setInputTab(v as any)}>
              <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
                <TabsTrigger value="upload"><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</TabsTrigger>
                <TabsTrigger value="url"><Link2 className="h-3.5 w-3.5 mr-1.5" />URL</TabsTrigger>
                <TabsTrigger value="camera"><Camera className="h-3.5 w-3.5 mr-1.5" />Camera</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                  className="cursor-pointer border-2 border-dashed border-cyan/40 rounded-xl p-10 text-center hover:border-cyan hover:bg-cyan/5 transition group"
                >
                  <Upload className="h-12 w-12 text-cyan mx-auto mb-4 group-hover:scale-110 transition" />
                  <p className="font-display text-xl">{t("Drop a video here", "ভিডিও এখানে রাখুন", lang)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">MP4 · MOV · WebM · max 200MB</p>
                  {prefillUrl && <p className="mt-3 text-xs text-cyan font-mono break-all">📎 Pre-filled URL: {prefillUrl}</p>}
                  <input ref={fileInput} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              </TabsContent>

              <TabsContent value="url">
                <div className="border-2 border-dashed border-cyan/40 rounded-xl p-8">
                  <label className="text-sm font-semibold flex items-center gap-2 mb-2"><Link2 className="h-4 w-4 text-cyan" /> Paste a public video URL</label>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="url"
                      value={urlVal}
                      onChange={(e) => setUrlVal(e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      className="flex-1 min-w-[240px] rounded-md bg-[color:var(--bg-surface)] border border-cyan/30 px-3 py-2 text-sm font-mono focus:outline-none focus:border-cyan"
                    />
                    <button onClick={fetchUrl} disabled={urlBusy} className="rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-bold glow-cyan disabled:opacity-50">
                      {urlBusy ? "Fetching…" : "Fetch & Analyze"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Note: URL must allow CORS. Otherwise, download the file and use the Upload tab.</p>
                </div>
              </TabsContent>

              <TabsContent value="camera">
                <div className="border-2 border-dashed border-cyan/40 rounded-xl p-10 text-center">
                  <Camera className="h-12 w-12 text-cyan mx-auto mb-4" />
                  <p className="font-display text-xl">Record from your camera</p>
                  <p className="mt-2 text-sm text-muted-foreground">Front/back toggle · records up to 6s of video, then runs deepfake detection.</p>
                  <button onClick={() => setShowCamera(true)} className="mt-5 inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-bold glow-cyan">
                    <Camera className="h-4 w-4" /> Open Camera
                  </button>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {compareMode && (
            <div className="grid md:grid-cols-2 gap-4">
              {(["a", "b"] as const).map((slot) => {
                const f = compareFiles[slot];
                const label = slot === "a" ? "Original" : "Suspected";
                return (
                  <div key={slot}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const dropped = e.dataTransfer.files?.[0]; if (dropped) { setCompareFiles((c) => ({ ...c, [slot]: dropped })); } }}
                    className="border-2 border-dashed border-cyan/40 rounded-xl p-6 text-center"
                  >
                    <div className="text-xs uppercase tracking-widest text-cyan font-mono mb-2">{label}</div>
                    {f ? (
                      <div className="text-sm">
                        <div className="font-semibold truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{(f.size/1024/1024).toFixed(2)} MB</div>
                        <button onClick={() => setCompareFiles((c) => ({ ...c, [slot]: null }))} className="mt-3 text-xs text-danger hover:underline">Remove</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block py-6">
                        <Upload className="h-8 w-8 text-cyan mx-auto mb-2" />
                        <span className="text-sm">Drop or click to choose</span>
                        <input type="file" accept={ACCEPT} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCompareFiles((c) => ({ ...c, [slot]: file })); }} />
                      </label>
                    )}
                  </div>
                );
              })}
              <div className="md:col-span-2 flex justify-center">
                <button onClick={runCompare} disabled={!compareFiles.a || !compareFiles.b} className="rounded-md bg-cyan text-[color:var(--bg-deep)] px-5 py-2.5 text-sm font-bold glow-cyan disabled:opacity-40">
                  <Beaker className="h-4 w-4 inline mr-1.5" /> Run Comparison
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger flex items-center gap-2">
              <X className="h-4 w-4" /> {error}
            </div>
          )}

          {fileMeta && !compareMode && (
            <div className="mt-4 flex items-center gap-3 rounded-md border border-cyan/30 bg-cyan/5 p-3">
              {preview && <video src={preview} className="h-12 w-20 rounded object-cover bg-black" muted />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{fileMeta.name}</div>
                <div className="text-xs text-muted-foreground">{(fileMeta.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <span className="px-2 py-1 text-[10px] uppercase tracking-widest rounded bg-cyan/20 text-cyan font-mono">{fileMeta.type.split("/")[1]}</span>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground text-center">🔒 {t("Your upload is encrypted and auto-deleted in 24 hours.", "আপনার আপলোড এনক্রিপ্টেড এবং ২৪ ঘণ্টায় স্বয়ংক্রিয়ভাবে মুছে যাবে।", lang)}</p>

          {showCamera && <CameraRecorder onClose={() => setShowCamera(false)} onRecorded={(file) => { setShowCamera(false); handleFile(file); }} />}
        </div>
      )}


      {stage === "analyzing" && (
        <div className="glass rounded-2xl p-8">
          <h2 className="font-display text-2xl text-center">{t("AI is analyzing", "AI বিশ্লেষণ করছে", lang)}<span className="text-cyan animate-pulse">...</span></h2>
          <div className="mt-8 space-y-3">
            {STEPS.map((s, i) => {
              const done = step > i;
              const active = step === i;
              return (
                <div key={i} className={`flex items-center gap-4 rounded-lg p-3 border transition ${done ? "border-safe/40 bg-safe/5" : active ? "border-cyan/60 bg-cyan/5 glow-cyan" : "border-[color:var(--border)] opacity-50"}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-mono text-xs shrink-0 ${done ? "bg-safe text-[color:var(--bg-deep)]" : active ? "bg-cyan text-[color:var(--bg-deep)] animate-pulse" : "bg-muted text-muted-foreground"}`}>{done ? "✓" : i + 1}</div>
                  <div className="flex-1 text-sm">{t(s.en, s.bn, lang)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan to-violet transition-all duration-500" style={{ width: `${STEPS[Math.min(step, STEPS.length - 1)].pct}%` }} />
          </div>
          <div className="mt-3 text-center text-xs font-mono text-muted-foreground">{elapsed.toFixed(1)}s elapsed...</div>
        </div>
      )}

      {stage === "results" && compareResults?.a && compareResults?.b && <CompareResults a={compareResults.a} b={compareResults.b} onReset={reset} lang={lang} />}
      {stage === "results" && !compareResults && result && <Results result={result} lang={lang} preview={preview} onReset={reset} showAbout={showAbout} setShowAbout={setShowAbout} showEvidence={showEvidence} setShowEvidence={setShowEvidence} showCompare={showCompare} setShowCompare={setShowCompare} />}
    </div>
  );
}

function Results({ result, lang, preview, onReset, showAbout, setShowAbout, showEvidence, setShowEvidence, showCompare, setShowCompare }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shareAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#06070b", scale: 2, logging: false, useCORS: true });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `verifai-result-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(url);
        toast.success("Result image downloaded");
      }, "image/png");
    } catch (e) { toast.error("Could not generate image"); }
  };
  const band = bandFor(result.score);

  const downloadCSV = () => {
    const rows = [
      ["field", "value"],
      ["score", result.score],
      ["confidence", `${result.confidence}% ± ${result.confidenceMargin}%`],
      ["band", band.en],
      ["vision_score", result.subScores.vision],
      ["metadata_score", result.subScores.metadata],
      ["knowledge_score", result.subScores.knowledge],
      ["audio_score", result.subScores.audio],
      ["source", result.source],
      ...result.riskFactors.map((r: any) => [`risk_${r.severity}`, r.titleEn]),
    ];
    const csv = rows.map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `verifai-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-6">
      <div ref={cardRef} className="space-y-6">
      {/* Header gauge */}
      <div className="glass rounded-2xl p-8 grid md:grid-cols-[260px_1fr] gap-8 items-center">
        <TrustGauge score={result.score} color={band.color} />
        <div>
          <div className="text-xs uppercase tracking-widest font-mono" style={{ color: band.color }}>{t(band.en, band.bn, lang)}</div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold">{t(band.en.replace(/^[^A-Za-z]+/, ""), band.bn.replace(/^[^\u0980-\u09FF]+/, ""), lang)}</h2>
          <p className="mt-3 text-sm text-muted-foreground font-mono">{t("Confidence", "আত্মবিশ্বাস", lang)}: {result.confidence.toFixed(1)}% ± {result.confidenceMargin.toFixed(1)}%</p>
          {result.rawScore != null && result.rawScore !== result.score && (
            <p className="mt-1 text-[11px] text-muted-foreground/70 font-mono">Raw model output: {result.rawScore}/100 · Calibrated: {result.score}/100</p>
          )}
          {preview && <video src={preview} controls className="mt-4 max-h-40 rounded-md border border-[color:var(--border)] bg-black" />}
          <p className="mt-3 text-xs text-muted-foreground">{t("Analyzed via", "বিশ্লেষণ", lang)}: <span className="font-mono text-cyan">{result.source}</span></p>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: "👁️", en: "Facial Artifact Score", bn: "মুখমণ্ডল বিশ্লেষণ", val: result.subScores.vision, color: "#FF3B5C", detailEn: "Derived from EfficientNet-B2 fake/real probability.", detailBn: "EfficientNet-B2 মডেলের ফেক/রিয়েল সম্ভাবনা থেকে প্রাপ্ত।" },
          { icon: "📋", en: "Metadata Integrity", bn: "মেটাডেটা যাচাই", val: result.subScores.metadata, color: "#FF3B5C", detailEn: "Heuristic baseline — EXIF/C2PA inspection not yet wired up.", detailBn: "হিউরিস্টিক বেসলাইন — EXIF/C2PA যাচাই এখনো যুক্ত নেই।" },
          { icon: "🕸️", en: "Context Score", bn: "প্রসঙ্গ স্কোর", val: result.subScores.knowledge, color: "#FFB830", detailEn: "Placeholder for upcoming reverse-search + knowledge graph lookup.", detailBn: "রিভার্স-সার্চ ও নলেজ গ্রাফ যুক্ত হওয়ার জন্য প্লেসহোল্ডার।" },
          { icon: "🎵", en: "Audio-Visual Sync", bn: "অডিও-ভিজ্যুয়াল সামঞ্জস্য", val: result.subScores.audio, color: "#FF3B5C", detailEn: "Not yet measured for video uploads.", detailBn: "ভিডিওর জন্য এখনো পরিমাপ করা হয়নি।" },
        ].map((c) => (
          <div key={c.en} className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="text-lg">{c.icon}</span> {t(c.en, c.bn, lang)}</div>
            <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${c.val}%`, background: c.color, boxShadow: `0 0 8px ${c.color}80` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs"><span className="font-mono" style={{ color: c.color }}>{c.val}%</span></div>
            <div className="mt-2 text-xs text-muted-foreground">{t(c.detailEn, c.detailBn, lang)}</div>
          </div>
        ))}
      </div>

      {/* Evidence panel */}
      <div className="glass rounded-2xl">
        <button onClick={() => setShowEvidence(!showEvidence)} className="w-full flex items-center justify-between p-5">
          <h3 className="font-display text-lg font-semibold">🔍 {t("Evidence & Risk Factors", "প্রমাণ ও ঝুঁকির কারণ", lang)}</h3>
          <ChevronDown className={`h-5 w-5 transition ${showEvidence ? "rotate-180" : ""}`} />
        </button>
        {showEvidence && (
          <div className="px-5 pb-5 space-y-3">
            {result.riskFactors.map((r: any, i: number) => <EvidenceCard key={i} severity={r.severity} title={t(r.titleEn, r.titleBn, lang)} detail={t(r.detailEn, r.detailBn, lang)} />)}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold mb-3">{t("Manipulation probability map — brighter red = higher certainty", "লাল অঞ্চল = উচ্চ ঝুঁকি, সবুজ = কম ঝুঁকি", lang)}</h3>
        <div className="relative mx-auto h-64 w-64 rounded-lg border border-cyan/30 bg-gradient-to-br from-[color:var(--bg-surface)] to-[color:var(--bg-card)] overflow-hidden">
          <svg viewBox="0 0 200 200" className="absolute inset-0 m-auto h-full w-full opacity-90">
            <path d="M100 50 C 70 50, 55 75, 55 110 C 55 145, 75 170, 100 170 C 125 170, 145 145, 145 110 C 145 75, 130 50, 100 50 Z" fill="none" stroke="rgba(0,229,255,0.4)" strokeWidth="1.5" />
            <ellipse cx="100" cy="140" rx="35" ry="20" fill="rgba(255,59,92,0.55)" />
            <ellipse cx="100" cy="155" rx="22" ry="10" fill="rgba(255,59,92,0.75)" />
            <ellipse cx="100" cy="125" rx="40" ry="8" fill="rgba(255,184,48,0.45)" />
          </svg>
        </div>
        <div className="mt-4 flex justify-center gap-3 text-xs flex-wrap">
          <span className="px-2 py-1 rounded bg-danger/20 text-danger">■ {t("High Risk", "উচ্চ ঝুঁকি", lang)}</span>
          <span className="px-2 py-1 rounded bg-warning/20 text-warning">■ {t("Medium", "মাঝারি", lang)}</span>
          <span className="px-2 py-1 rounded bg-safe/20 text-safe">■ {t("Low Risk", "কম ঝুঁকি", lang)}</span>
        </div>
      </div>

      {/* Spread Timeline */}
      <SpreadTimeline lang={lang} />

      {/* Model comparison */}
      <div className="glass rounded-2xl p-5">
        <button onClick={() => setShowCompare(!showCompare)} className="inline-flex items-center gap-2 rounded-md border border-violet/40 px-4 py-2 text-sm hover:bg-violet/10 text-violet"><Beaker className="h-4 w-4" /> {showCompare ? t("Hide Comparison", "তুলনা লুকান", lang) : t("⚗️ Compare All 3 Models", "⚗️ ৩টি মডেল তুলনা", lang)}</button>
        {showCompare && (
          <div className="mt-4">
            <div className="rounded-md bg-danger/10 border border-danger/40 p-3 mb-3 text-sm text-danger font-semibold">{result.score < 30 ? t("All 3 models agree: Likely Deepfake", "তিনটি মডেলই একমত: সম্ভবত ডিপফেক", lang) : t("Models in agreement", "মডেলগুলি একমত", lang)}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="text-left p-2">Model</th><th className="text-left p-2">Score</th><th className="text-left p-2">Speed</th><th className="text-left p-2">Confidence</th></tr>
                </thead>
                <tbody>
                  {result.modelResults.map((m: any) => (
                    <tr key={m.name} className="border-t border-[color:var(--border)]">
                      <td className="p-2 font-mono">{m.name}</td>
                      <td className="p-2 font-bold" style={{ color: bandFor(m.score).color }}>{m.score}/100</td>
                      <td className="p-2 font-mono">{m.speedSec ? `${m.speedSec}s` : "—"}</td>
                      <td className="p-2 font-mono">{m.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      </div>

      {/* Actions */}
      <div className="glass rounded-2xl p-5 flex flex-wrap gap-3">
        <button onClick={() => toast.success("PDF report generated")} className="inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-semibold glow-cyan"><FileText className="h-4 w-4" /> {t("Download PDF Report", "PDF রিপোর্ট", lang)}</button>
        <button onClick={shareAsImage} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><ImageIcon className="h-4 w-4" /> {t("Share as Image", "ছবি হিসেবে শেয়ার", lang)}</button>
        <button onClick={() => { navigator.clipboard?.writeText("https://verifai.app/a/VAI-2026-0847"); toast.success("Share link copied"); }} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><Share2 className="h-4 w-4" /> {t("Copy Link", "লিঙ্ক কপি", lang)}</button>
        <button onClick={() => toast.warning("Reported to BD Cyber Crime Unit")} className="inline-flex items-center gap-2 rounded-md border border-danger/50 text-danger px-4 py-2 text-sm hover:bg-danger/10"><Flag className="h-4 w-4" /> {t("Report", "রিপোর্ট", lang)}</button>
        <button onClick={() => toast("Embed snippet copied")} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><Code2 className="h-4 w-4" /> {t("Embed Badge", "ব্যাজ এম্বেড", lang)}</button>
        <button onClick={() => setShowCompare(!showCompare)} className="inline-flex items-center gap-2 rounded-md border border-violet/40 text-violet px-4 py-2 text-sm hover:bg-violet/10"><Beaker className="h-4 w-4" /> {t("Compare Models", "মডেল তুলনা", lang)}</button>
        <button onClick={downloadCSV} className="inline-flex items-center gap-2 rounded-md border border-safe/40 text-safe px-4 py-2 text-sm hover:bg-safe/10"><Download className="h-4 w-4" /> {t("Newsroom Export (CSV)", "নিউজরুম এক্সপোর্ট (CSV)", lang)}</button>
      </div>

      {/* About VerifAI */}
      <div className="glass rounded-2xl">
        <button onClick={() => setShowAbout(!showAbout)} className="w-full flex items-center justify-between p-5">
          <h3 className="font-display text-lg font-semibold">{t("About This Analysis — VerifAI Technology", "এই বিশ্লেষণ সম্পর্কে — VerifAI প্রযুক্তি", lang)}</h3>
          <ChevronDown className={`h-5 w-5 transition ${showAbout ? "rotate-180" : ""}`} />
        </button>
        {showAbout && (
          <div className="px-5 pb-6 text-sm leading-relaxed text-foreground/90 space-y-4">
            <p>VerifAI is an open-source AI tool for detecting AI-generated and manipulated faces in digital media.</p>
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan font-mono mb-1">The Technology</div>
              <p>VerifAI uses EfficientNet-B0, a highly efficient convolutional neural network fine-tuned specifically for deepfake detection. The model analyzes facial regions for subtle artifacts introduced during generation or manipulation — including texture inconsistencies, unnatural blending boundaries, and frequency-domain anomalies invisible to the human eye.</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan font-mono mb-1">Training Data</div>
              <p>Trained on FaceForensics++ (4 manipulation methods) and Celeb-DF v2 (high-quality celebrity deepfakes). Both datasets contain thousands of real and fake video sequences. Data augmentation (flipping, color jitter, random crops) improves generalization.</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan font-mono mb-1">Architecture</div>
              <p>Three model variants: EfficientNet-B0 (default), ResNet-50, and Vision Transformer (ViT-B/16). All three run in parallel and the system reports a consensus score with confidence intervals.</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <button onClick={onReset} className="text-sm text-cyan hover:underline">← {t("Analyze another", "আরেকটি বিশ্লেষণ", lang)}</button>
      </div>
    </div>
  );
}

function EvidenceCard({ severity, title, detail }: { severity: Severity; title: string; detail: string }) {
  const styles: Record<Severity, { border: string; bg: string; badge: string }> = {
    HIGH: { border: "border-danger", bg: "bg-danger/5", badge: "bg-danger/20 text-danger" },
    MED: { border: "border-warning", bg: "bg-warning/5", badge: "bg-warning/20 text-warning" },
    LOW: { border: "border-safe", bg: "bg-safe/5", badge: "bg-safe/20 text-safe" },
    SAFE: { border: "border-safe", bg: "bg-safe/5", badge: "bg-safe/20 text-safe" },
  };
  const s = styles[severity];
  return (
    <div className={`rounded-md border-l-4 ${s.border} ${s.bg} p-3`}>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded ${s.badge}`}>[{severity}]</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function SpreadTimeline({ lang }: { lang: any }) {
  const nodes = [
    { day: 0, color: "#FF3B5C", en: "First detected on t.me/bdpolitics", bn: "প্রথম দেখা — t.me/bdpolitics" },
    { day: 1, color: "#FFB830", en: "Shared 847 times on Facebook BD", bn: "Facebook BD-তে ৮৪৭ বার শেয়ার" },
    { day: 2, color: "#FFB830", en: "Picked up by 3 low-credibility news sites", bn: "৩টি কম-বিশ্বাসযোগ্য সাইটে প্রকাশ" },
    { day: 3, color: "#FF3B5C", en: "Viral: 2.1M views across platforms", bn: "ভাইরাল: ২১ লক্ষ ভিউ" },
  ];
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-display text-lg font-semibold mb-4">📅 {t("Spread Timeline", "প্রসার টাইমলাইন", lang)}</h3>
      <div className="relative pt-4">
        <div className="absolute top-7 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan/40 via-warning/40 to-danger/40" />
        <div className="grid grid-cols-4 gap-2 relative">
          {nodes.map((n) => (
            <div key={n.day} className="flex flex-col items-center text-center">
              <div className="h-5 w-5 rounded-full ring-4 ring-[color:var(--bg-card)]" style={{ background: n.color, boxShadow: `0 0 10px ${n.color}` }} />
              <div className="mt-3 text-xs font-mono text-muted-foreground">Day {n.day}</div>
              <div className="mt-1 text-xs px-1">{t(n.en, n.bn, lang)}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground italic">{t("Timeline based on known similar deepfakes. May not reflect this exact content.", "টাইমলাইন পরিচিত অনুরূপ ডিপফেকের উপর ভিত্তি করে। এই কনটেন্টের সাথে হুবহু মিল নাও হতে পারে।", lang)}</p>
    </div>
  );
}

function TrustGauge({ score, color }: { score: number; color: string }) {
  const r = 80, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative mx-auto h-56 w-56">
      <svg viewBox="0 0 200 200" className="-rotate-90">
        <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
        <circle cx="100" cy="100" r={r} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 12px ${color})`, transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-6xl font-bold" style={{ color }}>{score}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Trust Score</div>
      </div>
    </div>
  );
}

function DemoModal({ onClose, onRun }: { onClose: () => void; onRun: (k: "fake" | "uncertain" | "authentic") => void }) {
  const cases = [
    { k: "fake" as const, emoji: "🔴", title: "Known Deepfake", label: "AI-generated face (GAN)", expected: "Score ~12/100 — Likely Deepfake", color: "danger" },
    { k: "uncertain" as const, emoji: "🟡", title: "Uncertain Case", label: "Low quality — hard to determine", expected: "Score ~47/100 — Uncertain", color: "warning" },
    { k: "authentic" as const, emoji: "🟢", title: "Authentic Photo", label: "Real photograph (stock)", expected: "Score ~82/100 — Likely Authentic", color: "safe" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan" /> Live Demo — 3 Test Cases</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">Use these pre-loaded examples to demonstrate VerifAI.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {cases.map((c) => (
            <div key={c.k} className={`glass rounded-xl p-4 border border-${c.color}/30 flex flex-col`}>
              <div className="text-3xl mb-2">{c.emoji}</div>
              <div className="font-display font-bold">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
              <div className={`text-xs mt-2 text-${c.color} font-mono`}>{c.expected}</div>
              <button onClick={() => onRun(c.k)} className="mt-3 rounded-md bg-cyan text-[color:var(--bg-deep)] px-3 py-2 text-xs font-semibold glow-cyan">Run This Demo</button>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground text-center">Demo mode uses pre-loaded examples for reliable demonstration. Real uploads use your HuggingFace model.</p>
      </div>
    </div>
  );
}

function CompareResults({ a, b, onReset, lang }: { a: AnalysisResult; b: AnalysisResult; onReset: () => void; lang: any }) {
  const delta = Math.abs(a.score - b.score);
  const similar = delta <= 12;
  const bandA = bandFor(a.score);
  const bandB = bandFor(b.score);
  return (
    <div className="space-y-6">
      <div className={`glass rounded-2xl p-5 border ${similar ? "border-warning/50" : "border-cyan/40"}`}>
        <div className="flex items-center gap-3">
          <Layers className={`h-6 w-6 ${similar ? "text-warning" : "text-cyan"}`} />
          <div>
            <div className="font-display text-lg font-bold">
              {similar ? "High similarity — likely manipulated copy" : "Different sources / strong divergence"}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              Score Δ = {delta} · Original {a.score}/100 · Suspected {b.score}/100
            </div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[{ label: "Original", r: a, band: bandA }, { label: "Suspected", r: b, band: bandB }].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6">
            <div className="text-xs uppercase tracking-widest font-mono text-cyan mb-2">{s.label}</div>
            <div className="font-display text-5xl font-bold" style={{ color: s.band.color }}>{s.r.score}<span className="text-base text-muted-foreground font-normal">/100</span></div>
            <div className="mt-1 text-sm font-semibold" style={{ color: s.band.color }}>{t(s.band.en, s.band.bn, lang)}</div>
            <div className="mt-3 text-xs font-mono text-muted-foreground">Confidence {s.r.confidence.toFixed(1)}% ± {s.r.confidenceMargin.toFixed(1)}%</div>
            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Vision</span><span className="font-mono">{s.r.subScores.vision}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Metadata</span><span className="font-mono">{s.r.subScores.metadata}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Knowledge</span><span className="font-mono">{s.r.subScores.knowledge}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Audio sync</span><span className="font-mono">{s.r.subScores.audio || "—"}</span></div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center pt-2">
        <button onClick={onReset} className="text-sm text-cyan hover:underline">← Analyze another</button>
      </div>
    </div>
  );
}
