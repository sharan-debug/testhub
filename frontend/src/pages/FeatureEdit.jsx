import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  name: "", description: "", owner: "", tags: [],
  test_data: "", test_steps: "", mocking_steps: "",
  apis: [], mongo_collections: [], redis_keys: [], experiments: [],
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function Section({ title, children, testid }) {
  return (
    <section className="bg-white border border-zinc-200 rounded-sm p-5" data-testid={testid}>
      <h2 className="font-heading font-black text-sm tracking-tight uppercase text-zinc-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default function FeatureEdit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const r = await api.get(`/features/${id}`);
        setF({ ...EMPTY, ...r.data });
      } catch (e) {
        toast.error("Feature not found");
        navigate("/features");
      }
    })();
  }, [id]);

  const update = (patch) => setF((prev) => ({ ...prev, ...patch }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !f.tags.includes(t)) update({ tags: [...f.tags, t] });
    setTagInput("");
  };

  const addApi = () => update({ apis: [...f.apis, { method: "GET", path: "", description: "", sample_request: "", sample_response: "" }] });
  const removeApi = (i) => update({ apis: f.apis.filter((_, idx) => idx !== i) });
  const setApi = (i, patch) => update({ apis: f.apis.map((a, idx) => idx === i ? { ...a, ...patch } : a) });

  const addKV = (key) => update({ [key]: [...(f[key] || []), { key: "", description: "" }] });
  const removeKV = (key, i) => update({ [key]: f[key].filter((_, idx) => idx !== i) });
  const setKV = (key, i, patch) => update({ [key]: f[key].map((item, idx) => idx === i ? { ...item, ...patch } : item) });

  const save = async () => {
    if (!f.name.trim()) { toast.error("Feature name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: f.name, description: f.description, owner: f.owner, tags: f.tags,
        test_data: f.test_data, test_steps: f.test_steps, mocking_steps: f.mocking_steps,
        apis: f.apis, mongo_collections: f.mongo_collections, redis_keys: f.redis_keys, experiments: f.experiments,
      };
      let saved;
      if (isEdit) {
        const r = await api.put(`/features/${id}`, payload);
        saved = r.data;
      } else {
        const r = await api.post("/features", payload);
        saved = r.data;
      }
      toast.success(isEdit ? "Saved" : "Created");
      navigate(`/features/${saved.id}`);
    } catch (e) {
      toast.error("Save failed: " + (e?.response?.data?.detail || e.message));
    }
    setSaving(false);
  };

  const inputCls = "w-full h-9 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const textareaCls = "w-full px-3 py-2 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <Link to={isEdit ? `/features/${id}` : "/features"} className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> back
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">{isEdit ? "Edit" : "Create"}</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight">{isEdit ? f.name || "Feature" : "New Feature"}</h1>
        </div>
        <button
          data-testid="save-feature-btn"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="space-y-4">
        <Section title="Basics" testid="section-basics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Name *</label>
              <input data-testid="input-name" value={f.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} placeholder="e.g. Checkout flow" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Owner</label>
              <input data-testid="input-owner" value={f.owner} onChange={(e) => update({ owner: e.target.value })} className={inputCls} placeholder="Team or person" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Description</label>
              <textarea data-testid="input-description" value={f.description} onChange={(e) => update({ description: e.target.value })} className={textareaCls} rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Tags</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {f.tags.map((t) => (
                  <span key={t} className="text-[11px] font-mono px-2 py-0.5 bg-zinc-100 rounded-sm flex items-center gap-1" data-testid={`tag-chip-${t}`}>
                    {t}
                    <button onClick={() => update({ tags: f.tags.filter((x) => x !== t) })} className="text-zinc-400 hover:text-red-600 leading-none">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  data-testid="input-tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag and press Enter"
                  className={`${inputCls} flex-1`}
                />
                <button data-testid="add-tag-btn" onClick={addTag} className="h-9 px-3 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">Add</button>
              </div>
            </div>
          </div>
        </Section>

        {[
          { key: "test_data", title: "Test Data", placeholder: "Users, records, seeds…", testid: "section-test-data" },
          { key: "test_steps", title: "Test Steps", placeholder: "1. Do X\n2. Verify Y", testid: "section-test-steps" },
          { key: "mocking_steps", title: "Mocking Steps", placeholder: "How to stub external services, feature flags, etc.", testid: "section-mocking-steps" },
        ].map((s) => (
          <Section key={s.key} title={s.title} testid={s.testid}>
            <textarea
              data-testid={`input-${s.key}`}
              value={f[s.key]}
              onChange={(e) => update({ [s.key]: e.target.value })}
              placeholder={s.placeholder}
              rows={5}
              className={`${textareaCls} font-mono text-xs`}
            />
          </Section>
        ))}

        <Section title="APIs" testid="section-apis">
          <div className="space-y-3">
            {f.apis.map((a, i) => (
              <div key={i} className="border border-zinc-200 rounded-sm p-3 bg-zinc-50/60" data-testid={`api-editor-${i}`}>
                <div className="flex gap-2 mb-2">
                  <select
                    data-testid={`api-method-${i}`}
                    value={a.method}
                    onChange={(e) => setApi(i, { method: e.target.value })}
                    className="h-9 px-2 text-sm border border-zinc-200 rounded-sm bg-white font-mono w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input data-testid={`api-path-${i}`} value={a.path} onChange={(e) => setApi(i, { path: e.target.value })} className={`${inputCls} flex-1 font-mono text-xs`} placeholder="/api/checkout/init" />
                  <button onClick={() => removeApi(i)} data-testid={`api-remove-${i}`} className="h-9 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input data-testid={`api-desc-${i}`} value={a.description} onChange={(e) => setApi(i, { description: e.target.value })} className={`${inputCls} mb-2`} placeholder="Description" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <textarea data-testid={`api-req-${i}`} value={a.sample_request} onChange={(e) => setApi(i, { sample_request: e.target.value })} rows={3} placeholder="Sample request (JSON)" className={`${textareaCls} font-mono text-[11px]`} />
                  <textarea data-testid={`api-res-${i}`} value={a.sample_response} onChange={(e) => setApi(i, { sample_response: e.target.value })} rows={3} placeholder="Sample response (JSON)" className={`${textareaCls} font-mono text-[11px]`} />
                </div>
              </div>
            ))}
            <button data-testid="add-api-btn" onClick={addApi} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">
              <Plus className="w-4 h-4" />Add API
            </button>
          </div>
        </Section>

        {[
          { key: "mongo_collections", title: "MongoDB Collections", ph: "collection.name", testid: "section-mongo" },
          { key: "redis_keys", title: "Redis Keys", ph: "cache:user:{id}", testid: "section-redis" },
          { key: "experiments", title: "Experiments / Flags", ph: "flag_name", testid: "section-experiments" },
        ].map((s) => (
          <Section key={s.key} title={s.title} testid={s.testid}>
            <div className="space-y-2">
              {(f[s.key] || []).map((item, i) => (
                <div key={i} className="flex gap-2" data-testid={`${s.key}-row-${i}`}>
                  <input value={item.key} onChange={(e) => setKV(s.key, i, { key: e.target.value })} placeholder={s.ph} className={`${inputCls} w-64 font-mono text-xs`} />
                  <input value={item.description} onChange={(e) => setKV(s.key, i, { description: e.target.value })} placeholder="Description" className={`${inputCls} flex-1`} />
                  <button onClick={() => removeKV(s.key, i)} className="h-9 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button data-testid={`add-${s.key}-btn`} onClick={() => addKV(s.key)} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">
                <Plus className="w-4 h-4" />Add
              </button>
            </div>
          </Section>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          data-testid="save-feature-btn-bottom"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
