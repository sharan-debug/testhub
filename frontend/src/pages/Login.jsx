import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Beaker, ArrowRight, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

/* ── Decorative corner illustrations ── */

function IllustrationPaperPlane() {
  return (
    <svg width="220" height="160" viewBox="0 0 220 160" fill="none" className="absolute top-0 left-0" aria-hidden="true">
      {/* dashed trajectory */}
      <path d="M 30 130 Q 80 30 200 20" stroke="#A5B4FC" strokeWidth="1.8" strokeDasharray="6 5" fill="none" />
      {/* plane body */}
      <g transform="translate(188,12) rotate(-30)">
        <path d="M0 10 L20 0 L16 8 Z" fill="#818CF8" opacity="0.9"/>
        <path d="M0 10 L20 0 L16 12 Z" fill="#6366F1" opacity="0.85"/>
        <path d="M16 8 L16 12 L13 10 Z" fill="#4F46E5" opacity="0.9"/>
      </g>
      {/* sparkle top */}
      <g transform="translate(60,55)">
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-4" y1="-4" x2="4" y2="4" stroke="#FCD34D" strokeWidth="1" strokeLinecap="round"/>
        <line x1="4" y1="-4" x2="-4" y2="4" stroke="#FCD34D" strokeWidth="1" strokeLinecap="round"/>
      </g>
      {/* small dot accents */}
      <circle cx="110" cy="42" r="3" fill="#A5B4FC" opacity="0.7"/>
      <circle cx="150" cy="28" r="2" fill="#C7D2FE" opacity="0.8"/>
    </svg>
  );
}

function IllustrationRobot() {
  return (
    <svg width="260" height="220" viewBox="0 0 260 220" fill="none" className="absolute top-0 right-0" aria-hidden="true">
      {/* background blobs */}
      <ellipse cx="200" cy="60" rx="90" ry="75" fill="#DBEAFE" opacity="0.6"/>
      <ellipse cx="240" cy="140" rx="40" ry="35" fill="#D1FAE5" opacity="0.55"/>
      {/* clipboard */}
      <rect x="90" y="30" width="80" height="100" rx="8" fill="white" stroke="#C7D2FE" strokeWidth="2"/>
      <rect x="110" y="22" width="40" height="16" rx="4" fill="#818CF8"/>
      {/* check lines */}
      <line x1="108" y1="65" x2="155" y2="65" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round"/>
      <polyline points="100,65 104,70 112,60" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="108" y1="85" x2="155" y2="85" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round"/>
      <polyline points="100,85 104,90 112,80" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="108" y1="105" x2="155" y2="105" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round"/>
      <polyline points="100,105 104,110 112,100" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* robot head */}
      <ellipse cx="195" cy="105" rx="32" ry="30" fill="#6EE7B7"/>
      <ellipse cx="195" cy="105" rx="32" ry="30" stroke="#34D399" strokeWidth="2"/>
      {/* eyes */}
      <circle cx="185" cy="100" r="5" fill="white"/>
      <circle cx="205" cy="100" r="5" fill="white"/>
      <circle cx="187" cy="101" r="2.5" fill="#1E40AF"/>
      <circle cx="207" cy="101" r="2.5" fill="#1E40AF"/>
      {/* mouth */}
      <path d="M185 113 Q195 120 205 113" stroke="#059669" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* antenna */}
      <line x1="195" y1="75" x2="195" y2="60" stroke="#34D399" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="195" cy="57" r="4" fill="#34D399"/>
      {/* magnifying glass */}
      <circle cx="228" cy="145" r="16" fill="white" stroke="#93C5FD" strokeWidth="2.5"/>
      <circle cx="228" cy="145" r="10" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5"/>
      <line x1="238" y1="155" x2="248" y2="166" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round"/>
      {/* sparkle */}
      <g transform="translate(80,160)">
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

