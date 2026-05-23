import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help & Support — VerifAI" },
    { name: "description", content: "Step-by-step guide for deepfake abuse victims. Bangla-first crisis hotlines, legal steps, and FAQ." },
    { property: "og:title", content: "VerifAI — Help for Deepfake Victims" },
    { property: "og:description", content: "Bangla and English support, hotlines, and FAQ for deepfake abuse." },
  ]}),
  component: HelpPage,
});

const steps = [
  { n: 1, e: "🔍", en: "Analyze it on VerifAI", bn: "VerifAI-তে বিশ্লেষণ করুন", dEn: "Run the content through our detection tool to get a forensic-grade evidence report.", dBn: "প্রমাণসহ ফরেনসিক রিপোর্ট পেতে কনটেন্টটি আমাদের ডিটেকশন টুলে চালান।" },
  { n: 2, e: "📸", en: "Screenshot everything", bn: "সব স্ক্রিনশট নিন", dEn: "Capture URLs, accounts, timestamps, and original posts before they're deleted.", dBn: "মুছে যাওয়ার আগে URL, অ্যাকাউন্ট, সময় এবং মূল পোস্টের স্ক্রিনশট নিন।" },
  { n: 3, e: "📄", en: "Download the legal PDF report", bn: "আইনি PDF রিপোর্ট ডাউনলোড করুন", dEn: "Our report is formatted for law enforcement and includes the full evidence chain.", dBn: "আমাদের রিপোর্টটি আইন প্রয়োগকারী সংস্থার জন্য ফরম্যাট করা এবং পূর্ণ প্রমাণ-চেইন অন্তর্ভুক্ত।" },
  { n: 4, e: "🚔", en: "File a complaint", bn: "অভিযোগ দায়ের করুন", dEn: "Contact BD Cyber Crime Unit, National Emergency Service 999, or your local police.", dBn: "BD সাইবার ক্রাইম ইউনিট, জাতীয় জরুরি সেবা ৯৯৯ অথবা স্থানীয় থানায় যোগাযোগ করুন।" },
  { n: 5, e: "💬", en: "Reach out for support", bn: "মানসিক সহায়তা নিন", dEn: "You are not alone. Connect with mental health and victim support organizations.", dBn: "আপনি একা নন। মানসিক স্বাস্থ্য ও ভুক্তভোগী সহায়তা সংস্থার সাথে যোগাযোগ করুন।" },
];

