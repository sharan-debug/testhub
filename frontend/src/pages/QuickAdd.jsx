import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";

export default function QuickAdd() {
  const navigate = useNavigate();
  const [coreFeatures, setCoreFeatures] = useState([]);
  const [coreFeatureId, setCoreFeatureId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [cfError, setCfError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/core-features").then((r) => setCoreFeatures(r.data)).catch(() => {});
  }, []);

  const save = async () => {
    if (!coreFeatureId) { setCfError("Select a core feature"); return; }
    if (!name.trim()) { toast.error("Feature name is required"); return; }
    setCfError("");
    setSaving(true);
    try {
      const r = await api.post("/features", {
        core_feature_id: coreFeatureId,
        name: name.trim(),
        test_data: notes,
      });
      toast.success("Feature created");
      navigate(`/features/${r.data.id}`);
    } catch (e) {
      toast.error("Save failed: " + (e?.response?.data?.detail || e.message));
    }
    setSaving(false);
  };

  const inputCls = "w-full h-10 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 md:p-10 max-w-xl">
      <Link to="/features" className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1 mb-6">
        <ArrowLeft className="w-3 h-3" /> features
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-amber-500" />
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Quick Add</p>
        </div>
        <h1 className="text-3xl font-heading font-black tracking-tight">Add a feature</h1>
        <p className="text-sm text-zinc-500 mt-1">Fill the two required fields and paste any notes. You can fill in the rest later.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-mono uppercase text-zinc-500 block mb-1.5">Core Feature *</label>
          <select
            data-testid="qa-core-feature"
            value={coreFeatureId}
            onChange={(e) => { setCoreFeatureId(e.target.value); setCfError(""); }}
            className={`${inputCls}${cfError ? " border-red-400 focus:ring-red-500" : ""}`}
          >
            <option value="">Select…</option>
            {coreFeatures.map((cf) => (
              <option key={cf.id} value={cf.id}>{cf.name}</option>
            ))}
          </select>
          {cfError && <p className="text-xs text-red-600 mt-1">{cfError}</p>}
        </div>

        <div>
          <label className="text-xs font-mono uppercase text-zinc-500 block mb-1.5">Feature Name *</label>
          <input
            data-testid="qa-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            className={inputCls}
            placeholder="e.g. Cancellation flow — price objection"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-mono uppercase text-zinc-500 block mb-1.5">Notes <span className="text-zinc-400 normal-case">(optional)</span></label>
          <textarea
            data-testid="qa-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder={"Paste anything useful — test data, steps, user IDs, flags, Redis keys, cURL commands.\n\nYou can organise it into sections later using the full edit form."}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link
            to="/features/new"
            className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2"
          >
            Need all fields? Use the full form →
          </Link>
          <button
            data-testid="qa-save-btn"
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-9 px-5 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-50 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