function IllustrationCodeWindow() {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" fill="none" className="absolute bottom-0 left-0" aria-hidden="true">
      {/* background blob */}
      <ellipse cx="50" cy="150" rx="80" ry="55" fill="#E0E7FF" opacity="0.5"/>
      <circle cx="20" cy="100" r="40" fill="#DDD6FE" opacity="0.35"/>
      {/* window */}
      <rect x="20" y="50" width="110" height="85" rx="8" fill="white" stroke="#C7D2FE" strokeWidth="2"/>
      {/* title bar */}
      <rect x="20" y="50" width="110" height="20" rx="8" fill="#EEF2FF"/>
      <rect x="20" y="58" width="110" height="12" fill="#EEF2FF"/>
      <circle cx="35" cy="60" r="4" fill="#FCA5A5"/>
      <circle cx="48" cy="60" r="4" fill="#FCD34D"/>
      <circle cx="61" cy="60" r="4" fill="#6EE7B7"/>
      {/* code brackets */}
      <text x="45" y="108" fontSize="24" fontFamily="monospace" fill="#818CF8" opacity="0.85">{"</>"}</text>
      {/* gear */}
      <g transform="translate(118, 52)">
        <circle cx="0" cy="0" r="12" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="2"/>
        <circle cx="0" cy="0" r="5" fill="white" stroke="#A5B4FC" strokeWidth="1.5"/>
        {[0,45,90,135,180,225,270,315].map((a) => (
          <rect key={a} x="-2" y="-14" width="4" height="5" rx="1" fill="#A5B4FC"
            transform={`rotate(${a})`}/>
        ))}
      </g>
      {/* sparkles */}
      <g transform="translate(155, 100)">
        <line x1="0" y1="-7" x2="0" y2="7" stroke="#FCD34D" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="-7" y1="0" x2="7" y2="0" stroke="#FCD34D" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#FCD34D" strokeWidth="1" strokeLinecap="round"/>
        <line x1="5" y1="-5" x2="-5" y2="5" stroke="#FCD34D" strokeWidth="1" strokeLinecap="round"/>
      </g>
      <g transform="translate(170, 75)">
        <line x1="0" y1="-4" x2="0" y2="4" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-4" y1="0" x2="4" y2="0" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

function IllustrationBug() {
  return (
    <svg width="220" height="180" viewBox="0 0 220 180" fill="none" className="absolute bottom-0 right-0" aria-hidden="true">
      {/* background blob */}
      <ellipse cx="180" cy="150" rx="75" ry="55" fill="#D1FAE5" opacity="0.55"/>
      {/* dashed path */}
      <path d="M 40 80 Q 100 160 160 145" stroke="#A5B4FC" strokeWidth="1.8" strokeDasharray="6 5" fill="none"/>
      {/* bug body */}
      <g transform="translate(30, 60)">
        <ellipse cx="0" cy="6" rx="12" ry="16" fill="#FCA5A5" stroke="#F87171" strokeWidth="1.5"/>
        <ellipse cx="0" cy="-4" rx="9" ry="8" fill="#FCA5A5" stroke="#F87171" strokeWidth="1.5"/>
        {/* dots */}
        <circle cx="-4" cy="4" r="2.5" fill="#EF4444" opacity="0.7"/>
        <circle cx="4" cy="4" r="2.5" fill="#EF4444" opacity="0.7"/>
        <circle cx="0" cy="12" r="2.5" fill="#EF4444" opacity="0.7"/>
        {/* legs */}
        <line x1="-12" y1="2" x2="-22" y2="-2" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-12" y1="8" x2="-22" y2="8" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="-12" y1="14" x2="-22" y2="18" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="2" x2="22" y2="-2" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="8" x2="22" y2="8" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="14" x2="22" y2="18" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        {/* antennae */}
        <line x1="-5" y1="-12" x2="-12" y2="-22" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="-13" cy="-23" r="2.5" fill="#FCA5A5" stroke="#F87171" strokeWidth="1"/>
        <line x1="5" y1="-12" x2="12" y2="-22" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="-23" r="2.5" fill="#FCA5A5" stroke="#F87171" strokeWidth="1"/>
      </g>
      {/* checkmark circle */}
      <circle cx="160" cy="145" r="20" fill="#3B82F6"/>
      <polyline points="150,145 157,153 172,137" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Main component ── */

export default function Login() {
  const { user, loading, setUser } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-400">Loading…</div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error("Email and password are required"); return; }
    setSubmitting(true);
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const body = mode === "register" ? { email, password, name } : { email, password };
      const r = await api.post(endpoint, body);
      setUser(r.data);
      window.location.href = "/";
    } catch (e) {
      toast.error(e?.response?.data?.detail || (mode === "register" ? "Registration failed" : "Invalid email or password"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full h-10 px-3.5 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-zinc-400";

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(145deg, #ECEEF8 0%, #EEF2FF 50%, #F0FDF4 100%)" }}
    >
      {/* Corner illustrations */}
      <IllustrationPaperPlane />
      <IllustrationRobot />
      <IllustrationCodeWindow />
      <IllustrationBug />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo above card */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 bg-indigo-600 text-white flex items-center justify-center rounded-xl shadow-md">
            <Beaker className="w-5 h-5" />
          </div>
          <span className="font-heading font-black text-xl tracking-tight text-zinc-900">TestHub</span>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-indigo-100/50 border border-white/60 p-8">
          <div className="text-center mb-7">
            <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-1.5">Internal · QA Knowledge</p>
            <h1 className="text-2xl font-heading font-black tracking-tight text-zinc-900">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {mode === "login"
                ? "Sign in to access the QA knowledge base"
                : "Get started with your QA workspace"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label htmlFor="input-name" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">Name</label>
                <input
                  id="input-name"
                  data-testid="input-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="input-email" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">Email</label>
              <input
                id="input-email"
                data-testid="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="input-password" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1.5">Password</label>
              <input
                id="input-password"
                data-testid="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200 mt-1"
            >
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-xs text-zinc-500 mt-5 text-center">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              type="button"
              data-testid="toggle-mode-button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold"
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-zinc-400 font-mono mt-5">v1.0 · Contribute as you test</p>
      </div>
    </div>
  );
}
