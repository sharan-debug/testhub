import { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const TABS = ["Experiments", "Redis", "Withdrawal Mock", "Mock VPA"];

const inp = "h-9 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full font-mono";
const btn = "h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50 disabled:opacity-40 flex items-center gap-1.5 shrink-0";
const btnPrimary = "h-9 px-4 text-sm bg-zinc-900 text-white rounded-sm hover:bg-zinc-700 disabled:opacity-50 flex items-center gap-1.5";

// ---------- Experiments ----------

function ExperimentsTab() {
  const [name, setName] = useState("");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState({});
  const [applying, setApplying] = useState(false);
  const [resetting, setResetting] = useState(false);

  const getState = async () => {
    if (!name.trim()) { toast.error("Experiment name is required"); return; }
    setLoading(true);
    setState(null);
    try {
      const r = await api.get(`/qa/experiment?name=${encodeURIComponent(name.trim())}`);
      setState(r.data);
      const w = {};
      (r.data.variants || []).forEach((v) => { w[v.name] = v.weight; });
      setWeights(w);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to fetch experiment");
    }
    setLoading(false);
  };

  const apply = async () => {
    const variants = Object.entries(weights).map(([n, w]) => ({ name: n, weight: Number(w) }));
    const total = variants.reduce((s, v) => s + v.weight, 0);
    if (total !== 100) { toast.error(`Weights must sum to 100 (currently ${total})`); return; }
    setApplying(true);
    try {
      await api.put("/qa/experiment", { name: name.trim(), variants });
      toast.success("Experiment updated");
      await getState();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Update failed");
    }
    setApplying(false);
  };

  const reset = async () => {
    setResetting(true);
    try {
      await api.post("/qa/experiment/reset", { name: name.trim() });
      toast.success("Experiment reset to previous weights");
      await getState();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Reset failed");
    }
    setResetting(false);
  };

  const total = Object.values(weights).reduce((s, v) => s + Number(v || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setState(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") getState(); }}
          placeholder="Experiment name e.g. CANCELLATION_FLOW_V2"
          className={`flex-1 ${inp}`}
        />
        <button type="button" onClick={getState} disabled={loading || !name.trim()} className={btn}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Get state
        </button>
      </div>

      {state && (
        <div className="bg-white border border-zinc-200 rounded-sm p-5 space-y-5">
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono font-semibold text-zinc-900 flex-1">{state.name || name}</p>
            {state.enabled !== undefined && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${state.enabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                {state.enabled ? "enabled" : "disabled"}
              </span>
            )}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">Variant weights</p>
            <div className="space-y-2">
              {Object.entries(weights).map(([variantName, weight]) => (
                <div key={variantName} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-zinc-700 flex-1 min-w-0 truncate">{variantName}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weight}
                    onChange={(e) => setWeights((w) => ({ ...w, [variantName]: e.target.value }))}
                    className="w-20 h-8 px-2 text-sm text-center border border-zinc-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-400 w-4">%</span>
                  <button
                    type="button"
                    onClick={() => setWeights((w) => ({ ...w, [variantName]: 100, ...Object.fromEntries(Object.keys(w).filter((k) => k !== variantName).map((k) => [k, 0])) }))}
                    className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700 shrink-0"
                  >
                    force 100%
                  </button>
                </div>
              ))}
            </div>
            <p className={`text-xs font-mono mt-2 ${total === 100 ? "text-emerald-600" : "text-red-500"}`}>
              Total: {total}% {total === 100 ? "✓" : `— needs ${100 - total > 0 ? "+" : ""}${100 - total} more`}
            </p>
          </div>

          <div className="flex gap-2 pt-1 border-t border-zinc-100">
            <button type="button" onClick={apply} disabled={applying || total !== 100} className={btnPrimary}>
              {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Apply weights
            </button>
            <button type="button" onClick={reset} disabled={resetting} className={btn}>
              {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Reset to previous
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Redis ----------

function RedisTab() {
  const [key, setKey] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [form, setForm] = useState({ value: "", ttl: 1, ttl_unit: "HOUR" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const read = async () => {
    if (!key.trim()) { toast.error("Key is required"); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await api.get(`/qa/redis?key=${encodeURIComponent(key.trim())}`);
      setResult(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to read key");
    }
    setLoading(false);
  };

  const save = async () => {
    if (!key.trim()) { toast.error("Key is required"); return; }
    if (!form.value.trim()) { toast.error("Value is required"); return; }
    setSaving(true);
    try {
      await api.post("/qa/redis", { key: key.trim(), value: form.value, ttl: Number(form.ttl), ttl_unit: form.ttl_unit });
      toast.success("Key set");
      setShowSet(false);
      await read();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Set failed");
    }
    setSaving(false);
  };

  const del = async () => {
    if (!key.trim()) { toast.error("Key is required"); return; }
    setDeleting(true);
    try {
      await api.delete(`/qa/redis?key=${encodeURIComponent(key.trim())}`);
      toast.success("Key deleted");
      setResult(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Delete failed");
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <input
          value={key}
          onChange={(e) => { setKey(e.target.value); setResult(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") read(); }}
          placeholder="Redis key e.g. r:jar:cancellation:{user_id}"
          className="flex-1 min-w-0 h-9 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
        <button type="button" onClick={read} disabled={loading || !key.trim()} className={btn}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Read
        </button>
        <button type="button" onClick={() => setShowSet((s) => !s)} disabled={!key.trim()} className={btn}>
          Set
        </button>
        <button type="button" onClick={del} disabled={deleting || !key.trim()} className={`${btn} text-red-600 hover:text-red-700`}>
          {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete
        </button>
      </div>

      {result !== null && (
        <pre className="bg-white border border-zinc-200 rounded-sm p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48">
          {typeof result === "object" ? JSON.stringify(result, null, 2) : String(result?.value ?? result)}
        </pre>
      )}

      {showSet && (
        <div className="bg-white border border-zinc-200 rounded-sm p-4 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Set value</p>
          <textarea
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="Value to store…"
            rows={3}
            className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 rounded-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 shrink-0">TTL:</span>
            <input
              type="number"
              min={1}
              value={form.ttl}
              onChange={(e) => setForm((f) => ({ ...f, ttl: e.target.value }))}
              className="w-20 h-8 px-2 text-sm border border-zinc-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={form.ttl_unit}
              onChange={(e) => setForm((f) => ({ ...f, ttl_unit: e.target.value }))}
              className="h-8 px-2 text-sm border border-zinc-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {["HOUR", "MINUTE", "DAY", "SECOND"].map((u) => <option key={u}>{u}</option>)}
            </select>
            <button type="button" onClick={save} disabled={saving} className={`${btnPrimary} ml-auto`}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
            <button type="button" onClick={() => setShowSet(false)} className={btn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Withdrawal Mock ----------

function WithdrawalMockTab() {
  const [form, setForm] = useState({ phone_number: "", provider: "", status: "", status_code: "", amount: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.phone_number.trim()) { toast.error("Phone number is required"); return; }
    if (!form.provider.trim()) { toast.error("Provider is required"); return; }
    if (!form.status.trim()) { toast.error("Status is required"); return; }
    setSaving(true);
    try {
      const payload = {
        phone_number: form.phone_number.trim(),
        provider: form.provider.trim(),
        status: form.status.trim(),
      };
      if (form.status_code) payload.status_code = Number(form.status_code);
      if (form.amount) payload.amount = Number(form.amount);
      await api.post("/qa/mock/withdrawal", payload);
      toast.success("Withdrawal mock set");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to set mock");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-md">
      <div className="bg-white border border-zinc-200 rounded-sm p-5 space-y-4">
        <div>
          <label htmlFor="wm-phone" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Phone Number</label>
          <input id="wm-phone" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div>
          <label htmlFor="wm-provider" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Provider</label>
          <select id="wm-provider" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} className={inp}>
            <option value="">Select provider…</option>
            <option value="AXIS">AXIS</option>
            <option value="ICICI">ICICI</option>
          </select>
        </div>
        <div>
          <label htmlFor="wm-status" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Status</label>
          <select id="wm-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inp}>
            <option value="">Select status…</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div>
          <label htmlFor="wm-status-code" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Status Code <span className="normal-case text-zinc-400">(optional)</span></label>
          <input id="wm-status-code" type="number" value={form.status_code} onChange={(e) => setForm((f) => ({ ...f, status_code: e.target.value }))} placeholder="e.g. 200" className={inp} />
        </div>
        <div>
          <label htmlFor="wm-amount" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Amount <span className="normal-case text-zinc-400">(optional)</span></label>
          <input id="wm-amount" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 500" className={inp} />
        </div>
        <button type="button" onClick={submit} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Set Mock
        </button>
      </div>
    </div>
  );
}

// ---------- VPA Mock ----------

function VpaMockTab() {
  const [form, setForm] = useState({ phone_number: "", encrypted_vpa: "", user_name: "", vpa_type: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.phone_number.trim()) { toast.error("Phone number is required"); return; }
    if (!form.encrypted_vpa.trim()) { toast.error("Encrypted VPA is required"); return; }
    if (!form.user_name.trim()) { toast.error("User name is required"); return; }
    if (!form.vpa_type.trim()) { toast.error("VPA type is required"); return; }
    setSaving(true);
    try {
      await api.post("/qa/mock/vpa", {
        phone_number: form.phone_number.trim(),
        encrypted_vpa: form.encrypted_vpa.trim(),
        user_name: form.user_name.trim(),
        vpa_type: form.vpa_type.trim(),
      });
      toast.success("VPA mock set");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to set VPA mock");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-md">
      <div className="bg-white border border-zinc-200 rounded-sm p-5 space-y-4">
        <div>
          <label htmlFor="vpa-phone" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Phone Number</label>
          <input id="vpa-phone" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div>
          <label htmlFor="vpa-encrypted" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">Encrypted VPA</label>
          <input id="vpa-encrypted" value={form.encrypted_vpa} onChange={(e) => setForm((f) => ({ ...f, encrypted_vpa: e.target.value }))} placeholder="Encrypted VPA string" className={inp} />
        </div>
        <div>
          <label htmlFor="vpa-username" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">User Name</label>
          <input id="vpa-username" value={form.user_name} onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))} placeholder="e.g. John Doe" className={inp} />
        </div>
        <div>
          <label htmlFor="vpa-type" className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1.5">VPA Type</label>
          <input id="vpa-type" value={form.vpa_type} onChange={(e) => setForm((f) => ({ ...f, vpa_type: e.target.value }))} placeholder="e.g. UPI" className={inp} />
        </div>
        <button type="button" onClick={submit} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Set VPA Mock
        </button>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function QAActionsPage() {
  const [tab, setTab] = useState("Experiments");

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">QA Utility</p>
        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight">QA Actions</h1>
        <p className="text-sm text-zinc-500 mt-1.5">Live operations — changes take effect in the QA environment immediately.</p>
      </div>

      <div className="flex gap-0 border-b border-zinc-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-zinc-900 text-zinc-900 font-medium"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Experiments" && <ExperimentsTab />}
      {tab === "Redis" && <RedisTab />}
      {tab === "Withdrawal Mock" && <WithdrawalMockTab />}
      {tab === "Mock VPA" && <VpaMockTab />}
    </div>
  );
}
