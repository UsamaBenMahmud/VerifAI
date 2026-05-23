import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";

export function CameraModal({ onClose, onCapture }: { onClose: () => void; onCapture: (b64: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e: any) {
        setError(e?.message || "Camera permission denied");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    setSnapshot(c.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass rounded-2xl p-5 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Camera className="h-5 w-5 text-cyan" /> Live Camera</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        {error ? (
          <div className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{error}</div>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-cyan/30 bg-black">
            {snapshot ? (
              <img src={snapshot} alt="captured" className="h-full w-full object-cover" />
            ) : (
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            )}
          </div>
        )}
        <div className="mt-4 flex gap-3 justify-end">
          {snapshot ? (
            <>
              <button onClick={() => setSnapshot(null)} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-4 py-2 text-sm hover:bg-cyan/10"><RotateCcw className="h-4 w-4" /> Retake</button>
              <button onClick={() => onCapture(snapshot)} className="inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-semibold glow-cyan"><Check className="h-4 w-4" /> Use Photo</button>
            </>
          ) : (
            <button onClick={capture} disabled={!!error} className="inline-flex items-center gap-2 rounded-md bg-cyan text-[color:var(--bg-deep)] px-4 py-2 text-sm font-semibold disabled:opacity-40 glow-cyan"><Camera className="h-4 w-4" /> Capture</button>
          )}
        </div>
      </div>
    </div>
  );
}
