import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Upload } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [coreFeaturesMap, setCoreFeaturesMap] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role !== "viewer";

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/features");
      setFeatures(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get("/core-features").then((r) => {
      const map = {};
      r.data.forEach((cf) => { map[cf.id] = cf.name; });
      setCoreFeaturesMap(map);
    }).catch(() => {});
  }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    features.forEach((f) => (f.tags || []).forEach((t) => s.add(t)));
    return Array.from(s);
  }, [features]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return features.filter((f) => {
      if (activeTag && !(f.tags || []).includes(activeTag)) return false;
      if (!query) return true;
      return (
        (f.name || "").toLowerCase().includes(query) ||
        (f.description || "").toLowerCase().includes(query) ||
        (f.owner || "").toLowerCase().includes(query) ||
        (f.tags || []).some((t) => t.toLowerCase().includes(query))
      );
    });
  }, [features, q, activeTag]);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Library</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight">Features</h1>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              data-testid="import-btn"
              type="button"
              onClick={() => navigate("/import")}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 rounded-sm transition-colors"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
            <button
              data-testid="features-new-btn"
              type="button"
              onClick={() => navigate("/features/new")}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          data-testid="feature-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, description, owner, tag…"
          className="w-full h-11 pl-9 pr-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            data-testid="tag-filter-all"
            onClick={() => setActiveTag("")}
            className={`text-[11px] font-mono px-2 py-1 rounded-sm border ${activeTag === "" ? "bg-black text-white border-black" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"}`}
          >
            all
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              data-testid={`tag-filter-${t}`}
              onClick={() => setActiveTag(t === activeTag ? "" : t)}
              className={`text-[11px] font-mono px-2 py-1 rounded-sm border ${activeTag === t ? "bg-black text-white border-black" : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-sm">
        <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
          <div className="col-span-4">Feature</div>
          <div className="col-span-2">Owner</div>
          <div className="col-span-3">Tags</div>
          <div className="col-span-2">APIs</div>
          <div className="col-span-1 text-right">Updated</div>
        </div>
        {loading && <div className="p-8 text-center text-sm text-zinc-500">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500 mb-3">No features match.</p>
            {canEdit && (
              <button
                data-testid="features-empty-new"
                type="button"
                onClick={() => navigate("/features/new")}
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm"
              >
                <Plus className="w-4 h-4" />Add one
              </button>
            )}
          </div>
        )}
        <div className="divide-y divide-zinc-100">
          {filtered.map((f) => (
            <Link key={f.id} to={`/features/${f.id}`} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-zinc-50 transition-colors" data-testid={`feature-row-${f.id}`}>
              <div className="col-span-4 min-w-0">
                {f.core_feature_id && coreFeaturesMap[f.core_feature_id] && (
                  <div className="text-[10px] font-mono text-zinc-400 truncate mb-0.5" data-testid={`core-feature-name-${f.id}`}>{coreFeaturesMap[f.core_feature_id]}</div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="font-medium text-sm truncate">{f.name}</div>
                  {f.status === "archived" && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 shrink-0">archived</span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 truncate">{f.description || "—"}</div>
              </div>
              <div className="col-span-2 text-xs text-zinc-700 truncate">{f.owner || "—"}</div>
              <div className="col-span-3 flex gap-1 flex-wrap">
                {(f.tags || []).slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-sm">{t}</span>
                ))}
              </div>
              <div className="col-span-2 text-xs font-mono text-zinc-600">{(f.apis || []).length} endpoints</div>
              <div className="col-span-1 text-right text-[10px] font-mono text-zinc-400">
                {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : "—"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
