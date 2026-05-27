import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Square, Circle } from "lucide-react";

export function CameraRecorder({ onClose, onRecorded }: { onClose: () => void; onRecorded: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (e: any) {
        setError(e?.message || "Camera permission denied");
      }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  }, [facing]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(id);
  }, [recording]);

  const start = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `verifai-camera-${Date.now()}.webm`, { type: "video/webm" });
      onRecorded(file);
    };
    recRef.current = rec;
    rec.start();
    setRecording(true);
    setElapsed(0);
    setTimeout(() => { if (recRef.current?.state === "recording") stop(); }, 6000);
  };
  const stop = () => { recRef.current?.stop(); setRecording(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-5 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold flex items-center gap-2"><Camera className="h-5 w-5 text-cyan" /> Live Camera</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="h-5 w-5" /></button>
        </div>
        {error ? (
          <div className="rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{error}</div>
        ) : (
          <>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {recording && (
                <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2 py-1 rounded-full bg-danger/90 text-white text-xs font-mono">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" /> REC {elapsed.toFixed(1)}s
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={() => setFacing(facing === "user" ? "environment" : "user")} disabled={recording} className="inline-flex items-center gap-2 rounded-md border border-cyan/40 px-3 py-2 text-sm hover:bg-cyan/10 disabled:opacity-40">
                <RotateCcw className="h-4 w-4" /> {facing === "user" ? "Front" : "Back"}
              </button>
              {!recording ? (
                <button onClick={start} className="inline-flex items-center gap-2 rounded-full bg-danger text-white px-5 py-2.5 text-sm font-bold hover:scale-105 transition">
                  <Circle className="h-4 w-4 fill-white" /> Record (max 6s)
                </button>
              ) : (
                <button onClick={stop} className="inline-flex items-center gap-2 rounded-full bg-white text-danger px-5 py-2.5 text-sm font-bold">
                  <Square className="h-4 w-4 fill-danger" /> Stop & Analyze
                </button>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground text-center">Records a short clip from your camera, then runs it through the deepfake detector.</p>
          </>
        )}
      </div>
    </div>
  );
}
