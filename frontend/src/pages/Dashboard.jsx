import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { Library, Users, Tag, Plus, Upload, Sparkles, Activity } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [features, setFeatures] = useState([]);
  const { openChat } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [s, f] = await Promise.all([api.get("/stats"), api.get("/features")]);
        setStats(s.data);
        setFeatures(f.data.slice(0, 6));
      } catch (e) { console.error(e); }
    })();
  }, []);

  const statCards = [
    { label: "Features", value: stats?.total_features ?? "—", icon: Library, bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "Contributors", value: stats?.total_contributors ?? "—", icon: Users, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Tags", value: stats?.total_tags ?? "—", icon: Tag, bg: "bg-amber-50", text: "text-amber-600" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">Overview</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-zinc-900">Team Test Knowledge</h1>
          <p className="text-sm text-zinc-500 mt-2">Your team's central QA hub — test data, mocks, APIs, Redis, Mongo and experiments.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="dashboard-ask-agent"
            onClick={openChat}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-indigo-200 bg-white hover:bg-indigo-50 text-zinc-600 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" /> Ask the Agent
          </button>
          <button
            type="button"
            data-testid="dashboard-new-feature"
            onClick={() => navigate("/features/new")}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" /> New Feature
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-indigo-100 rounded-xl shadow-sm p-5" data-testid={`stat-${s.label.toLowerCase()}`}>
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.text}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-4xl font-heading font-black tracking-tight text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-black text-lg tracking-tight text-zinc-900">Recent features</h2>
            <Link to="/features" data-testid="view-all-features" className="text-xs text-indigo-600 hover:underline font-mono">view all →</Link>
          </div>
          <div className="bg-white border border-indigo-100 rounded-xl shadow-sm divide-y divide-indigo-50 overflow-hidden">
            {features.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-500 mb-4">No features yet. Add your first, or import a sheet.</p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    data-testid="empty-add-feature"
                    onClick={() => navigate("/features/new")}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />New Feature
                  </button>
                  <button
                    type="button"
                    data-testid="empty-import"
                    onClick={() => navigate("/import")}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-indigo-200 bg-white hover:bg-indigo-50 text-zinc-600 rounded-lg"
                  >
                    <Upload className="w-4 h-4" />Import CSV/Excel
                  </button>
                </div>
              </div>
            )}
            {features.map((f) => (
              <Link key={f.id} to={`/features/${f.id}`} className="block p-4 hover:bg-indigo-50/40 transition-colors" data-testid={`recent-feature-${f.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm mb-0.5 truncate text-zinc-800">{f.name}</h3>
                    <p className="text-xs text-zinc-400 truncate">{f.description || "No description"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(f.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading font-black text-lg tracking-tight mb-3 flex items-center gap-2 text-zinc-900">
            <Activity className="w-4 h-4 text-indigo-400" /> Activity
          </h2>
          <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-4 space-y-3">
            {(stats?.recent_activity || []).length === 0 && (
              <p className="text-xs text-zinc-400">No activity yet.</p>
            )}
            {(stats?.recent_activity || []).map((a) => (
              <div key={a.id} className="text-xs" data-testid={`activity-${a.id}`}>
                <span className="font-medium text-zinc-800">{a.user_name}</span>{" "}
                <span className="text-zinc-400">{a.action}</span>{" "}
                <span className="font-mono text-zinc-700">{a.feature_name}</span>
                <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{new Date(a.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