const faqs = [
  {
    qEn: "What file types are supported?", qBn: "কোন কোন ফাইল টাইপ সাপোর্ট করে?",
    aEn: "Images: JPG, PNG, WEBP. Videos: MP4, AVI, MOV. URLs to public posts on Facebook, YouTube, Telegram, and major news sites. Max 50MB per upload.",
    aBn: "ছবি: JPG, PNG, WEBP। ভিডিও: MP4, AVI, MOV। Facebook, YouTube, Telegram ও প্রধান সংবাদ সাইটের পাবলিক পোস্টের URL। সর্বোচ্চ ৫০MB।",
  },
  {
    qEn: "Is my data stored or shared?", qBn: "আমার ডেটা কি সংরক্ষণ বা শেয়ার করা হয়?",
    aEn: "No. All uploads are encrypted in transit and at rest, auto-deleted after 24 hours, and never used to train models or build a face database. Only the trust score is retained for aggregate stats.",
    aBn: "না। সব আপলোড এনক্রিপ্টেড, ২৪ ঘণ্টায় স্বয়ংক্রিয়ভাবে মুছে যায়, কখনোই মডেল ট্রেনিং বা মুখের ডেটাবেসে ব্যবহৃত হয় না। শুধু ট্রাস্ট স্কোর সংরক্ষিত হয়।",
  },
  {
    qEn: "How accurate is the detection?", qBn: "ডিটেকশন কতটা নির্ভুল?",
    aEn: "Our ensemble (EfficientNet-B0 + ResNet-50 + ViT-B/16) achieves ~85% accuracy on Bangla and English test sets. We always show confidence intervals — never 100% certainty. Always combine AI detection with critical thinking.",
    aBn: "আমাদের ensemble (EfficientNet-B0 + ResNet-50 + ViT-B/16) বাংলা ও ইংরেজি টেস্ট সেটে ~৮৫% নির্ভুল। আমরা সবসময় কনফিডেন্স ব্যবধান দেখাই — কখনো ১০০% নয়।",
  },
  {
    qEn: "Why does it say 'Model weights not found'?", qBn: "'Model weights not found' কেন দেখায়?",
    aEn: "This happens when the inference API is temporarily unreachable. VerifAI falls back to our HuggingFace mirror automatically. If both fail, you'll see offline demo results — try again in a moment.",
    aBn: "ইনফারেন্স API সাময়িকভাবে অনুপলব্ধ হলে এটি হয়। VerifAI স্বয়ংক্রিয়ভাবে HuggingFace mirror-এ চলে যায়। দুটোই ব্যর্থ হলে অফলাইন ডেমো রেজাল্ট দেখাবে।",
  },
  {
    qEn: "What types of deepfakes can it detect?", qBn: "কী ধরনের ডিপফেক শনাক্ত করতে পারে?",
    aEn: "Face-swap (Faceswap, DeepFaceLab), face-reenactment (Face2Face, NeuralTextures), and fully synthetic GAN faces (StyleGAN, Stable Diffusion). Voice deepfakes and full-body synthesis are coming in Phase 3.",
    aBn: "Face-swap (Faceswap, DeepFaceLab), face-reenactment (Face2Face), এবং সম্পূর্ণ সিন্থেটিক GAN মুখ (StyleGAN, Stable Diffusion)। ভয়েস ডিপফেক ও পূর্ণ-শরীর সিন্থেসিস Phase 3-এ আসছে।",
  },
  {
    qEn: "Can I use it on a real person's photo to verify?", qBn: "আসল মানুষের ছবি যাচাই করতে পারব?",
    aEn: "Yes, with their consent. VerifAI checks for manipulation artifacts — an authentic photo of a real person should return a high trust score (70+). Never run someone's photo without their permission.",
    aBn: "হ্যাঁ, তাদের সম্মতি নিয়ে। VerifAI ম্যানিপুলেশনের চিহ্ন খোঁজে — আসল ছবি উচ্চ ট্রাস্ট স্কোর (৭০+) দেবে। সম্মতি ছাড়া কারো ছবি ব্যবহার করবেন না।",
  },
  {
    qEn: "How does the score breakdown work?", qBn: "স্কোর ব্রেকডাউন কীভাবে কাজ করে?",
    aEn: "Four sub-scores are weighted into the final trust score: Vision (45%), Metadata (15%), Knowledge Match (20%), Audio-Visual Sync (20%). Each is shown with evidence so journalists can verify our reasoning.",
    aBn: "চারটি সাব-স্কোর ওজনযুক্ত হয়ে চূড়ান্ত ট্রাস্ট স্কোর তৈরি করে: Vision (৪৫%), Metadata (১৫%), Knowledge Match (২০%), Audio-Visual Sync (২০%)। প্রতিটি প্রমাণসহ দেখানো হয়।",
  },
  {
    qEn: "Does it work offline?", qBn: "অফলাইনে কাজ করে?",
    aEn: "Phase 3 (Q4 2026) will ship offline detection via Ollama for environments with limited connectivity.",
    aBn: "Phase 3 (Q4 ২০২৬) সীমিত সংযোগের পরিবেশের জন্য Ollama-র মাধ্যমে অফলাইন ডিটেকশন আনবে।",
  },
  {
    qEn: "Can I use VerifAI for my newsroom?", qBn: "নিউজরুমের জন্য ব্যবহার করতে পারি?",
    aEn: "Yes — Phase 2 ships a bulk REST API and a dedicated newsroom dashboard with CSV export. Contact us for early access.",
    aBn: "হ্যাঁ — Phase 2 বাল্ক REST API ও CSV এক্সপোর্টসহ ডেডিকেটেড নিউজরুম ড্যাশবোর্ড আনছে।",
  },
];

