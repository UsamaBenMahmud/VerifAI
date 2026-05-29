import jsPDF from "jspdf";
import type { AnalysisResult } from "@/lib/detectApi";
import { bandFor } from "@/lib/detectApi";

export function generateAnalysisPDF(result: AnalysisResult, analysisId?: string | null) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const band = bandFor(result.score);
  const now = new Date();

  const page = (fn: () => void) => { fn(); };

  // ---------- Page 1: Cover ----------
  page(() => {
    doc.setFillColor(6, 7, 11);
    doc.rect(0, 0, pw, ph, "F");
    doc.setTextColor(0, 229, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("VerifAI", 56, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(160, 160, 180);
    doc.text("Deepfake Detection Report", 56, 130);

    // Big score
    const [r, g, b] = hexToRgb(band.color);
    doc.setFillColor(r, g, b);
    doc.circle(pw / 2, ph / 2, 100, "F");
    doc.setTextColor(6, 7, 11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    doc.text(String(result.score), pw / 2, ph / 2 + 18, { align: "center" });
    doc.setFontSize(11);
    doc.text("TRUST / 100", pw / 2, ph / 2 + 50, { align: "center" });

    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(band.en.replace(/^[^A-Za-z]+/, ""), pw / 2, ph / 2 + 140, { align: "center" });
    doc.setTextColor(160, 160, 180);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Confidence: ${result.confidence.toFixed(1)}% ± ${result.confidenceMargin.toFixed(1)}%`, pw / 2, ph / 2 + 165, { align: "center" });

    // Footer
    doc.setTextColor(120, 120, 140);
    doc.setFontSize(9);
    doc.text(`Generated ${now.toLocaleString()}  ·  ${analysisId ?? "—"}`, 56, ph - 40);
    doc.text("verifaibd.lovable.app", pw - 56, ph - 40, { align: "right" });
  });

  // ---------- Page 2: Verdict + scores ----------
  doc.addPage();
  page(() => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
    sectionHeader(doc, "Verdict & Sub-scores", 2);

    let y = 130;
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 50);
    const verdict = result.riskFactors[0];
    if (verdict) {
      doc.setFont("helvetica", "bold");
      doc.text(verdict.titleEn, 56, y);
      doc.setFont("helvetica", "normal");
      y += 18;
      doc.text(wrap(doc, verdict.detailEn, pw - 112), 56, y);
      y += 50;
    }

    // Sub-score bars (only real ones from HF)
    const bars = [
      { label: "Facial Artifact Score", val: result.subScores.vision, color: band.color, source: "HF EfficientNet-B2 model output (1 − fake_probability)" },
      { label: "Model Confidence", val: result.confidence, color: "#A78BFA", source: "Max(p_fake, p_real) from HF model" },
    ];
    bars.forEach((b) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 30);
      doc.text(b.label, 56, y);
      doc.setTextColor(80, 80, 100);
      doc.text(`${b.val}%`, pw - 56, y, { align: "right" });
      y += 8;
      doc.setFillColor(230, 230, 235);
      doc.rect(56, y, pw - 112, 8, "F");
      const [r, g, blue] = hexToRgb(b.color);
      doc.setFillColor(r, g, blue);
      doc.rect(56, y, (pw - 112) * (Math.max(0, Math.min(100, b.val)) / 100), 8, "F");
      y += 16;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 140);
      doc.text(b.source, 56, y);
      y += 22;
    });

    pageFooter(doc, 2);
  });

  // ---------- Page 3: Evidence ----------
  doc.addPage();
  page(() => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
    sectionHeader(doc, "Evidence & Risk Factors", 3);

    let y = 130;
    result.riskFactors.forEach((r) => {
      const color = r.severity === "HIGH" ? "#FF3B5C" : r.severity === "MED" ? "#FFB830" : "#00C896";
      const [cr, cg, cb] = hexToRgb(color);
      doc.setFillColor(cr, cg, cb);
      doc.rect(56, y - 10, 4, 40, "F");
      doc.setFontSize(9);
      doc.setTextColor(cr, cg, cb);
      doc.setFont("helvetica", "bold");
      doc.text(`[${r.severity}]`, 68, y);
      doc.setTextColor(20, 20, 30);
      doc.text(r.titleEn, 110, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 100);
      const lines = wrap(doc, r.detailEn, pw - 130);
      doc.text(lines, 68, y + 16);
      y += 16 + (Array.isArray(lines) ? lines.length : 1) * 12 + 14;
      if (y > ph - 80) { doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,pw,ph,"F"); y = 80; }
    });

    pageFooter(doc, 3);
  });

  // ---------- Page 4: Methodology ----------
  doc.addPage();
  page(() => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, ph, "F");
    sectionHeader(doc, "Methodology", 4);

    const paras = [
      "Model: EfficientNet-B2 (6-channel), fine-tuned on FaceForensics++ and Celeb-DF v2 for face manipulation and synthetic-generation detection. Runs on a Hugging Face Space; first call may take 30–60s if the Space is cold.",
      "Pipeline: 1) Video upload → temporary Storage. 2) HF Space inference returns fake/real probability per video. 3) Google Gemini (2.5 Flash) generates the bilingual explanation and risk-factor list from the model output. 4) Result persisted; 24-hour auto-delete.",
      "Calibration: Raw model probabilities are mapped to a 0–100 trust score. Confidence is max(p_fake, p_real). When the model returns 45–65% (uncertainty band), the score is widened to discourage false confidence.",
      "Roadmap signals not yet measured (do not appear in this report): EXIF/C2PA metadata integrity, reverse-image / knowledge-graph context, audio-visual lip-sync. These were removed from the score cards rather than shown with placeholder numbers.",
      "Limitations: No deepfake detector is 100% accurate. Use this score as one input. For BD legal action, escalate via the Report button or BD Cyber Crime Unit.",
    ];
    let y = 130;
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 50);
    paras.forEach((p) => {
      const lines = wrap(doc, p, pw - 112);
      doc.text(lines, 56, y);
      y += (Array.isArray(lines) ? lines.length : 1) * 13 + 12;
    });

    pageFooter(doc, 4);
  });

  doc.save(`verifai-report-${analysisId ?? Date.now()}.pdf`);
}

function sectionHeader(doc: jsPDF, title: string, pageNum: number) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(6, 7, 11);
  doc.rect(0, 0, pw, 80, "F");
  doc.setTextColor(0, 229, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, 56, 50);
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 180);
  doc.text(`VerifAI Report  ·  Page ${pageNum}`, pw - 56, 50, { align: "right" });
}

function pageFooter(doc: jsPDF, pageNum: number) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 160);
  doc.text(`verifaibd.lovable.app  ·  ${new Date().toLocaleString()}  ·  page ${pageNum}`, 56, ph - 30);
}

function wrap(doc: jsPDF, text: string, width: number) {
  return doc.splitTextToSize(text, width);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
