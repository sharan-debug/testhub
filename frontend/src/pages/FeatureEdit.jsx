import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  name: "", core_feature_id: "", jira_ticket: "", description: "", tags: [],
  status: "active",
  test_data: "", test_steps: "", mocking_steps: "",
  apis: [], mongo_collections: [], redis_keys: [], experiments: [],
};

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
  const { user } = useAuth();
  const [f, setF] = useState(EMPTY);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [coreFeatures, setCoreFeatures] = useState([]);
  const [cfError, setCfError] = useState("");

  useEffect(() => {
    api.get("/core-features").then((r) => setCoreFeatures(r.data)).catch(() => {});
  }, []);

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

  const addApi = () => update({ apis: [...f.apis, { curl: "", description: "" }] });
  const removeApi = (i) => update({ apis: f.apis.filter((_, idx) => idx !== i) });
  const setApi = (i, patch) => update({ apis: f.apis.map((a, idx) => idx === i ? { ...a, ...patch } : a) });

  const addKV = (key) => update({ [key]: [...(f[key] || []), { key: "", description: "" }] });
  const removeKV = (key, i) => update({ [key]: f[key].filter((_, idx) => idx !== i) });
  const setKV = (key, i, patch) => update({ [key]: f[key].map((item, idx) => idx === i ? { ...item, ...patch } : item) });

  const save = async () => {
    if (!f.name.trim()) { toast.error("Feature name is required"); return; }
    if (!f.core_feature_id) { setCfError("Core Feature is required"); return; }
    setCfError("");
    setSaving(true);
    try {
      const payload = {
        name: f.name, core_feature_id: f.core_feature_id,
        jira_ticket: f.jira_ticket, description: f.description, tags: f.tags,
        ...(isEdit ? { status: f.status } : {}),
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
  const inputBaseCls = "h-9 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
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
            <div className="md:col-span-2">
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Core Feature *</label>
              <select
                data-testid="input-core-feature"
                value={f.core_feature_id}
                onChange={(e) => { update({ core_feature_id: e.target.value }); setCfError(""); }}
                className={`${inputCls}${cfError ? " border-red-400 focus:ring-red-500" : ""}`}
              >
                <option value="">Select core feature…</option>
                {coreFeatures.map((cf) => (
                  <option key={cf.id} value={cf.id}>{cf.name}</option>
                ))}
              </select>
              {cfError && <p className="text-xs text-red-600 mt-1">{cfError}</p>}
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Name *</label>
              <input data-testid="input-name" value={f.name} onChange={(e) => update({ name: e.target.value })} className={inputCls} placeholder="e.g. Checkout flow" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Jira Ticket</label>
              <input data-testid="input-jira" value={f.jira_ticket} onChange={(e) => update({ jira_ticket: e.target.value })} className={inputCls} placeholder="e.g. PROJ-123" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Owner</label>
              <div className="h-9 px-3 flex items-center text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-sm" data-testid="owner-display">
                {user?.name || "—"}
              </div>
            </div>
            {isEdit && (
              <div>
                <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Status</label>
                <select data-testid="input-status" value={f.status} onChange={(e) => update({ status: e.target.value })} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Description</label>
              <textarea data-testid="input-description" value={f.description} onChange={(e) => update({ description: e.target.value })} className={textareaCls} rows={2} placeholder="What does this feature do? e.g. Cancellation flow that lets users downgrade or cancel their subscription" />
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
          {
            key: "test_data",
            title: "Test Data",
            placeholder: "user_id: 123456\nplan: premium_monthly\ncancellation_reason: price\nemail: testuser@example.com",
            testid: "section-test-data",
          },
          {
            key: "test_steps",
            title: "Test Steps",
            placeholder: "1. Log in as user 123456\n2. Navigate to /account/cancel\n3. Select reason: price → click Continue\n4. Verify the offer screen appears\n5. Click Confirm → expect redirect to /account with cancellation banner",
            testid: "section-test-steps",
          },
          {
            key: "mocking_steps",
            title: "Mocking Steps",
            placeholder: "1. Set CANCELLATION_FLOW_V2 = TEST in Unleash\n2. Mock POST /api/cancel → 200 { status: 'cancelled' }\n3. Ensure Redis key r:jar:cancellation:{user_id} is cleared before starting",
            testid: "section-mocking-steps",
          },
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
          <p className="text-xs text-zinc-500 mb-3">Paste the full cURL command. Secrets in headers are stored as-is — do not paste production credentials.</p>
          <div className="space-y-3">
            {f.apis.map((a, i) => (
              <div key={i} className="border border-zinc-200 rounded-sm p-3 bg-zinc-50/60" data-testid={`api-editor-${i}`}>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0 space-y-2">
                    <textarea
                      data-testid={`api-curl-${i}`}
                      value={a.curl}
                      onChange={(e) => setApi(i, { curl: e.target.value })}
                      rows={3}
                      placeholder={"curl -X POST 'https://api.example.com/checkout' \\\n  -H 'Authorization: Bearer {token}' \\\n  -d '{\"plan\":\"premium\"}'"}
                      className={`${textareaCls} font-mono text-xs`}
                    />
                    <input
                      data-testid={`api-desc-${i}`}
                      value={a.description}
                      onChange={(e) => setApi(i, { description: e.target.value })}
                      className={inputCls}
                      placeholder="Description (optional)"
                    />
                  </div>
                  <button onClick={() => removeApi(i)} data-testid={`api-remove-${i}`} className="h-9 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-sm shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button data-testid="add-api-btn" onClick={addApi} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50">
              <Plus className="w-4 h-4" />Add API
            </button>
          </div>
        </Section>

        {[
          { key: "mongo_collections", title: "MongoDB Collections", ph: "e.g. cancellations", descPh: "What is stored here?", testid: "section-mongo" },
          { key: "redis_keys", title: "Redis Keys", ph: "e.g. r:jar:cancellation:{user_id}", descPh: "What this key holds", testid: "section-redis" },
          { key: "experiments", title: "Experiments / Flags", ph: "e.g. CANCELLATION_FLOW_V2", descPh: "Options: CONTROL / TEST", testid: "section-experiments" },
        ].map((s) => (
          <Section key={s.key} title={s.title} testid={s.testid}>
            <div className="space-y-2">
              {(f[s.key] || []).map((item, i) => (
                <div key={i} className="flex gap-2" data-testid={`${s.key}-row-${i}`}>
                  <input value={item.key} onChange={(e) => setKV(s.key, i, { key: e.target.value })} placeholder={s.ph} className={`${inputBaseCls} shrink-0 w-64 font-mono text-xs`} />
                  <input value={item.description} onChange={(e) => setKV(s.key, i, { description: e.target.value })} placeholder={s.descPh} className={`${inputBaseCls} flex-1 min-w-0`} />
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
