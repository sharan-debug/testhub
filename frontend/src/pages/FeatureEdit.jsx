import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Trash2, ArrowLeft, Save, FileJson, Upload } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  name: "", core_feature_id: "", jira_ticket: "", description: "", tags: [],
  status: "active",
  test_data: "", test_steps: "", mocking_steps: "",
  apis: [], mongo_collections: [], redis_keys: [], experiments: [],
};

function Section({ title, children, testid }) {
  return (
    <section className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5" data-testid={testid}>
      <h2 className="font-heading font-black text-xs tracking-widest uppercase text-indigo-400 mb-3">{title}</h2>
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
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);

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
        for (const file of pendingAttachments) {
          try {
            const fd = new FormData();
            fd.append("file", file);
            await api.post(`/features/${saved.id}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
          } catch (_e) {
            toast.error(`Failed to attach ${file.name}`);
          }
        }
      }
      toast.success(isEdit ? "Saved" : "Created");
      navigate(`/features/${saved.id}`);
    } catch (e) {
      toast.error("Save failed: " + (e?.response?.data?.detail || e.message));
    }
    setSaving(false);
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post(`/features/${id}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      update({ attachments: [...(f.attachments || []), r.data] });
      toast.success("File attached");
    } catch (_e) {
      toast.error(_e?.response?.data?.detail?.message || _e?.response?.data?.detail || "Upload failed");
    }
    setUploadingAttachment(false);
  };

  const handleDownload = async (att) => {
    try {
      const r = await api.get(`/features/${id}/attachments/${att.file_id}`, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_e) { toast.error("Download failed"); }
  };

  const handleDeleteAttachment = async (fileId) => {
    try {
      await api.delete(`/features/${id}/attachments/${fileId}`);
      update({ attachments: (f.attachments || []).filter((a) => a.file_id !== fileId) });
      toast.success("Attachment removed");
    } catch (_e) { toast.error("Remove failed"); }
  };

  const handlePendingFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Only .json files are allowed");
      return;
    }
    if (pendingAttachments.some((p) => p.name === file.name)) {
      toast.error(`${file.name} already queued`);
      return;
    }
    setPendingAttachments((prev) => [...prev, file]);
  };

  const inp = "w-full h-9 px-3 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const inpBase = "h-9 px-3 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const ta = "w-full px-3 py-2 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none";

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <Link to={isEdit ? `/features/${id}` : "/features"} className="text-xs font-mono text-indigo-400 hover:text-indigo-600 flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> back
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">{isEdit ? "Edit" : "Create"}</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-zinc-900">{isEdit ? f.name || "Feature" : "New Feature"}</h1>
        </div>
        <button
          data-testid="save-feature-btn"
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="space-y-4">
        <Section title="Basics" testid="section-basics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Core Feature *</label>
              <select
                data-testid="input-core-feature"
                value={f.core_feature_id}
                onChange={(e) => { update({ core_feature_id: e.target.value }); setCfError(""); }}
                className={`${inp}${cfError ? " border-red-300 focus:ring-red-400" : ""}`}
              >
                <option value="">Select core feature…</option>
                {coreFeatures.map((cf) => (
                  <option key={cf.id} value={cf.id}>{cf.name}</option>
                ))}
              </select>
              {cfError && <p className="text-xs text-red-600 mt-1">{cfError}</p>}
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Name *</label>
              <input data-testid="input-name" value={f.name} onChange={(e) => update({ name: e.target.value })} className={inp} placeholder="e.g. Checkout flow" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Jira Ticket</label>
              <input data-testid="input-jira" value={f.jira_ticket} onChange={(e) => update({ jira_ticket: e.target.value })} className={inp} placeholder="e.g. PROJ-123" />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Owner</label>
              <div className="h-9 px-3 flex items-center text-sm text-zinc-500 bg-indigo-50 border border-indigo-100 rounded-lg" data-testid="owner-display">
                {user?.name || "—"}
              </div>
            </div>
            {isEdit && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Status</label>
                <select data-testid="input-status" value={f.status} onChange={(e) => update({ status: e.target.value })} className={inp}>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Description</label>
              <textarea data-testid="input-description" value={f.description} onChange={(e) => update({ description: e.target.value })} className={ta} rows={2} placeholder="What does this feature do?" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Tags</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {f.tags.map((t) => (
                  <span key={t} className="text-[11px] font-mono px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-1" data-testid={`tag-chip-${t}`}>
                    {t}
                    <button type="button" onClick={() => update({ tags: f.tags.filter((x) => x !== t) })} className="text-indigo-400 hover:text-red-600 leading-none">×</button>
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
                  className={`${inp} flex-1`}
                />
                <button type="button" data-testid="add-tag-btn" onClick={addTag} className="h-9 px-3 text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50">Add</button>
              </div>
            </div>
          </div>
        </Section>

        {[
          { key: "test_data", title: "Test Data", placeholder: "user_id: 123456\nplan: premium_monthly\ncancellation_reason: price", testid: "section-test-data" },
          { key: "test_steps", title: "Test Steps", placeholder: "1. Log in as user 123456\n2. Navigate to /account/cancel\n3. Verify the offer screen appears", testid: "section-test-steps" },
          { key: "mocking_steps", title: "Mocking Steps", placeholder: "1. Set CANCELLATION_FLOW_V2 = TEST\n2. Mock POST /api/cancel → 200\n3. Clear Redis key before starting", testid: "section-mocking-steps" },
        ].map((s) => (
          <Section key={s.key} title={s.title} testid={s.testid}>
            <textarea
              data-testid={`input-${s.key}`}
              value={f[s.key]}
              onChange={(e) => update({ [s.key]: e.target.value })}
              placeholder={s.placeholder}
              rows={5}
              className={`${ta} font-mono text-xs`}
            />
          </Section>
        ))}

        <Section title="APIs" testid="section-apis">
          <p className="text-xs text-zinc-400 mb-3">Paste the full cURL command. Do not paste production credentials.</p>
          <div className="space-y-3">
            {f.apis.map((a, i) => (
              <div key={i} className="border border-indigo-100 rounded-lg p-3 bg-indigo-50/30" data-testid={`api-editor-${i}`}>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0 space-y-2">
                    <textarea
                      data-testid={`api-curl-${i}`}
                      value={a.curl}
                      onChange={(e) => setApi(i, { curl: e.target.value })}
                      rows={3}
                      placeholder={"curl -X POST 'https://api.example.com/checkout' \\\n  -H 'Authorization: Bearer {token}'"}
                      className={`${ta} font-mono text-xs`}
                    />
                    <input
                      data-testid={`api-desc-${i}`}
                      value={a.description}
                      onChange={(e) => setApi(i, { description: e.target.value })}
                      className={inp}
                      placeholder="Description (optional)"
                    />
                  </div>
                  <button type="button" onClick={() => removeApi(i)} data-testid={`api-remove-${i}`} className="h-9 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" data-testid="add-api-btn" onClick={addApi} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50 text-zinc-600">
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
                  <input value={item.key} onChange={(e) => setKV(s.key, i, { key: e.target.value })} placeholder={s.ph} className={`${inpBase} shrink-0 w-64 font-mono text-xs`} />
                  <input value={item.description} onChange={(e) => setKV(s.key, i, { description: e.target.value })} placeholder={s.descPh} className={`${inpBase} flex-1 min-w-0`} />
                  <button type="button" onClick={() => removeKV(s.key, i)} className="h-9 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" data-testid={`add-${s.key}-btn`} onClick={() => addKV(s.key)} className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50 text-zinc-600">
                <Plus className="w-4 h-4" />Add
              </button>
            </div>
          </Section>
        ))}

        {isEdit ? (
          <Section title="Collection Files" testid="section-attachments">
            <div className="divide-y divide-indigo-50">
              {(f.attachments || []).map((att) => (
                <div key={att.file_id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                  <FileJson className="w-4 h-4 text-indigo-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate text-zinc-700">{att.filename}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {(att.size / 1024).toFixed(1)} KB · {att.uploaded_by} · {new Date(att.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDownload(att)} className="text-xs font-mono text-indigo-600 hover:text-indigo-800 shrink-0">download</button>
                  <button type="button" onClick={() => handleDeleteAttachment(att.file_id)} className="text-xs font-mono text-red-500 hover:text-red-700 shrink-0">remove</button>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-indigo-50">
              <label
                htmlFor="attachment-upload-edit"
                className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed border-indigo-200 rounded-lg cursor-pointer transition-colors ${uploadingAttachment ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-400 hover:bg-indigo-50"}`}
              >
                <Upload className="w-3 h-3 text-indigo-400" />
                {uploadingAttachment ? "Uploading…" : "Attach .json file"}
              </label>
              <input id="attachment-upload-edit" type="file" accept=".json" onChange={handleAttachmentUpload} disabled={uploadingAttachment} className="hidden" />
            </div>
          </Section>
        ) : (
          <Section title="Collection Files" testid="section-attachments">
            {pendingAttachments.length > 0 && (
              <div className="divide-y divide-indigo-50 mb-3">
                {pendingAttachments.map((file, i) => (
                  <div key={file.name} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                    <FileJson className="w-4 h-4 text-indigo-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono truncate text-zinc-700">{file.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · will upload on save</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs font-mono text-red-500 hover:text-red-700 shrink-0"
                    >remove</button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label
                htmlFor="attachment-upload-new"
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed border-indigo-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <Upload className="w-3 h-3 text-indigo-400" />
                Attach .json file
              </label>
              <input id="attachment-upload-new" type="file" accept=".json" onChange={handlePendingFileSelect} className="hidden" />
            </div>
          </Section>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          data-testid="save-feature-btn-bottom"
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
