import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminCoreFeatures() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coreFeatures, setCoreFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/core-features");
      setCoreFeatures(r.data);
    } catch {
      toast.error("Failed to load core features");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await api.post("/core-features", { name: newName.trim(), description: newDesc.trim() });
      toast.success("Core feature added");
      setNewName("");
      setNewDesc("");
      setAdding(false);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail?.error?.message || "Failed to add");
    }
    setSaving(false);
  };

  const startEdit = (cf) => {
    setEditId(cf.id);
    setEditName(cf.name);
    setEditDesc(cf.description || "");
  };

  const cancelEdit = () => { setEditId(null); setEditName(""); setEditDesc(""); };

  const handleUpdate = async (id) => {
    if (!editName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await api.put(`/core-features/${id}`, { name: editName.trim(), description: editDesc.trim() });
      toast.success("Updated");
      cancelEdit();
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail?.error?.message || "Failed to update");
    }
    setSaving(false);
  };

  const inp = "w-full h-9 px-3 text-sm border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">Admin</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-zinc-900">Core Features</h1>
          <p className="text-sm text-zinc-400 mt-1">Top-level groupings that every feature must belong to.</p>
        </div>
        {!adding && (
          <button
            type="button"
            data-testid="add-core-feature-btn"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-4 mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-3">New Core Feature</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="cf-name" className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Name *</label>
              <input
                id="cf-name"
                data-testid="input-cf-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                className={inp}
                placeholder="e.g. Precancellation"
              />
            </div>
            <div>
              <label htmlFor="cf-desc" className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1.5">Description</label>
              <input
                id="cf-desc"
                data-testid="input-cf-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className={inp}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="save-cf-btn"
              onClick={handleAdd}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); }}
              className="h-8 px-3 text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50 text-zinc-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-indigo-100 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-50/50 border-b border-indigo-100">
          <div className="col-span-4">Name</div>
          <div className="col-span-6">Description</div>
          <div className="col-span-2" />
        </div>

        {loading && <div className="p-8 text-center text-sm text-zinc-400">Loading…</div>}

        {!loading && coreFeatures.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-400">No core features yet. Add one above.</div>
        )}

        <div className="divide-y divide-indigo-50">
          {coreFeatures.map((cf) => (
            <div key={cf.id} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-indigo-50/30 transition-colors" data-testid={`cf-row-${cf.id}`}>
              {editId === cf.id ? (
                <>
                  <div className="col-span-4 pr-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(cf.id); if (e.key === "Escape") cancelEdit(); }}
                      className={inp}
                      autoFocus
                    />
                  </div>
                  <div className="col-span-6 pr-2">
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className={inp}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2 flex gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdate(cf.id)}
                      disabled={saving}
                      className="h-8 px-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="h-8 px-2 text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50 text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-4 font-medium text-sm truncate text-zinc-800">{cf.name}</div>
                  <div className="col-span-6 text-xs text-zinc-400 truncate">{cf.description || "—"}</div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      data-testid={`edit-cf-${cf.id}`}
                      onClick={() => startEdit(cf)}
                      className="h-8 px-2 text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50 text-zinc-600"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
