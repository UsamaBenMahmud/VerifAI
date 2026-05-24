import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, User, Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Logo } from "@/components/brand/Logo";
import { GridBackground } from "@/components/brand/GridBackground";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "admin" ? "admin" as const : "user" as const,
    intent: s.intent === "signup" ? "signup" as const : "signin" as const,
  }),
  head: () => ({ meta: [{ title: "Sign in — VerifAI" }, { name: "description", content: "Sign in to your VerifAI user or admin account." }]}),
  component: LoginPage,
});

type Tab = "user" | "admin";
type Sub = "signin" | "signup";

function LoginPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>(search.mode);
  const [sub, setSub] = useState<Sub>(search.intent);
  const isAdmin = tab === "admin";

  return (
    <div className="relative min-h-[88vh] flex items-center justify-center px-4 py-12 overflow-hidden">
      <GridBackground />
      {/* Floating orbs */}
      <div className={`absolute top-10 right-10 h-72 w-72 rounded-full blur-3xl transition-all duration-700 ${isAdmin ? "bg-danger/20 animate-pulse" : "bg-cyan/15"}`} />
      <div className={`absolute bottom-10 left-10 h-72 w-72 rounded-full blur-3xl transition-all duration-700 ${isAdmin ? "bg-danger/10 animate-pulse" : "bg-violet/15"}`} />

      <div className={`relative w-full max-w-md glass-strong rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
        isAdmin ? "border-danger/50 shadow-[0_0_40px_rgba(255,59,92,0.3)]" : ""
      }`}>
        <div className="flex justify-center"><Logo size="lg" /></div>

        {/* Tab pills */}
        <div className="mt-6 relative grid grid-cols-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-deep)] p-1">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md transition-transform duration-300 ${
              isAdmin ? "translate-x-[calc(100%+4px)] bg-danger/20 border border-danger/50" : "translate-x-0 bg-cyan/20 border border-cyan/50"
            }`}
          />
          <button
            onClick={() => setTab("user")}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition ${
              tab === "user" ? "text-cyan" : "text-muted-foreground"
            }`}
          >
            <User className="h-4 w-4" /> User Access
          </button>
          <button
            onClick={() => setTab("admin")}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition ${
              tab === "admin" ? "text-danger" : "text-muted-foreground"
            }`}
          >
            <Shield className="h-4 w-4" /> Admin Portal
          </button>
        </div>

        {tab === "user" ? <UserTab sub={sub} setSub={setSub} onDone={() => nav({ to: "/detect" })} /> : <AdminTab onDone={() => nav({ to: "/admin" })} />}

        <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Powered by Lovable Cloud</p>
      </div>
    </div>
  );
}

function UserTab({ sub, setSub, onDone }: { sub: Sub; setSub: (s: Sub) => void; onDone: () => void }) {
  return (
    <>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <button onClick={() => setSub("signin")} className={sub === "signin" ? "text-cyan border-b-2 border-cyan pb-1 font-semibold" : "text-muted-foreground hover:text-foreground pb-1"}>Sign In</button>
        <button onClick={() => setSub("signup")} className={sub === "signup" ? "text-cyan border-b-2 border-cyan pb-1 font-semibold" : "text-muted-foreground hover:text-foreground pb-1"}>Create Account</button>
      </div>
      {sub === "signin" ? <SignInForm onDone={onDone} switchToSignup={() => setSub("signup")} /> : <SignUpForm onDone={onDone} switchToSignin={() => setSub("signin")} />}
    </>
  );
}

function SignInForm({ onDone, switchToSignup }: { onDone: () => void; switchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back! Ready to detect deepfakes.");
    onDone();
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Google sign-in failed");
    if (!result.redirected) { toast.success("Signed in."); onDone(); }
  };

  return (
    <div className="mt-5">
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="text-sm text-muted-foreground" lang="bn">স্বাগতম</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <Field label="Email address">
          <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Password" rightSlot={<Link to="/forgot-password" className="text-[11px] text-cyan hover:underline">Forgot password?</Link>}>
          <div className="relative">
            <input type={show ? "text" : "password"} required placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} className={inputCls} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan hover:glow-cyan-strong disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-[color:var(--border)]" />or continue with<div className="flex-1 h-px bg-[color:var(--border)]" />
      </div>

      <button onClick={onGoogle} className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--border)] py-2.5 text-sm hover:bg-cyan/5">
        <GoogleIcon /> Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to VerifAI? <button onClick={switchToSignup} className="text-cyan hover:underline font-medium">Create account →</button>
      </p>
    </div>
  );
}

function SignUpForm({ onDone, switchToSignin }: { onDone: () => void; switchToSignin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("citizen");
  const [tos, setTos] = useState(false);
  const [news, setNews] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tos) return toast.error("Please accept the Terms of Service");
    if (pw !== confirm) return toast.error("Passwords don't match");
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name, role: role === "law" ? "citizen" : role, newsletter: news },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Check your email to confirm.");
    onDone();
  };

  return (
    <div className="mt-5">
      <h1 className="font-display text-2xl font-bold">Join VerifAI</h1>
      <p className="text-sm text-muted-foreground" lang="bn">VerifAI-তে যোগ দিন</p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <Field label="Full name"><input required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" /></Field>
        <Field label="Email address"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" /></Field>
        <Field label="Password">
          <input type="password" required minLength={8} value={pw} onChange={e => setPw(e.target.value)} className={inputCls} placeholder="At least 8 characters" />
          <PasswordStrength pw={pw} />
        </Field>
        <Field label="Confirm password">
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls} placeholder="Re-type password" />
          {confirm && (pw === confirm
            ? <div className="text-[11px] text-safe mt-1">✓ Passwords match</div>
            : <div className="text-[11px] text-danger mt-1">Passwords don't match</div>)}
        </Field>
        <Field label="I'm a…">
          <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
            <option value="citizen">🏠 Citizen — Personal use</option>
            <option value="journalist">📰 Journalist / Reporter</option>
            <option value="researcher">🔬 Researcher / Academic</option>
            <option value="org">🏢 Organization / NGO</option>
            <option value="law">🚔 Law Enforcement (requires verification)</option>
          </select>
        </Field>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={tos} onChange={e => setTos(e.target.checked)} className="mt-0.5 accent-cyan" />
          <span>I agree to the <a href="#" className="text-cyan hover:underline">Terms of Service</a> and <a href="#" className="text-cyan hover:underline">Privacy Policy</a> (BD + GDPR)</span>
        </label>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={news} onChange={e => setNews(e.target.checked)} className="mt-0.5 accent-cyan" />
          <span>Subscribe to monthly deepfake threat report (Bangla)</span>
        </label>

        <button disabled={loading} className="w-full rounded-md bg-cyan py-2.5 text-sm font-semibold text-[color:var(--bg-deep)] glow-cyan disabled:opacity-50">
          {loading ? "Creating..." : "Create Free Account →"}
        </button>
        <p className="text-[11px] text-center text-muted-foreground">7-day free trial for Journalist accounts. No credit card required.</p>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account? <button onClick={switchToSignin} className="text-cyan hover:underline font-medium">Sign in →</button>
      </p>
    </div>
  );
}

function AdminTab({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCodeChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    setCode(digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.replace(/\s/g, "");
    if (raw.length !== 6) return toast.error("Enter the 6-digit code");
    if (raw !== "000000") return toast.error("Invalid authenticator code");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) { setLoading(false); return toast.error(error?.message || "Login failed"); }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      return toast.error("Not authorized — admin role required");
    }
    sessionStorage.setItem("adminSessionStart", String(Date.now()));
    toast.success("Admin session started. All actions are logged.");
    onDone();
  };

  return (
    <div className="mt-5">
      <div className="rounded-md bg-danger/15 border border-danger/40 px-4 py-3 flex items-start gap-2">
        <Lock className="h-4 w-4 text-danger shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-bold text-danger uppercase tracking-widest">🔒 Restricted Access</div>
          <div className="text-muted-foreground mt-0.5">This portal is for authorized VerifAI administrators only.</div>
          <div className="text-muted-foreground" lang="bn">শুধুমাত্র অনুমোদিত প্রশাসকদের জন্য</div>
        </div>
      </div>

      <h1 className="mt-5 font-display text-2xl font-bold text-danger">Admin Sign In</h1>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Administrator Email">
          <input type="email" required placeholder="admin@verifai.app" value={email} onChange={e => setEmail(e.target.value)}
            className={`${inputCls} focus:border-danger focus:ring-danger/30`} />
        </Field>
        <Field label="Password">
          <div className="relative">
            <input type={show ? "text" : "password"} required value={pw} onChange={e => setPw(e.target.value)}
              className={`${inputCls} focus:border-danger focus:ring-danger/30`} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Authenticator Code">
          <input inputMode="numeric" required value={code} onChange={e => onCodeChange(e.target.value)}
            placeholder="000 000" maxLength={7}
            className={`${inputCls} font-mono tracking-[0.3em] text-center focus:border-danger focus:ring-danger/30`} />
          <div className="mt-1 text-[11px] text-muted-foreground">Enter the 6-digit code from your authenticator app.</div>
          <div className="text-[11px] text-warning">Demo mode: use code <span className="font-mono">000000</span></div>
        </Field>

        <button disabled={loading} className="w-full rounded-md bg-danger py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ boxShadow: "0 0 20px rgba(255,59,92,0.5)" }}>
          {loading ? "Verifying..." : "Admin Sign In →"}
        </button>
      </form>

      <div className="mt-6 text-center space-y-1 text-[11px] text-muted-foreground">
        <div>Admin access is by invitation only.</div>
        <div>Contact: <span className="text-danger font-mono">security@verifai.app</span></div>
        <div>All admin sessions are logged and audited.</div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-md bg-[color:var(--bg-deep)] border border-[color:var(--border)] px-3 py-2.5 text-sm focus:border-cyan focus:ring-2 focus:ring-cyan/30 outline-none transition";

function Field({ label, children, rightSlot }: { label: string; children: React.ReactNode; rightSlot?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#fff" d="M21.35 11.1H12v2.92h5.35c-.23 1.5-1.65 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.93s2.63-5.93 5.85-5.93c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.66 4.06 14.55 3 12 3 6.97 3 2.9 7.04 2.9 12s4.07 9 9.1 9c5.26 0 8.74-3.69 8.74-8.88 0-.6-.07-1.05-.16-1.52z" />
    </svg>
  );
}
