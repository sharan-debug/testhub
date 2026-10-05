import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { api } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

const EMPTY = {
  name: "",
  core_feature_id: "",
  jira_ticket: "",
  description: "",
  tags: [],
};

const inp =
  "w-full px-3 py-2 text-sm bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 " +
  "text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 transition-all shadow-sm";

const lbl = "block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5";

export default function FeatureDrawer({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [tagInput, setTagInput] = useState("");
  const [coreFeatures, setCoreFeatures] = useState([]);
  const [saving, setSaving] = useState(false);
  const [cfError, setCfError] = useState("");
  const nameRef = useRef(null);

  // Fetch core features once per open
  useEffect(() => {
    if (!open) return;
    api.get("/core-features").then((r) => setCoreFeatures(r.data)).catch(() => {});
  }, [open]);

  // Reset form & focus name on open
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setTagInput("");
      setCfError("");
      // Defer focus until the translate animation completes
      setTimeout(() => nameRef.current?.focus(), 310);
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) update({ tags: [...form.tags, t] });
    setTagInput("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast("Feature name is required", "error"); return; }
    if (!form.core_feature_id) { setCfError("Core Feature is required"); return; }
    setCfError("");
    setSaving(true);
    try {
      const r = await api.post("/features", {
        name: form.name.trim(),
        core_feature_id: form.core_feature_id,
        jira_ticket: form.jira_ticket.trim(),
        description: form.description.trim(),
        tags: form.tags,
      });
      addToast("Feature created successfully!", "success");
      onCreated?.(r.data);
      onClose();
      navigate(`/features/${r.data.id}`);
    } catch (e) {
      addToast("Save failed", "error", e?.response?.data?.detail || e.message);
    }
    setSaving(false);
  };

  const openFullForm = () => { onClose(); navigate("/features/new"); };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm z-50",
          "transition-opacity duration-300 ease-in-out",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create feature"
        className={[
          "fixed inset-y-0 right-0 w-full max-w-md",
          "bg-white dark:bg-zinc-900",
          "border-l border-slate-200 dark:border-zinc-800",
          "shadow-2xl flex flex-col z-50",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500">New</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 mt-0.5 leading-tight">Create Feature</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Core Feature */}
          <div>
            <label htmlFor="df-core" className={lbl}>Core Feature *</label>
            <select
              id="df-core"
              value={form.core_feature_id}
              onChange={(e) => { update({ core_feature_id: e.target.value }); setCfError(""); }}
              className={`${inp} h-9${cfError ? " border-red-300 dark:border-red-700 focus:ring-red-400" : ""}`}
            >
              <option value="">Select core feature…</option>
              {coreFeatures.map((cf) => (
                <option key={cf.id} value={cf.id}>{cf.name}</option>
              ))}
            </select>
            {cfError && <p className="text-xs text-red-500 mt-1">{cfError}</p>}
          </div>

          {/* Feature Name */}
          <div>
            <label htmlFor="df-name" className={lbl}>Feature Name *</label>
            <input
              id="df-name"
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="e.g. Checkout flow"
              className={`${inp} h-9`}
            />
          </div>

          {/* Jira Ticket */}
          <div>
            <label htmlFor="df-jira" className={lbl}>Jira Ticket</label>
            <input
              id="df-jira"
              type="text"
              value={form.jira_ticket}
              onChange={(e) => update({ jira_ticket: e.target.value })}
              placeholder="e.g. PROJ-123"
              className={`${inp} h-9`}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="df-desc" className={lbl}>Description</label>
            <textarea
              id="df-desc"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="What does this feature do?"
              rows={3}
              className={inp}
            />
          </div>

          {/* Tags */}
          <div>
            <label className={lbl}>Tags</label>
            {form.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-2">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium
                               bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300
                               rounded-full border border-slate-200 dark:border-zinc-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => update({ tags: form.tags.filter((x) => x !== t) })}
                      aria-label={`Remove ${t}`}
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add tag and press Enter"
                className={`${inp} h-9 flex-1`}
              />
              <button
                type="button"
                onClick={addTag}
                aria-label="Add tag"
                className="h-9 w-9 flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full-form escape hatch */}
          <p className="text-xs text-slate-400 dark:text-zinc-600 leading-relaxed pt-1 border-t border-slate-100 dark:border-zinc-800">
            Need test data, mocking steps, APIs, or Redis keys?{" "}
            <button
              type="button"
              onClick={openFullForm}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Open the full form →
            </button>
          </p>
        </div>

        {/* ── Action dock ── */}
        <div className="border-t border-slate-100 dark:border-zinc-800 p-4 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-lg shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Creating…" : "Create Feature"}
          </button>
        </div>
      </div>
    </>
  );
}
