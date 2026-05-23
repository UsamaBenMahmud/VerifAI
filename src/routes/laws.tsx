import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ExternalLink, BookOpen } from "lucide-react";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/laws")({
  head: () => ({ meta: [
    { title: "Cyber Laws — VerifAI" },
    { name: "description", content: "Cyber laws and deepfake regulations in Bangladesh, USA, UK, and India — bilingual summaries with citations." },
    { property: "og:title", content: "VerifAI — Know Your Cyber Rights" },
    { property: "og:description", content: "Bangla-first summaries of deepfake laws with how-to-file links and penalties." },
  ]}),
  component: LawsPage,
});

type Law = {
  titleEn: string; titleBn: string; year: number;
  descEn: string; descBn: string;
  penaltyEn: string; penaltyBn: string;
  citationEn: string; citationBn: string;
  link: string; fileWith?: string;
};

const countries: Record<string, { flag: string; nameEn: string; nameBn: string; laws: Law[] }> = {
  bd: {
    flag: "🇧🇩", nameEn: "Bangladesh", nameBn: "বাংলাদেশ",
    laws: [
      {
        titleEn: "Cyber Security Act", titleBn: "সাইবার নিরাপত্তা আইন", year: 2023,
        descEn: "Replaces the Digital Security Act 2018. Criminalizes publishing false, threatening, or defamatory content via digital means — explicitly includes AI-generated synthetic media and deepfakes.",
        descBn: "ডিজিটাল নিরাপত্তা আইন ২০১৮-এর প্রতিস্থাপন। ডিজিটাল মাধ্যমে মিথ্যা, ভীতিকর বা মানহানিকর কনটেন্ট প্রকাশ করা শাস্তিযোগ্য — AI-জেনারেটেড ডিপফেক স্পষ্টভাবে অন্তর্ভুক্ত।",
        penaltyEn: "Up to 7 years imprisonment + fine up to BDT 25 lakh", penaltyBn: "৭ বছর পর্যন্ত কারাদণ্ড + ২৫ লক্ষ টাকা পর্যন্ত জরিমানা",
        citationEn: "Cyber Security Act 2023, §25, §29, §31", citationBn: "সাইবার নিরাপত্তা আইন ২০২৩, ধারা ২৫, ২৯, ৩১",
        link: "https://police.gov.bd", fileWith: "BD Police Cyber Crime Unit · 02-9512382",
      },
      {
        titleEn: "Personal Data Protection Act (Draft)", titleBn: "ব্যক্তিগত তথ্য সুরক্ষা আইন (খসড়া)", year: 2023,
        descEn: "Protects biometric data including facial likeness. Generation of synthetic media using a person's face without explicit consent is treated as a data-protection violation.",
        descBn: "মুখমণ্ডলসহ বায়োমেট্রিক তথ্য সুরক্ষিত। সম্মতি ছাড়া কারো মুখ ব্যবহার করে সিন্থেটিক মিডিয়া তৈরি করা তথ্য সুরক্ষা লঙ্ঘন।",
        penaltyEn: "Up to 5 years + BDT 5 lakh", penaltyBn: "৫ বছর পর্যন্ত + ৫ লক্ষ টাকা",
        citationEn: "PDPA Draft 2023, Chapter VII", citationBn: "PDPA খসড়া ২০২৩, অধ্যায় ৭",
        link: "#", fileWith: "ICT Division",
      },
      {
        titleEn: "Pornography Control Act", titleBn: "পর্নোগ্রাফি নিয়ন্ত্রণ আইন", year: 2012,
        descEn: "Covers non-consensual intimate imagery (NCII) including AI-generated content. Sharing or producing synthetic intimate content is a non-bailable offence.",
        descBn: "AI-জেনারেটেড সহ অসম্মতিমূলক অন্তরঙ্গ ছবি (NCII) এর আওতাভুক্ত। সিন্থেটিক অন্তরঙ্গ কনটেন্ট তৈরি বা শেয়ার অজামিনযোগ্য অপরাধ।",
        penaltyEn: "Up to 10 years + BDT 5 lakh", penaltyBn: "১০ বছর পর্যন্ত + ৫ লক্ষ টাকা",
        citationEn: "Pornography Control Act 2012, §8", citationBn: "পর্নোগ্রাফি নিয়ন্ত্রণ আইন ২০১২, ধারা ৮",
        link: "#", fileWith: "Women & Children Repression Tribunal",
      },
    ],
  },
  us: {
    flag: "🇺🇸", nameEn: "USA", nameBn: "যুক্তরাষ্ট্র",
    laws: [
      {
        titleEn: "Take It Down Act", titleBn: "Take It Down আইন", year: 2025,
        descEn: "Federal law requiring online platforms to remove non-consensual intimate imagery (including AI-generated deepfakes) within 48 hours of a valid request.",
        descBn: "ফেডারেল আইন — প্ল্যাটফর্মগুলোকে ৪৮ ঘণ্টার মধ্যে অসম্মতিমূলক অন্তরঙ্গ ছবি (AI ডিপফেক সহ) সরাতে বাধ্য করে।",
        penaltyEn: "Criminal penalties + private civil right of action", penaltyBn: "ফৌজদারি শাস্তি + ব্যক্তিগত দেওয়ানি মামলার অধিকার",
        citationEn: "Public Law 119-2 (2025)", citationBn: "Public Law 119-2 (২০২৫)",
        link: "https://www.congress.gov", fileWith: "FBI · platform takedown form",
      },
      {
        titleEn: "DEEPFAKES Accountability Act (proposed)", titleBn: "DEEPFAKES জবাবদিহি আইন (প্রস্তাবিত)", year: 2023,
        descEn: "Requires creators of AI-generated media to embed disclosures; criminalizes deceptive political deepfakes within 60 days of an election.",
        descBn: "AI-জেনারেটেড মিডিয়ার নির্মাতাদের ঘোষণা যুক্ত করা বাধ্যতামূলক; নির্বাচনের ৬০ দিনের মধ্যে প্রতারণামূলক রাজনৈতিক ডিপফেক শাস্তিযোগ্য।",
        penaltyEn: "Up to 5 years + civil suits", penaltyBn: "৫ বছর পর্যন্ত + দেওয়ানি মামলা",
        citationEn: "H.R. 5586 (118th Congress)", citationBn: "H.R. 5586 (১১৮তম কংগ্রেস)",
        link: "#",
      },
    ],
  },
  uk: {
    flag: "🇬🇧", nameEn: "UK", nameBn: "যুক্তরাজ্য",
    laws: [
      {
        titleEn: "Online Safety Act", titleBn: "অনলাইন সেফটি অ্যাক্ট", year: 2023,
        descEn: "Creates a new offence of sharing intimate deepfake images without consent. Ofcom enforces platform duties of care.",
        descBn: "সম্মতি ছাড়া অন্তরঙ্গ ডিপফেক ছবি শেয়ার করা নতুন অপরাধ। Ofcom প্ল্যাটফর্মগুলির দায়িত্ব প্রয়োগ করে।",
        penaltyEn: "Up to 2 years imprisonment", penaltyBn: "২ বছর পর্যন্ত কারাদণ্ড",
        citationEn: "Online Safety Act 2023, §187", citationBn: "Online Safety Act 2023, ধারা ১৮৭",
        link: "https://www.gov.uk/government/publications/online-safety-act-2023",
      },
    ],
  },
  in: {
    flag: "🇮🇳", nameEn: "India", nameBn: "ভারত",
    laws: [
      {
        titleEn: "IT Act §66E / §67", titleBn: "IT আইন ধারা ৬৬E / ৬৭", year: 2000,
        descEn: "Privacy violation via electronic media. The 2023 IT Rules amendment explicitly extends to AI deepfakes — platforms must take down on notice.",
        descBn: "ইলেকট্রনিক মাধ্যমে গোপনীয়তা লঙ্ঘন। ২০২৩-এর IT বিধি সংশোধনী AI ডিপফেককে স্পষ্টভাবে অন্তর্ভুক্ত করে।",
        penaltyEn: "Up to 3 years + ₹2 lakh", penaltyBn: "৩ বছর পর্যন্ত + ₹২ লক্ষ",
        citationEn: "IT Act 2000, IT Rules 2021 (amended 2023)", citationBn: "IT Act 2000, IT Rules 2021 (২০২৩ সংশোধিত)",
        link: "https://www.meity.gov.in", fileWith: "Cyber Crime Reporting Portal",
      },
      {
        titleEn: "Digital Personal Data Protection Act", titleBn: "ডিজিটাল ব্যক্তিগত তথ্য সুরক্ষা আইন", year: 2023,
        descEn: "Biometric and identity protection. Synthetic generation using a data principal's face without consent triggers penalty exposure.",
        descBn: "বায়োমেট্রিক এবং পরিচয় সুরক্ষা। সম্মতি ছাড়া কোনো ব্যক্তির মুখ ব্যবহার শাস্তির আওতায় আসে।",
        penaltyEn: "Up to ₹250 crore per breach", penaltyBn: "প্রতি লঙ্ঘনে ₹২৫০ কোটি পর্যন্ত",
        citationEn: "DPDP Act 2023, §33", citationBn: "DPDP Act 2023, ধারা ৩৩",
        link: "#",
      },
    ],
  },
};