function HelpPage() {
  const { lang } = useLang();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">{t("I found a deepfake of me — what do I do?", "আমার একটি ডিপফেক পেয়েছি — কী করব?", lang)}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t("Follow these steps. We're here to help.", "এই ধাপগুলো অনুসরণ করুন। আমরা সাহায্য করতে এখানে আছি।", lang)}</p>

      <nav className="mt-6 flex flex-wrap gap-2 text-xs">
        <a href="#steps" className="px-3 py-1.5 rounded-full border border-cyan/40 text-cyan hover:bg-cyan/10">{t("5 Steps", "৫ ধাপ", lang)}</a>
        <a href="#hotlines" className="px-3 py-1.5 rounded-full border border-cyan/40 text-cyan hover:bg-cyan/10">{t("Hotlines", "হটলাইন", lang)}</a>
        <a href="#faq" className="px-3 py-1.5 rounded-full border border-cyan/40 text-cyan hover:bg-cyan/10">{t("FAQ", "প্রশ্নোত্তর", lang)}</a>
        <Link to="/laws" className="px-3 py-1.5 rounded-full border border-cyan/40 text-cyan hover:bg-cyan/10">{t("Cyber Laws", "সাইবার আইন", lang)}</Link>
      </nav>

      <div id="steps" className="mt-8 space-y-4">
        {steps.map(s => (
          <div key={s.n} className="glass rounded-xl p-5 flex gap-4">
            <div className="h-10 w-10 rounded-full bg-cyan/15 border border-cyan/40 flex items-center justify-center font-display font-bold text-cyan shrink-0">{s.n}</div>
            <div>
              <h3 className="font-display font-semibold text-lg">{s.e} {t(s.en, s.bn, lang)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(s.dEn, s.dBn, lang)}</p>
            </div>
          </div>
        ))}
      </div>

      <div id="hotlines" className="mt-10 rounded-xl border-2 border-danger/40 bg-danger/5 p-6">
        <h2 className="font-display text-xl font-bold text-danger flex items-center gap-2"><Phone className="h-5 w-5" /> {t("Crisis Hotlines (Bangladesh)", "জরুরি হটলাইন (বাংলাদেশ)", lang)}</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md bg-[color:var(--bg-deep)]/60 p-3"><div className="text-xs text-muted-foreground uppercase tracking-widest">{t("Women Helpline", "নারী হেল্পলাইন", lang)}</div><div className="font-mono text-2xl text-danger mt-1">109</div></div>
          <div className="rounded-md bg-[color:var(--bg-deep)]/60 p-3"><div className="text-xs text-muted-foreground uppercase tracking-widest">{t("Emergency", "জরুরি", lang)}</div><div className="font-mono text-2xl text-danger mt-1">999</div></div>
          <div className="rounded-md bg-[color:var(--bg-deep)]/60 p-3"><div className="text-xs text-muted-foreground uppercase tracking-widest">{t("Cyber Crime Unit", "সাইবার ক্রাইম ইউনিট", lang)}</div><div className="font-mono text-lg text-danger mt-1">02-9512382</div></div>
        </div>
        <p className="mt-4 text-sm text-foreground/90">{t("You are not alone. Deepfake abuse is a crime, ", "আপনি একা নন। ডিপফেক অপব্যবহার একটি অপরাধ, ", lang)}<strong>{t("not your fault", "আপনার দোষ নয়", lang)}</strong>.</p>
      </div>

      <h2 id="faq" className="mt-12 font-display text-2xl font-bold">{t("Frequently Asked Questions", "প্রায়শই জিজ্ঞাসিত প্রশ্ন", lang)}</h2>
      <p className="text-sm text-muted-foreground mt-1">{t("Common questions about VerifAI", "VerifAI সম্পর্কিত সাধারণ প্রশ্ন", lang)}</p>
      <div className="mt-4 space-y-2">
        {faqs.map((f, i) => (
          <div key={f.qEn} className="glass rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-semibold">{t(f.qEn, f.qBn, lang)}</span>
              <ChevronDown className={`h-4 w-4 transition shrink-0 ml-3 ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-muted-foreground">{t(f.aEn, f.aBn, lang)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
