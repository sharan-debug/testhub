import { CheckCircle2, Link2, Loader2, Lock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";

const TABS = ["Experiments", "Redis", "Withdrawal Mock", "Mock VPA", "SIP"];

const inp = "h-9 px-3 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full font-mono";
const btnPrimary = "inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200 shrink-0";
const btnSecondary = "inline-flex items-center gap-1.5 h-9 px-4 text-sm border border-indigo-200 bg-white hover:bg-indigo-50 text-zinc-600 rounded-lg disabled:opacity-40 transition-colors shrink-0";
const btnDanger = "inline-flex items-center gap-1.5 h-9 px-4 text-sm border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-lg disabled:opacity-40 transition-colors shrink-0";

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
        <button type="button" onClick={getState} disabled={loading || !name.trim()} className={btnSecondary}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Get state
        </button>
      </div>

      {state && (
        <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5 space-y-5">
          <div className="flex items-center gap-3">
            <p className="text-sm font-mono font-semibold text-zinc-900 flex-1">{state.name || name}</p>
            {state.enabled !== undefined && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${state.enabled ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                {state.enabled ? "enabled" : "disabled"}
              </span>
            )}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-3">Variant weights</p>
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
                    className="w-20 h-8 px-2 text-sm text-center border border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-sm text-zinc-400 w-4">%</span>
                  <button
                    type="button"
                    onClick={() => setWeights((w) => ({
                      ...w,
                      [variantName]: 100,
                      ...Object.fromEntries(Object.keys(w).filter((k) => k !== variantName).map((k) => [k, 0])),
                    }))}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-700 shrink-0"
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

          <div className="flex gap-2 pt-1 border-t border-indigo-50 dark:border-zinc-700 flex-wrap">
            <button type="button" onClick={apply} disabled={applying || total !== 100} className={btnPrimary}>
              {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Apply weights
            </button>
            <button type="button" onClick={reset} disabled={resetting} className={btnSecondary}>
              {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Reset to previous
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={async () => {
                setApplying(true);
                try {
                  await api.post("/qa/experiment/toggle", { name: name.trim(), enable: true });
                  toast.success("Experiment enabled");
                  await getState();
                } catch (e) { toast.error(e?.response?.data?.detail || "Toggle failed"); }
                setApplying(false);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg disabled:opacity-40 transition-colors shrink-0"
            >
              {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Enable
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={async () => {
                setApplying(true);
                try {
                  await api.post("/qa/experiment/toggle", { name: name.trim(), enable: false });
                  toast.success("Experiment disabled");
                  await getState();
                } catch (e) { toast.error(e?.response?.data?.detail || "Toggle failed"); }
                setApplying(false);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 rounded-lg disabled:opacity-40 transition-colors shrink-0"
            >
              {applying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Disable
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
          className="flex-1 min-w-0 h-9 px-3 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
        />
        <button type="button" onClick={read} disabled={loading || !key.trim()} className={btnSecondary}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Read
        </button>
        <button type="button" onClick={() => setShowSet((s) => !s)} disabled={!key.trim()} className={btnSecondary}>
          Set
        </button>
        <button type="button" onClick={del} disabled={deleting || !key.trim()} className={btnDanger}>
          {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete
        </button>
      </div>

      {result !== null && (
        <pre className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48">
          {typeof result === "object" ? JSON.stringify(result, null, 2) : String(result?.value ?? result)}
        </pre>
      )}

      {showSet && (
        <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-4 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Set value</p>
          <textarea
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="Value to store…"
            rows={3}
            className="w-full px-3 py-2 text-sm font-mono border border-indigo-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 shrink-0">TTL:</span>
            <input
              type="number"
              min={1}
              value={form.ttl}
              onChange={(e) => setForm((f) => ({ ...f, ttl: e.target.value }))}
              className="w-20 h-8 px-2 text-sm border border-indigo-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <select
              value={form.ttl_unit}
              onChange={(e) => setForm((f) => ({ ...f, ttl_unit: e.target.value }))}
              className="h-8 px-2 text-sm border border-indigo-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {["HOUR", "MINUTE", "DAY", "SECOND"].map((u) => <option key={u}>{u}</option>)}
            </select>
            <button type="button" onClick={save} disabled={saving} className={`${btnPrimary} ml-auto`}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
            <button type="button" onClick={() => setShowSet(false)} className={btnSecondary}>Cancel</button>
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
    if (!form.provider) { toast.error("Provider is required"); return; }
    if (!form.status) { toast.error("Status is required"); return; }
    setSaving(true);
    try {
      const payload = {
        phone_number: form.phone_number.trim(),
        provider: form.provider,
        status: form.status,
      };
      if (form.status_code) payload.status_code = form.status_code.trim();
      if (form.amount) payload.amount = Number(form.amount);
      await api.post("/qa/mock/withdrawal", payload);
      toast.success("Withdrawal mock set");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to set mock");
    }
    setSaving(false);
  };

  const field = "space-y-1.5";
  const lbl = "text-[10px] font-mono uppercase tracking-widest text-indigo-400 block";

  return (
    <div className="max-w-md">
      <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5 space-y-4">
        <div className={field}>
          <label htmlFor="wm-phone" className={lbl}>Phone Number</label>
          <input id="wm-phone" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="wm-provider" className={lbl}>Provider</label>
          <select id="wm-provider" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} className={inp}>
            <option value="">Select provider…</option>
            <option value="AXIS">AXIS</option>
            <option value="ICICI">ICICI</option>
          </select>
        </div>
        <div className={field}>
          <label htmlFor="wm-status" className={lbl}>Status</label>
          <select id="wm-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inp}>
            <option value="">Select status…</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div className={field}>
          <label htmlFor="wm-status-code" className={lbl}>Status Code <span className="normal-case font-sans text-zinc-400">(optional)</span></label>
          <input id="wm-status-code" type="text" value={form.status_code} onChange={(e) => setForm((f) => ({ ...f, status_code: e.target.value }))} placeholder="e.g. 200" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="wm-amount" className={lbl}>Amount <span className="normal-case font-sans text-zinc-400">(optional)</span></label>
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
  const [delForm, setDelForm] = useState({ phone_number: "", vpa: "" });
  const [deleting, setDeleting] = useState(false);

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

  const field = "space-y-1.5";
  const lbl = "text-[10px] font-mono uppercase tracking-widest text-indigo-400 block";

  return (
    <div className="max-w-md">
      <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5 space-y-4">
        <div className={field}>
          <label htmlFor="vpa-phone" className={lbl}>Phone Number</label>
          <input id="vpa-phone" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="vpa-encrypted" className={lbl}>Encrypted VPA</label>
          <input id="vpa-encrypted" value={form.encrypted_vpa} onChange={(e) => setForm((f) => ({ ...f, encrypted_vpa: e.target.value }))} placeholder="Encrypted VPA string" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="vpa-username" className={lbl}>User Name</label>
          <input id="vpa-username" value={form.user_name} onChange={(e) => setForm((f) => ({ ...f, user_name: e.target.value }))} placeholder="e.g. John Doe" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="vpa-type" className={lbl}>VPA Type</label>
          <input id="vpa-type" value={form.vpa_type} onChange={(e) => setForm((f) => ({ ...f, vpa_type: e.target.value }))} placeholder="e.g. UPI" className={inp} />
        </div>
        <button type="button" onClick={submit} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Set VPA Mock
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800/60 border border-red-100 dark:border-red-900/40 rounded-xl shadow-sm p-5 space-y-4 mt-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-red-400">Delete VPA</p>
        <div className={field}>
          <label htmlFor="vpa-del-phone" className={lbl}>Phone Number</label>
          <input id="vpa-del-phone" value={delForm.phone_number} onChange={(e) => setDelForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="vpa-del-vpa" className={lbl}>VPA to delete</label>
          <input id="vpa-del-vpa" value={delForm.vpa} onChange={(e) => setDelForm((f) => ({ ...f, vpa: e.target.value }))} placeholder="e.g. user@upi" className={inp} />
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (!delForm.phone_number.trim()) { toast.error("Phone number is required"); return; }
            if (!delForm.vpa.trim()) { toast.error("VPA is required"); return; }
            setDeleting(true);
            try {
              await api.post("/qa/mock/vpa/delete", { phone_number: delForm.phone_number.trim(), vpa: delForm.vpa.trim() });
              toast.success("VPA deleted");
              setDelForm({ phone_number: "", vpa: "" });
            } catch (e) { toast.error(e?.response?.data?.detail || "Delete failed"); }
            setDeleting(false);
          }}
          className={`${btnDanger} w-full justify-center`}
        >
          {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete VPA
        </button>
      </div>
    </div>
  );
}

// ---------- SIP ----------

const SIP_PAUSE_DURATIONS = [
  "ONE","TWO","THREE","FIVE","EIGHT","TEN","TWELVE","FIFTEEN","TWENTY",
  "MONTH","TWO_MONTHS","THREE_MONTHS",
  "WEEK","TWO_WEEKS","THREE_WEEKS","FOUR_WEEKS","DISABLE",
];

function SipTab() {
  const [detailsForm, setDetailsForm] = useState({ phone_number: "" });
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [setupForm, setSetupForm] = useState({ phone_number: "", sip_type: "", mandate_amount: "" });
  const [settingUp, setSettingUp] = useState(false);

  const [pauseForm, setPauseForm] = useState({ phone_number: "", sip_type: "", action: "PAUSE", pause_duration: "" });
  const [pausing, setPausing] = useState(false);

  const [cancelForm, setCancelForm] = useState({ phone_number: "", sip_type: "" });
  const [cancelling, setCancelling] = useState(false);

  const field = "space-y-1.5";
  const lbl = "text-[10px] font-mono uppercase tracking-widest text-indigo-400 block";
  const card = "bg-white dark:bg-zinc-800/60 border border-indigo-100 dark:border-zinc-700 rounded-xl shadow-sm p-5 space-y-4";

  const getDetails = async () => {
    if (!detailsForm.phone_number.trim()) { toast.error("Phone number is required"); return; }
    setLoadingDetails(true);
    setDetails(null);
    try {
      const r = await api.post("/qa/sip/details", { phone_number: detailsForm.phone_number.trim() });
      setDetails(r.data);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to fetch SIP details"); }
    setLoadingDetails(false);
  };

  const setup = async () => {
    if (!setupForm.phone_number.trim()) { toast.error("Phone number is required"); return; }
    if (!setupForm.sip_type.trim()) { toast.error("SIP type is required"); return; }
    const amount = Number(setupForm.mandate_amount);
    if (!amount || amount < 10 || amount > 5000) { toast.error("Mandate amount must be between 10 and 5000"); return; }
    setSettingUp(true);
    try {
      await api.post("/qa/sip/setup", { phone_number: setupForm.phone_number.trim(), sip_type: setupForm.sip_type.trim(), mandate_amount: amount });
      toast.success("SIP set up");
    } catch (e) { toast.error(e?.response?.data?.detail || "Setup failed"); }
    setSettingUp(false);
  };

  const pause = async () => {
    if (!pauseForm.phone_number.trim()) { toast.error("Phone number is required"); return; }
    if (!pauseForm.sip_type.trim()) { toast.error("SIP type is required"); return; }
    setPausing(true);
    try {
      const payload = { phone_number: pauseForm.phone_number.trim(), sip_type: pauseForm.sip_type.trim(), action: pauseForm.action };
      if (pauseForm.action === "PAUSE" && pauseForm.pause_duration) payload.pause_duration = pauseForm.pause_duration;
      await api.post("/qa/sip/pause", payload);
      toast.success(`SIP ${pauseForm.action.toLowerCase()}d`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Action failed"); }
    setPausing(false);
  };

  const cancel = async () => {
    if (!cancelForm.phone_number.trim()) { toast.error("Phone number is required"); return; }
    if (!cancelForm.sip_type.trim()) { toast.error("SIP type is required"); return; }
    setCancelling(true);
    try {
      await api.post("/qa/sip/cancel", { phone_number: cancelForm.phone_number.trim(), sip_type: cancelForm.sip_type.trim() });
      toast.success("SIP cancelled");
      setCancelForm({ phone_number: "", sip_type: "" });
    } catch (e) { toast.error(e?.response?.data?.detail || "Cancel failed"); }
    setCancelling(false);
  };

  return (
    <div className="space-y-6 max-w-md">
      {/* Details */}
      <div className={card}>
        <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">SIP Details</p>
        <div className={field}>
          <label htmlFor="sip-details-phone" className={lbl}>Phone Number</label>
          <div className="flex gap-2">
            <input id="sip-details-phone" value={detailsForm.phone_number} onChange={(e) => { setDetailsForm({ phone_number: e.target.value }); setDetails(null); }} onKeyDown={(e) => { if (e.key === "Enter") getDetails(); }} placeholder="+919876543210" className={`flex-1 ${inp}`} />
            <button type="button" onClick={getDetails} disabled={loadingDetails || !detailsForm.phone_number.trim()} className={btnSecondary}>
              {loadingDetails && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Fetch
            </button>
          </div>
        </div>
        {details && (
          <pre className="bg-indigo-50/60 dark:bg-zinc-900/60 border border-indigo-100 dark:border-zinc-700 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-48">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
      </div>

      {/* Setup */}
      <div className={card}>
        <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Setup / Update SIP</p>
        <div className={field}>
          <label htmlFor="sip-setup-phone" className={lbl}>Phone Number</label>
          <input id="sip-setup-phone" value={setupForm.phone_number} onChange={(e) => setSetupForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="sip-setup-type" className={lbl}>SIP Type</label>
          <input id="sip-setup-type" value={setupForm.sip_type} onChange={(e) => setSetupForm((f) => ({ ...f, sip_type: e.target.value }))} placeholder="e.g. DAILY_SAVINGS" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="sip-setup-amount" className={lbl}>Mandate Amount <span className="normal-case font-sans text-zinc-400">(₹10–5000)</span></label>
          <input id="sip-setup-amount" type="number" min={10} max={5000} value={setupForm.mandate_amount} onChange={(e) => setSetupForm((f) => ({ ...f, mandate_amount: e.target.value }))} placeholder="e.g. 100" className={inp} />
        </div>
        <button type="button" onClick={setup} disabled={settingUp} className={`${btnPrimary} w-full justify-center`}>
          {settingUp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Setup SIP
        </button>
      </div>

      {/* Pause / Resume */}
      <div className={card}>
        <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Pause / Resume SIP</p>
        <div className={field}>
          <label htmlFor="sip-pause-phone" className={lbl}>Phone Number</label>
          <input id="sip-pause-phone" value={pauseForm.phone_number} onChange={(e) => setPauseForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="sip-pause-type" className={lbl}>SIP Type</label>
          <input id="sip-pause-type" value={pauseForm.sip_type} onChange={(e) => setPauseForm((f) => ({ ...f, sip_type: e.target.value }))} placeholder="e.g. DAILY_SAVINGS" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="sip-pause-action" className={lbl}>Action</label>
          <select id="sip-pause-action" value={pauseForm.action} onChange={(e) => setPauseForm((f) => ({ ...f, action: e.target.value, pause_duration: "" }))} className={inp}>
            <option value="PAUSE">PAUSE</option>
            <option value="RESUME">RESUME</option>
          </select>
        </div>
        {pauseForm.action === "PAUSE" && (
          <div className={field}>
            <label htmlFor="sip-pause-dur" className={lbl}>Pause Duration <span className="normal-case font-sans text-zinc-400">(optional)</span></label>
            <select id="sip-pause-dur" value={pauseForm.pause_duration} onChange={(e) => setPauseForm((f) => ({ ...f, pause_duration: e.target.value }))} className={inp}>
              <option value="">No duration specified</option>
              {SIP_PAUSE_DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <button type="button" onClick={pause} disabled={pausing} className={`${btnPrimary} w-full justify-center`}>
          {pausing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {pauseForm.action === "PAUSE" ? "Pause SIP" : "Resume SIP"}
        </button>
      </div>

      {/* Cancel */}
      <div className="bg-white dark:bg-zinc-800/60 border border-red-100 dark:border-red-900/40 rounded-xl shadow-sm p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-red-400">Cancel SIP</p>
        <div className={field}>
          <label htmlFor="sip-cancel-phone" className={lbl}>Phone Number</label>
          <input id="sip-cancel-phone" value={cancelForm.phone_number} onChange={(e) => setCancelForm((f) => ({ ...f, phone_number: e.target.value }))} placeholder="+919876543210" className={inp} />
        </div>
        <div className={field}>
          <label htmlFor="sip-cancel-type" className={lbl}>SIP Type</label>
          <input id="sip-cancel-type" value={cancelForm.sip_type} onChange={(e) => setCancelForm((f) => ({ ...f, sip_type: e.target.value }))} placeholder="e.g. DAILY_SAVINGS" className={inp} />
        </div>
        <button type="button" onClick={cancel} disabled={cancelling} className={`${btnDanger} w-full justify-center`}>
          {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Cancel SIP
        </button>
      </div>
    </div>
  );
}

// ---------- Connect modal ----------

function ConnectModal({ onClose, onConnected }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [connecting, setConnecting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) { toast.error("Username and password are required"); return; }
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

  const modalInp = "w-full h-9 px-3 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" />
            <h3 className="font-heading font-black text-sm tracking-tight">Connect to QA Utility</h3>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Your credentials are stored securely server-side and used to auto-refresh your session.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="QA Utility username"
            className={modalInp}
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            className={modalInp}
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

// ---------- Locked placeholder ----------

function LockedPlaceholder({ urlConfigured, onConnect }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <Lock className="w-5 h-5 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-700 mb-1">Connect to use live actions</p>
      <p className="text-xs text-zinc-400 mb-5 max-w-xs">
        Connect with your QA Utility credentials to manage experiments, Redis keys, and mocks.
      </p>
      {urlConfigured && (
        <button
          type="button"
          onClick={onConnect}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-200"
        >
          <Link2 className="w-4 h-4" />
          Connect to QA Utility
        </button>
      )}
    </div>
  );
}

// ---------- Page ----------

export default function QAActionsPage() {
  const [tab, setTab] = useState("Experiments");
  const [qaStatus, setQaStatus] = useState(null);
  const [showConnect, setShowConnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = () => {
    api.get("/qa/user-status")
      .then((r) => setQaStatus(r.data))
      .catch(() => setQaStatus({ url_configured: false, user_connected: false, connected: false }));
  };

  useEffect(() => {
    api.get("/qa/user-status")
      .then((r) => setQaStatus(r.data))
      .catch(() => setQaStatus({ url_configured: false, user_connected: false, connected: false }));
  }, []);

  const handleConnected = () => {
    setShowConnect(false);
    loadStatus();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post("/qa/disconnect");
      toast.success("Disconnected from QA Utility");
      setQaStatus((s) => ({ ...s, user_connected: false, connected_username: null, connected: false }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to disconnect");
    }
    setDisconnecting(false);
  };

  const userConnected = qaStatus?.user_connected;

  return (
    <>
      {showConnect && <ConnectModal onClose={() => setShowConnect(false)} onConnected={handleConnected} />}
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="mb-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">QA Utility</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-zinc-900 dark:text-zinc-100">QA Actions</h1>
          <p className="text-sm text-zinc-400 mt-1.5">Live operations — changes take effect in the QA environment immediately.</p>
        </div>

        {/* Connection status bar */}
        {qaStatus && (
          userConnected ? (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800">Connected to QA Utility</p>
                {qaStatus.connected_username && (
                  <p className="text-xs text-emerald-700 font-mono">{qaStatus.connected_username}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="shrink-0 inline-flex items-center gap-1 h-7 px-3 text-xs border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {disconnecting && <Loader2 className="w-3 h-3 animate-spin" />}
                Disconnect
              </button>
            </div>
          ) : (
            <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Link2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">Not connected to QA Utility</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {qaStatus.url_configured
                    ? "Connect with your credentials to use live actions."
                    : "QA Utility URL is not configured — contact your admin."}
                </p>
              </div>
              {qaStatus.url_configured && (
                <button
                  type="button"
                  onClick={() => setShowConnect(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />Connect
                </button>
              )}
            </div>
          )
        )}

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-indigo-100 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-indigo-600 text-indigo-600 font-medium"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content — locked until personally connected */}
        {!userConnected ? (
          <LockedPlaceholder
            urlConfigured={qaStatus?.url_configured}
            onConnect={() => setShowConnect(true)}
          />
        ) : (
          <>
            {tab === "Experiments" && <ExperimentsTab />}
            {tab === "Redis" && <RedisTab />}
            {tab === "Withdrawal Mock" && <WithdrawalMockTab />}
            {tab === "Mock VPA" && <VpaMockTab />}
            {tab === "SIP" && <SipTab />}
          </>
        )}
      </div>
    </>
  );
}
