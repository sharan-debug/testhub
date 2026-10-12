import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Link2, Link2Off, Loader2, X } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

const TTL_UNITS = ["HOUR", "MINUTE", "DAY", "SECOND"];
const PROVIDERS = ["AXIS", "ICICI"];
const STATUSES = ["SUCCESS", "PENDING", "FAILED"];

function VariantBar({ variants }) {
  if (!variants?.length) return null;
  return (
    <div className="flex gap-1.5 flex-wrap mt-1">
      {variants.map((v) => (
        <span key={v.name} className="text-[10px] font-mono px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-sm">
          {v.name} {v.weight}%
        </span>
      ))}
    </div>
  );
}

function ExperimentRow({ exp }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [settingIdx, setSettingIdx] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/qa/experiment?name=${encodeURIComponent(exp.key)}`);
      setState(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to fetch experiment state");
    }
    setLoading(false);
  };

  const forceVariant = async (variantName) => {
    if (!state?.variants) return;
    const updated = state.variants.map((v) => ({
      name: v.name,
      weight: v.name === variantName ? 100 : 0,
    }));
    setSettingIdx(variantName);
    try {
      await api.put("/qa/experiment", { name: exp.key, variants: updated });
      toast.success(`Forced ${variantName} to 100%`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to set variant");
    }
    setSettingIdx(null);
  };

  const reset = async () => {
    setResetting(true);
    try {
      await api.post("/qa/experiment/reset", { name: exp.key });
      toast.success("Experiment reset");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Reset failed");
    }
    setResetting(false);
  };

  return (
    <div className="py-3 first:pt-0 last:pb-0 border-b border-zinc-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-mono font-semibold text-zinc-900 truncate">{exp.key}</p>
          {exp.description && <p className="text-[10px] text-zinc-500 mt-0.5">{exp.description}</p>}
          {state && <VariantBar variants={state.variants} />}
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="h-7 px-2.5 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {state ? "Refresh" : "Get state"}
          </button>
          {state?.variants?.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => forceVariant(v.name)}
              disabled={settingIdx === v.name}
              className="h-7 px-2.5 text-[11px] font-mono bg-zinc-900 text-white rounded-sm hover:bg-zinc-700 disabled:opacity-50 flex items-center gap-1"
            >
              {settingIdx === v.name ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Force {v.name}
            </button>
          ))}
          {state && (
            <button
              type="button"
              onClick={reset}
              disabled={resetting}
              className="h-7 px-2.5 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50 text-zinc-600 disabled:opacity-50 flex items-center gap-1"
            >
              {resetting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RedisRow({ redisKey }) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [form, setForm] = useState({ value: "", ttl: 1, ttl_unit: "HOUR" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const read = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/qa/redis?key=${encodeURIComponent(redisKey.key)}`);
      setValue(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to read key");
    }
    setLoading(false);
  };

  const set = async () => {
    if (!form.value.trim()) { toast.error("Value is required"); return; }
    setSaving(true);
    try {
      await api.post("/qa/redis", { key: redisKey.key, ...form, ttl: Number(form.ttl) });
      toast.success("Redis key set");
      setShowSet(false);
      await read();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Set failed");
    }
    setSaving(false);
  };

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete(`/qa/redis?key=${encodeURIComponent(redisKey.key)}`);
      toast.success("Key deleted");
      setValue(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Delete failed");
    }
    setDeleting(false);
  };

  return (
    <div className="py-3 first:pt-0 last:pb-0 border-b border-zinc-100 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono font-semibold text-zinc-900 truncate">{redisKey.key}</p>
          {value !== null && (
            <pre className="mt-1.5 text-[10px] font-mono bg-zinc-50 border border-zinc-200 rounded-sm p-2 overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value?.value ?? value)}
            </pre>
          )}
          {showSet && (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="Value to set…"
                rows={2}
                className="w-full px-2 py-1.5 text-xs font-mono border border-zinc-200 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={form.ttl}
                  onChange={(e) => setForm((f) => ({ ...f, ttl: e.target.value }))}
                  className="w-16 h-7 px-2 text-xs border border-zinc-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={form.ttl_unit}
                  onChange={(e) => setForm((f) => ({ ...f, ttl_unit: e.target.value }))}
                  className="h-7 px-2 text-xs border border-zinc-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {TTL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button
                  type="button"
                  onClick={set}
                  disabled={saving}
                  className="h-7 px-3 text-[11px] font-mono bg-zinc-900 text-white rounded-sm hover:bg-zinc-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Set"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSet(false)}
                  className="h-7 px-3 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50 text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={read}
            disabled={loading}
            className="h-7 px-2.5 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {value ? "Refresh" : "Read"}
          </button>
          <button
            type="button"
            onClick={() => setShowSet((s) => !s)}
            className="h-7 px-2.5 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50"
          >
            Set
          </button>
          <button
            type="button"
            onClick={del}
            disabled={deleting}
            className="h-7 px-2.5 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50 text-red-600 disabled:opacity-50 flex items-center gap-1"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function WithdrawalMockForm() {
  const [form, setForm] = useState({ phone_number: "", provider: "AXIS", status: "SUCCESS", amount: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.phone_number.trim()) { toast.error("Phone number is required"); return; }
    setSaving(true);
    try {
      const payload = {
        phone_number: form.phone_number.trim(),
        provider: form.provider,
        status: form.status,
      };
      if (form.amount) payload.amount = Number(form.amount);
      await api.post("/qa/mock/withdrawal", payload);
      toast.success("Withdrawal mock set");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to set mock");
    }
    setSaving(false);
  };

  const inp = "h-8 px-2.5 text-xs border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono uppercase text-zinc-500">Phone (+91…)</span>
        <input
          value={form.phone_number}
          onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
          placeholder="+919876543210"
          className={`${inp} w-44`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono uppercase text-zinc-500">Provider</span>
        <select value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} className={`${inp} w-24`}>
          {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono uppercase text-zinc-500">Status</span>
        <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={`${inp} w-28`}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono uppercase text-zinc-500">Amount (opt.)</span>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="e.g. 500"
          className={`${inp} w-28`}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="h-8 px-3 text-xs font-mono bg-zinc-900 text-white rounded-sm hover:bg-zinc-700 disabled:opacity-50 flex items-center gap-1 self-end"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Set Mock
      </button>
    </div>
  );
}

function ConnectModal({ onClose, onConnected }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [connecting, setConnecting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Username and password are required");
      return;
    }
    setConnecting(true);
    try {
      await api.post("/qa/connect", form);
      toast.success("Connected to QA Utility");
      onConnected();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to connect");
    }
    setConnecting(false);
  };

  const inp = "w-full h-9 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" />
            <h3 className="font-heading font-black text-sm tracking-tight">Connect to QA Utility</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-4">Enter your QA Utility credentials. They are stored server-side and never sent to the browser.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Username"
            className={inp}
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            className={inp}
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={connecting}
              className="flex-1 h-9 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {connecting ? "Connecting…" : "Connect"}
            </button>
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function QAPanel({ feature, canEdit }) {
  const [status, setStatus] = useState({ url_configured: false, user_connected: false, connected: false });
  const [open, setOpen] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    api.get("/qa/user-status").then((r) => setStatus(r.data)).catch(() => {});
  }, []);

  const loadStatus = () => {
    api.get("/qa/user-status").then((r) => setStatus(r.data)).catch(() => {});
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post("/qa/disconnect");
      toast.success("Disconnected from QA Utility");
      loadStatus();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Disconnect failed");
    }
    setDisconnecting(false);
  };

  if (!status.url_configured || !canEdit) return null;

  const experiments = feature?.experiments || [];
  const redisKeys = feature?.redis_keys || [];

  return (
    <>
      {showConnect && (
        <ConnectModal
          onClose={() => setShowConnect(false)}
          onConnected={() => { setShowConnect(false); loadStatus(); }}
        />
      )}
      <section className="bg-white border border-zinc-200 rounded-sm" data-testid="qa-panel">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-black text-sm tracking-tight uppercase text-zinc-500">QA Actions</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-sm">live</span>
            {!status.connected && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-sm">not connected</span>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>

        {open && (
          <div className="px-5 pb-5 border-t border-zinc-100 pt-4 space-y-6">
            {!status.connected ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-zinc-500">Connect with your QA Utility credentials to use live actions.</p>
                <button
                  type="button"
                  onClick={() => setShowConnect(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Connect to QA Utility
                </button>
              </div>
            ) : (
              <>
                {status.user_connected && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={disconnect}
                      disabled={disconnecting}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-mono border border-zinc-200 rounded-sm hover:bg-zinc-50 text-zinc-500 disabled:opacity-50"
                    >
                      {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2Off className="w-3 h-3" />}
                      Disconnect
                    </button>
                  </div>
                )}
                {experiments.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Experiments / Flags</p>
                    <div>
                      {experiments.map((exp) => (
                        <ExperimentRow key={exp.key} exp={exp} />
                      ))}
                    </div>
                  </div>
                )}
                {redisKeys.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Redis Keys</p>
                    <div>
                      {redisKeys.map((rk) => (
                        <RedisRow key={rk.key} redisKey={rk} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">Withdrawal Mock</p>
                  <WithdrawalMockForm />
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
