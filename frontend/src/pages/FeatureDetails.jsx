import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Pencil, Trash2, ArrowLeft, Users, ShieldCheck, FileJson, Upload, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import QAPanel from "../components/QAPanel";

const FIELD_LABELS = {
  name: "Name", description: "Description", jira_ticket: "Jira",
  tags: "Tags", status: "Status", test_data: "Test Data",
  test_steps: "Test Steps", mocking_steps: "Mocking Steps",
  core_feature_id: "Core Feature", apis: "APIs",
  mongo_collections: "MongoDB", redis_keys: "Redis", experiments: "Experiments",
};

const ACTION_STYLE = {
  created:              "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  submitted_for_review: "bg-amber-100   dark:bg-amber-950/40   text-amber-700   dark:text-amber-400",
  approved:             "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  rejected:             "bg-red-100     dark:bg-red-950/40     text-red-700     dark:text-red-400",
  updated:              "bg-slate-100   dark:bg-zinc-800       text-slate-600   dark:text-zinc-300",
  verified:             "bg-cyan-100    dark:bg-cyan-950/40    text-cyan-700    dark:text-cyan-400",
  imported:             "bg-purple-100  dark:bg-purple-950/40  text-purple-700  dark:text-purple-400",
  deleted:              "bg-red-100     dark:bg-red-950/40     text-red-700     dark:text-red-400",
  attachment_added:     "bg-orange-100  dark:bg-orange-950/40  text-orange-700  dark:text-orange-400",
  attachment_deleted:   "bg-red-50      dark:bg-red-950/30     text-red-500     dark:text-red-400",
};

