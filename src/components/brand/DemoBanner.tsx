import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "verifai_demo_banner_dismissed";

export function DemoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "1") return;
    setShow(true);
    if (window.matchMedia("(max-width: 640px)").matches) {
      const t = setTimeout(() => setShow(false), 10000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;
  const dismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div
      className="relative z-50 flex items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm border-b"
      style={{
        background: "linear-gradient(90deg, rgba(123,47,255,0.13), rgba(0,229,255,0.13))",
        borderColor: "rgba(0,229,255,0.2)",
      }}
    >
      <div className="flex-1 text-center text-foreground/90">
        🏆 Live at The Infinity AI BuildFest 2026 — Track 5: InfoTech ·{" "}
        <span className="hidden sm:inline">Bangladesh's first Bangla-native deepfake detector</span>
      </div>
      <button onClick={dismiss} className="opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