function LawsPage() {
  const [c, setC] = useState("bd");
  const { lang } = useLang();
  const country = countries[c];
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="rounded-xl border border-danger/40 bg-danger/5 p-4 mb-8 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
        <div className="text-sm">{t("Victim of deepfake harassment?", "ডিপফেক হয়রানির শিকার?", lang)} → <Link to="/help" className="text-cyan underline">{t("Get help now", "এখন সাহায্য নিন", lang)}</Link></div>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold">{t("Cyber Laws & Deepfake Regulation", "সাইবার আইন ও ডিপফেক নিয়ন্ত্রণ", lang)}</h1>
      <p className="text-sm text-muted-foreground mt-1">{t("Know your rights. File complaints. Hold platforms accountable.", "আপনার অধিকার জানুন। অভিযোগ দায়ের করুন। প্ল্যাটফর্মকে জবাবদিহি করান।", lang)}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {Object.entries(countries).map(([k, v]) => (
          <button key={k} onClick={() => setC(k)} className={`px-4 py-2 rounded-full text-sm border transition ${c === k ? "bg-cyan/15 border-cyan text-cyan glow-cyan" : "border-[color:var(--border)] text-muted-foreground hover:border-cyan/40"}`}>
            {v.flag} {t(v.nameEn, v.nameBn, lang)}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {country.laws.map(l => (
          <div key={l.titleEn} className="glass rounded-xl p-6">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold">{t(l.titleEn, l.titleBn, lang)} <span className="text-cyan font-mono text-sm">({l.year})</span></h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{t(l.descEn, l.descBn, lang)}</p>
              </div>
              <a href={l.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-cyan/40 px-3 py-1.5 text-xs text-cyan hover:bg-cyan/10">{t("File Complaint", "অভিযোগ দায়ের", lang)} <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <div><span className="text-warning font-mono uppercase tracking-widest">{t("Penalty", "শাস্তি", lang)}:</span> <span className="text-foreground/90">{t(l.penaltyEn, l.penaltyBn, lang)}</span></div>
              <div className="flex items-start gap-1.5 text-muted-foreground"><BookOpen className="h-3 w-3 mt-0.5" /> <span>{t(l.citationEn, l.citationBn, lang)}</span></div>
              {l.fileWith && <div><span className="text-cyan font-mono uppercase tracking-widest">{t("File with", "যেখানে দায়ের", lang)}:</span> <span className="text-foreground/90">{l.fileWith}</span></div>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 glass rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold mb-3">{t("Quick navigation", "দ্রুত নেভিগেশন", lang)}</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/help" className="px-3 py-1.5 rounded-md border border-cyan/40 text-cyan hover:bg-cyan/10">{t("Victim support steps", "ভুক্তভোগী সহায়তা ধাপ", lang)}</Link>
          <Link to="/detect" className="px-3 py-1.5 rounded-md border border-cyan/40 text-cyan hover:bg-cyan/10">{t("Analyze content", "কনটেন্ট বিশ্লেষণ", lang)}</Link>
          <Link to="/dashboard" className="px-3 py-1.5 rounded-md border border-cyan/40 text-cyan hover:bg-cyan/10">{t("Live threat feed", "লাইভ থ্রেট ফিড", lang)}</Link>
        </div>
      </div>
    </div>
  );
}