function ActionBadge({ action }) {
  const cls = ACTION_STYLE[action] || "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300";
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${cls}`}>{action}</span>
  );
}

function Section({ title, children, testid }) {
  return (
    <section
      className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl shadow-sm p-5"
      data-testid={testid}
    >
      <h2 className="font-heading font-black text-xs tracking-widest uppercase text-slate-400 dark:text-zinc-500 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function FeatureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role !== "viewer";
  const canReview = user?.role === "approver" || user?.role === "admin";
  const canDelete = canReview;
  const [feature, setFeature] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [coreFeaturesMap, setCoreFeaturesMap] = useState({});
  const [history, setHistory] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const load = async () => {
    try {
      const r = await api.get(`/features/${id}`);
      setFeature(r.data);
    } catch (e) {
      toast.error("Feature not found");
      navigate("/features");
    }
  };

  useEffect(() => {
    api.get("/core-features").then((r) => {
      const map = {};
      r.data.forEach((cf) => { map[cf.id] = cf.name; });
      setCoreFeaturesMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    api.get(`/features/${id}/history`).then((r) => setHistory(r.data)).catch(() => {});
  }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/features/${id}`);
      toast.success("Feature deleted");
      navigate("/features");
    } catch (e) { toast.error("Delete failed"); }
  };

  const handleApprove = async () => {
    setReviewing(true);
    try {
      const r = await api.post(`/features/${id}/approve`);
      setFeature(r.data);
      toast.success("Feature approved");
      api.get(`/features/${id}/history`).then((h) => setHistory(h.data)).catch(() => {});
    } catch (e) { toast.error(e?.response?.data?.detail?.error?.message || "Approve failed"); }
    setReviewing(false);
  };

  const handleRejectSubmit = async () => {
    setReviewing(true);
    try {
      await api.post(`/features/${id}/reject`, { reason: rejectReason });
      toast.success("Feature rejected and removed");
      navigate("/features");
    } catch (e) { toast.error(e?.response?.data?.detail?.error?.message || "Reject failed"); }
    setReviewing(false);
  };

  const handleVerify = async () => {
    try {
      const r = await api.post(`/features/${id}/verify`);
      setFeature(r.data);
      toast.success("Marked as verified");
      api.get(`/features/${id}/history`).then((h) => setHistory(h.data)).catch(() => {});
    } catch (e) { toast.error("Verify failed"); }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/features/${id}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("File attached");
      await load();
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
      toast.success("Attachment removed");
      await load();
    } catch (_e) { toast.error("Remove failed"); }
  };

  if (!feature) return <div className="p-8 text-sm text-slate-400 dark:text-zinc-500">Loading…</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl">

      {/* Back link */}
      <Link
        to="/features"
        className="text-xs font-mono text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center gap-1 mb-4 transition-colors"
        data-testid="back-to-features"
      >
        <ArrowLeft className="w-3 h-3" /> features
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          {feature.core_feature_id && coreFeaturesMap[feature.core_feature_id] && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-1" data-testid="core-feature-label">
              {coreFeaturesMap[feature.core_feature_id]}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="text-3xl md:text-4xl font-heading font-black tracking-tight break-words text-slate-900 dark:text-zinc-100"
              data-testid="feature-name"
            >
              {feature.name}
            </h1>
            {feature.pending_review && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                data-testid="pending-review-badge"
              >
                <Clock className="w-3 h-3" /> pending review
              </span>
            )}
            {feature.status === "archived" && (
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                data-testid="status-badge"
              >
                archived
              </span>
            )}
          </div>

          {feature.description && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-2xl">{feature.description}</p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-zinc-500 font-mono flex-wrap">
            {feature.owner && (
              <span>owner: <span className="text-slate-700 dark:text-zinc-300">{feature.owner}</span></span>
            )}
            {feature.jira_ticket && (
              <span>jira: <span className="text-slate-700 dark:text-zinc-300">{feature.jira_ticket}</span></span>
            )}
            <span>updated: {new Date(feature.updated_at).toLocaleString()}</span>
            {feature.created_by && (
              <span>by: <span className="text-slate-700 dark:text-zinc-300">{feature.created_by}</span></span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {(feature.contributors || []).length}
            </span>
          </div>

          {feature.last_verified_at && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400" data-testid="verified-meta">
              <ShieldCheck className="w-3.5 h-3.5" />
              verified {new Date(feature.last_verified_at).toLocaleDateString()} by {feature.last_verified_by}
            </div>
          )}

          {(feature.tags || []).length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {feature.tags.map((t) => (
                <span key={t} className="text-[11px] font-mono px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-full">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          {/* Approve/Reject — only for approvers/admins when feature is pending */}
          {canReview && feature.pending_review && (
            <>
              <button
                data-testid="approve-feature-btn"
                type="button"
                onClick={handleApprove}
                disabled={reviewing}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                data-testid="reject-feature-btn"
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={reviewing}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          <button
            data-testid="verify-feature-btn"
            type="button"
            onClick={handleVerify}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verify
          </button>
          {canEdit && (
            <button
              data-testid="edit-feature-btn"
              type="button"
              onClick={() => navigate(`/features/${id}/edit`)}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {canDelete && (
            <button
              data-testid="delete-feature-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-9 px-3 text-sm border border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-black text-lg mb-2 text-slate-900 dark:text-zinc-100">Delete feature?</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
              This will permanently remove &ldquo;{feature.name}&rdquo; and all its data.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9 px-4 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete"
                onClick={handleDelete}
                className="h-9 px-4 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-black text-lg mb-2 text-slate-900 dark:text-zinc-100">Reject feature?</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              &ldquo;{feature.name}&rdquo; will be removed. Add an optional reason for the record.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="h-9 px-4 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-reject"
                onClick={handleRejectSubmit}
                disabled={reviewing}
                className="h-9 px-4 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content sections */}
      <div className="grid grid-cols-1 gap-4">

        {/* Text blob sections */}
        {feature.test_data && (
          <Section title="Test Data" testid="section-test-data">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 text-slate-700 dark:text-zinc-300">
              {feature.test_data}
            </pre>
          </Section>
        )}
        {feature.test_steps && (
          <Section title="Test Steps" testid="section-test-steps">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 text-slate-700 dark:text-zinc-300">
              {feature.test_steps}
            </pre>
          </Section>
        )}
        {feature.mocking_steps && (
          <Section title="Mocking Steps" testid="section-mocking-steps">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 text-slate-700 dark:text-zinc-300">
              {feature.mocking_steps}
            </pre>
          </Section>
        )}

        {/* APIs */}
        {(feature.apis || []).filter(a => a.curl || a.description).length > 0 && (
          <Section title="APIs" testid="section-apis">
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {feature.apis.filter(a => a.curl || a.description).map((a, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0" data-testid={`api-row-${i}`}>
                  {a.description && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">{a.description}</p>
                  )}
                  {a.curl && (
                    <pre className="text-[11px] font-mono bg-zinc-950 dark:bg-zinc-950 text-zinc-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all border border-zinc-800">
                      {a.curl}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* KV sections: MongoDB, Redis, Experiments */}
        {[
          { key: "mongo_collections", title: "MongoDB Collections", testid: "section-mongo" },
          { key: "redis_keys",        title: "Redis Keys",          testid: "section-redis" },
          { key: "experiments",       title: "Experiments / Flags", testid: "section-experiments" },
        ].map(
          (s) =>
            (feature[s.key] || []).length > 0 && (
              <Section key={s.key} title={s.title} testid={s.testid}>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {feature[s.key].map((item, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-start gap-4">
                      <code className="text-xs font-mono text-blue-700 dark:text-blue-400 whitespace-nowrap bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md shrink-0">
                        {item.key}
                      </code>
                      {item.description && (
                        <span className="text-xs text-slate-500 dark:text-zinc-400">{item.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )
        )}

        {/* Contributors */}
        {(feature.contributors || []).length > 0 && (
          <Section title="Contributors" testid="section-contributors">
            <div className="flex gap-2 flex-wrap">
              {feature.contributors.map((c) => (
                <span key={c} className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-slate-600 dark:text-zinc-300">
                  {c}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Collection files */}
        {((feature.attachments || []).length > 0 || canEdit) && (
          <Section title="Collection Files" testid="section-attachments">
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {(feature.attachments || []).map((att) => (
                <div key={att.file_id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3" data-testid={`attachment-${att.file_id}`}>
                  <FileJson className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate text-slate-700 dark:text-zinc-200">{att.filename}</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      {(att.size / 1024).toFixed(1)} KB · {att.uploaded_by} · {new Date(att.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDownload(att)} className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                    download
                  </button>
                  {canEdit && (
                    <button type="button" onClick={() => handleDeleteAttachment(att.file_id)} className="text-xs font-mono text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shrink-0">
                      remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canEdit && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <label
                  htmlFor="attachment-upload"
                  className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingAttachment
                      ? "opacity-50 cursor-not-allowed border-slate-200 dark:border-zinc-700"
                      : "border-slate-300 dark:border-zinc-600 hover:border-slate-400 dark:hover:border-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  {uploadingAttachment ? "Uploading…" : "Attach .json file"}
                </label>
                <input id="attachment-upload" type="file" accept=".json" onChange={handleAttachmentUpload} disabled={uploadingAttachment} className="hidden" />
              </div>
            )}
          </Section>
        )}

        <QAPanel feature={feature} canEdit={canEdit} />

        {/* History */}
        {history.length > 0 && (
          <Section title="History" testid="section-history">
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {history.map((event) => (
                <div key={event.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3" data-testid={`history-event-${event.id}`}>
                  <ActionBadge action={event.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-zinc-300">{event.user_name}</p>
                    {event.changed_fields?.length > 0 && (
                      <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                        {event.changed_fields.map((f) => FIELD_LABELS[f] || f).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
