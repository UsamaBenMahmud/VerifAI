import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Plus, X, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useLang, t } from "@/lib/i18n";
import { trendingDeepfakes } from "@/lib/mockData";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Deepfake Watchlist — VerifAI" },
      { name: "description", content: "Get notified when deepfakes matching your keywords are detected." },
    ],
  }),
  component: WatchlistPage,
});

type Settings = { method: "email" | "telegram" | "both"; freq: "immediate" | "daily" | "weekly"; email: string; telegram: string };
const KEY_KW = "verifai_watchlist";
const KEY_SETTINGS = "verifai_watchlist_settings";

function WatchlistPage() {
  const { lang } = useLang();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<Settings>({ method: "email", freq: "immediate", email: "", telegram: "" });

  useEffect(() => {
    try {
      setKeywords(JSON.parse(localStorage.getItem(KEY_KW) || "[]"));
      const s = localStorage.getItem(KEY_SETTINGS);
      if (s) setSettings(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  const persist = (kws: string[]) => {
    setKeywords(kws);
    localStorage.setItem(KEY_KW, JSON.stringify(kws));
  };

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (keywords.includes(v)) { toast.error(t("Already in your watchlist", "এটি ইতিমধ্যে তালিকায় আছে", lang)); return; }
    persist([...keywords, v]);
    setInput("");
    toast.success(t(`Watching "${v}"`, `"${v}" তালিকাভুক্ত`, lang));
  };

  const remove = (kw: string) => persist(keywords.filter((k) => k !== kw));

  const saveSettings = () => {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
    toast.success(t("Alert settings saved", "সতর্কতা সেটিংস সংরক্ষিত", lang));
  };

  const matches = keywords.length === 0
    ? []
    : trendingDeepfakes.filter((d) =>
        keywords.some((k) => {
          const kl = k.toLowerCase();
          return d.title.toLowerCase().includes(kl) || d.titleBn.includes(k) || d.category.toLowerCase().includes(kl);
        }),
      ).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      <header>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-3xl sm:text-4xl font-bold flex items-center gap-3">
            <Bell className="h-7 w-7 text-cyan" /> {t("Deepfake Watchlist", "ডিপফেক ওয়াচলিস্ট", lang)}
          </h1>
          <span className="px-3 py-1 rounded-full bg-violet/15 border border-violet/40 text-violet text-xs font-mono uppercase tracking-widest">Journalist Feature</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t("Get notified when deepfakes matching your keywords are detected.", "আপনার কীওয়ার্ড মেলে এমন ডিপফেক শনাক্ত হলে সতর্ক করুন।", lang)}</p>
      </header>

      <section className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">{t("Add a keyword", "কীওয়ার্ড যোগ করুন", lang)}</h2>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder={t("Add a person, topic, or keyword to watch", "যেমন: Sheikh Hasina, ঢাকা নির্বাচন, Rohingya", lang)}
            className="flex-1 rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-4 py-3 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40"
          />
          <button onClick={add} className="inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-3 text-sm font-semibold glow-cyan">
            <Plus className="h-4 w-4" /> {t("Add", "যোগ", lang)}
          </button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {keywords.map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 border border-cyan/40 px-3 py-1 text-sm text-cyan">
                {k}
                <button onClick={() => remove(k)} className="hover:text-danger"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">{t("Alert settings", "সতর্কতা সেটিংস", lang)}</h2>
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{t("Notification method", "নোটিফিকেশন পদ্ধতি", lang)}</div>
          <div className="flex flex-wrap gap-2">
            {([
              { v: "email", label: "Email", icon: Mail },
              { v: "telegram", label: "Telegram", icon: Send },
              { v: "both", label: "Both", icon: Bell },
            ] as const).map((o) => (
              <button
                key={o.v}
                onClick={() => setSettings({ ...settings, method: o.v })}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
                  settings.method === o.v ? "border-cyan bg-cyan/10 text-cyan glow-cyan" : "border-[color:var(--border)] hover:border-cyan/40"
                }`}
              >
                <o.icon className="h-4 w-4" /> {o.label}
              </button>
            ))}
          </div>

          {(settings.method === "email" || settings.method === "both") && (
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-4 py-2 text-sm focus:border-cyan focus:outline-none"
            />
          )}
          {(settings.method === "telegram" || settings.method === "both") && (
            <input
              type="text"
              value={settings.telegram}
              onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
              placeholder="@username"
              className="w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-4 py-2 text-sm focus:border-cyan focus:outline-none"
            />
          )}

          <div className="text-xs uppercase tracking-widest text-muted-foreground pt-2">{t("Frequency", "ফ্রিকোয়েন্সি", lang)}</div>
          <div className="flex flex-wrap gap-2">
            {(["immediate", "daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSettings({ ...settings, freq: f })}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  settings.freq === f ? "border-cyan bg-cyan/10 text-cyan" : "border-[color:var(--border)] hover:border-cyan/40"
                }`}
              >
                {f === "immediate" ? t("Immediate", "তৎক্ষণাৎ", lang) : f === "daily" ? t("Daily digest", "দৈনিক", lang) : t("Weekly digest", "সাপ্তাহিক", lang)}
              </button>
            ))}
          </div>

          <button onClick={saveSettings} className="mt-3 rounded-md bg-cyan text-[color:var(--bg-deep)] px-5 py-2 text-sm font-semibold glow-cyan">
            {t("Save Settings", "সংরক্ষণ", lang)}
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">{t("Recent matches for your watchlist", "তালিকার সাম্প্রতিক মিল", lang)}</h2>
        {matches.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            🔔 {t("Your watchlist is active. You'll be notified when matches are found.", "আপনার তালিকা সক্রিয়। মিল পাওয়া গেলে আপনাকে জানানো হবে।", lang)}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const matched = keywords.find((k) => m.title.toLowerCase().includes(k.toLowerCase()) || m.titleBn.includes(k) || m.category.toLowerCase().includes(k.toLowerCase()));
              return (
                <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-3 flex-wrap">
                  {matched && <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest rounded bg-violet/20 text-violet font-mono">{matched}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{lang === "bn" ? m.titleBn : m.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.id} · {m.detectedAt}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${m.trustScore < 30 ? "bg-danger/15 text-danger" : m.trustScore < 60 ? "bg-warning/15 text-warning" : "bg-safe/15 text-safe"}`}>{m.trustScore}/100</span>
                  <Link to="/detect" className="text-sm text-cyan hover:underline">{t("Analyze →", "বিশ্লেষণ →", lang)}</Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
