import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Pencil, Trash2, ArrowLeft, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

function Section({ title, children, testid }) {
  return (
    <section className="bg-white border border-zinc-200 rounded-sm p-5" data-testid={testid}>
      <h2 className="font-heading font-black text-sm tracking-tight uppercase text-zinc-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default function FeatureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role !== "viewer";
  const [feature, setFeature] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coreFeaturesMap, setCoreFeaturesMap] = useState({});

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

  const handleDelete = async () => {
    try {
      await api.delete(`/features/${id}`);
      toast.success("Feature deleted");
      navigate("/features");
    } catch (e) { toast.error("Delete failed"); }
  };

  const handleVerify = async () => {
    try {
      const r = await api.post(`/features/${id}/verify`);
      setFeature(r.data);
      toast.success("Marked as verified");
    } catch (e) { toast.error("Verify failed"); }
  };

  if (!feature) return <div className="p-8 text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <Link to="/features" className="text-xs font-mono text-zinc-500 hover:text-black flex items-center gap-1 mb-4" data-testid="back-to-features">
        <ArrowLeft className="w-3 h-3" /> features
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="min-w-0">
          {feature.core_feature_id && coreFeaturesMap[feature.core_feature_id] && (
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-1" data-testid="core-feature-label">
              {coreFeaturesMap[feature.core_feature_id]}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight break-words" data-testid="feature-name">{feature.name}</h1>
            {feature.status === "archived" && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 border border-amber-200" data-testid="status-badge">archived</span>
            )}
          </div>
          {feature.description && <p className="text-sm text-zinc-600 mt-2 max-w-2xl">{feature.description}</p>}
          <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500 font-mono flex-wrap">
            {feature.owner && <span>owner: <span className="text-zinc-900">{feature.owner}</span></span>}
            {feature.jira_ticket && <span>jira: <span className="text-zinc-900">{feature.jira_ticket}</span></span>}
            <span>updated: {new Date(feature.updated_at).toLocaleString()}</span>
            {feature.created_by && <span>by: <span className="text-zinc-900">{feature.created_by}</span></span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(feature.contributors || []).length}</span>
          </div>
          {feature.last_verified_at && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-emerald-700" data-testid="verified-meta">
              <ShieldCheck className="w-3.5 h-3.5" />
              verified {new Date(feature.last_verified_at).toLocaleDateString()} by {feature.last_verified_by}
            </div>
          )}
          {(feature.tags || []).length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {feature.tags.map((t) => (
                <span key={t} className="text-[11px] font-mono px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-sm">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            data-testid="verify-feature-btn"
            type="button"
            onClick={handleVerify}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-emerald-700 rounded-sm transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verify
          </button>
          {canEdit && (
            <>
              <button
                data-testid="edit-feature-btn"
                type="button"
                onClick={() => navigate(`/features/${id}/edit`)}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 rounded-sm transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                data-testid="delete-feature-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-9 px-3 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-red-600 hover:text-red-700 rounded-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm border border-zinc-200 p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-black text-lg mb-2">Delete feature?</h3>
            <p className="text-sm text-zinc-600 mb-6">This will permanently remove "{feature.name}" and all its data.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="h-9 px-4 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50"
              >Cancel</button>
              <button
                data-testid="confirm-delete"
                onClick={handleDelete}
                className="h-9 px-4 text-sm bg-red-600 hover:bg-red-700 text-white rounded-sm"
              >Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {feature.test_data && (
          <Section title="Test Data" testid="section-test-data">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-zinc-50 border border-zinc-100 rounded-sm p-3 text-zinc-800">{feature.test_data}</pre>
          </Section>
        )}
        {feature.test_steps && (
          <Section title="Test Steps" testid="section-test-steps">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-zinc-50 border border-zinc-100 rounded-sm p-3 text-zinc-800">{feature.test_steps}</pre>
          </Section>
        )}
        {feature.mocking_steps && (
          <Section title="Mocking Steps" testid="section-mocking-steps">
            <pre className="text-xs whitespace-pre-wrap font-mono bg-zinc-50 border border-zinc-100 rounded-sm p-3 text-zinc-800">{feature.mocking_steps}</pre>
          </Section>
        )}

        {(feature.apis || []).filter(a => a.curl || a.description).length > 0 && (
          <Section title="APIs" testid="section-apis">
            <div className="divide-y divide-zinc-100">
              {feature.apis.filter(a => a.curl || a.description).map((a, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0" data-testid={`api-row-${i}`}>
                  {a.description && <p className="text-xs text-zinc-600 mb-2">{a.description}</p>}
                  {a.curl && (
                    <pre className="text-[11px] font-mono bg-zinc-900 text-zinc-100 rounded-sm p-3 overflow-x-auto whitespace-pre-wrap break-all">{a.curl}</pre>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {[
          { key: "mongo_collections", title: "MongoDB Collections", testid: "section-mongo" },
          { key: "redis_keys", title: "Redis Keys", testid: "section-redis" },
          { key: "experiments", title: "Experiments / Flags", testid: "section-experiments" },
        ].map(
          (s) =>
            (feature[s.key] || []).length > 0 && (
              <Section key={s.key} title={s.title} testid={s.testid}>
                <div className="divide-y divide-zinc-100">
                  {feature[s.key].map((item, i) => (
                    <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-start gap-4">
                      <code className="text-xs font-mono text-zinc-900 whitespace-nowrap">{item.key}</code>
                      {item.description && <span className="text-xs text-zinc-600">{item.description}</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )
        )}

        {(feature.contributors || []).length > 0 && (
          <Section title="Contributors" testid="section-contributors">
            <div className="flex gap-2 flex-wrap">
              {feature.contributors.map((c) => (
                <span key={c} className="text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-sm px-2 py-1">{c}</span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
