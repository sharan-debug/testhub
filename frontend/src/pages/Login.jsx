import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Beaker, ArrowRight, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function Login() {
  const { user, loading, setUser } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
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

  const inputCls = "w-full h-10 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left panel — form */}
      <div className="flex flex-col justify-between p-10 md:p-16 bg-white border-r border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-sm">
            <Beaker className="w-4 h-4" />
          </div>
          <span className="font-heading font-black text-lg tracking-tight">TestHub</span>
        </div>

        <div className="max-w-sm w-full">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Internal · QA Knowledge</p>
          <h1 className="text-3xl font-heading font-black tracking-tight mb-1">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            {mode === "login"
              ? "Use the email and password you registered with."
              : "Choose any email and password to get started."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Name</label>
                <input
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
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Email</label>
              <input
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
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Password</label>
              <input
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
              className="w-full h-10 bg-black hover:bg-zinc-800 text-white text-sm font-medium rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
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
              data-testid="toggle-mode-button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-blue-600 hover:underline font-medium"
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="text-xs text-zinc-400 font-mono">v1.0 · Contribute as you test</div>
      </div>

      {/* Right panel — showcase */}
      <div className="hidden md:flex flex-col justify-center p-16 bg-zinc-50 border-l border-zinc-200">
        <div className="space-y-6 max-w-md">
          {[
            { k: "GET", v: "/api/checkout/init", tag: "checkout" },
            { k: "POST", v: "/api/payments/confirm", tag: "payments" },
            { k: "DELETE", v: "/api/cart/{id}", tag: "cart" },
          ].map((row, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-sm p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className={`method-badge method-${row.k}`}>{row.k}</span>
                <code className="text-sm text-zinc-900">{row.v}</code>
              </div>
              <div className="text-xs text-zinc-500 font-mono">tag: {row.tag}</div>
            </div>
          ))}
          <div className="bg-black text-white rounded-sm p-4">
            <p className="text-xs font-mono text-zinc-400 mb-1">ASK THE AGENT</p>
            <p className="text-sm">"What are the mocks for the checkout flow?"</p>
          </div>
        </div>
      </div>
    </div>
  );
}
