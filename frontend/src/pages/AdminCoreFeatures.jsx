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

  useEffect(() => { load(); }, []);

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

  const inputCls = "w-full h-9 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2">Admin</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight">Core Features</h1>
          <p className="text-sm text-zinc-500 mt-1">Top-level groupings that every feature must belong to.</p>
        </div>
        {!adding && (
          <button
            type="button"
            data-testid="add-core-feature-btn"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-white border border-zinc-200 rounded-sm p-4 mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">New Core Feature</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Name *</label>
              <input
                data-testid="input-cf-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                className={inputCls}
                placeholder="e.g. Precancellation"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-zinc-500 block mb-1">Description</label>
              <input
                data-testid="input-cf-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className={inputCls}
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
              className="inline-flex items-center gap-1.5 h-8 px-3 text-sm bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); }}
              className="h-8 px-3 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-sm">
        <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
          <div className="col-span-4">Name</div>
          <div className="col-span-6">Description</div>
          <div className="col-span-2" />
        </div>

        {loading && <div className="p-8 text-center text-sm text-zinc-500">Loading…</div>}

        {!loading && coreFeatures.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">No core features yet. Add one above.</div>
        )}

        <div className="divide-y divide-zinc-100">
          {coreFeatures.map((cf) => (
            <div key={cf.id} className="grid grid-cols-12 px-4 py-3 items-center" data-testid={`cf-row-${cf.id}`}>
              {editId === cf.id ? (
                <>
                  <div className="col-span-4 pr-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(cf.id); if (e.key === "Escape") cancelEdit(); }}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div className="col-span-6 pr-2">
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className={inputCls}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-2 flex gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdate(cf.id)}
                      disabled={saving}
                      className="h-8 px-2 text-sm bg-black text-white rounded-sm hover:bg-zinc-800 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="h-8 px-2 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-4 font-medium text-sm truncate">{cf.name}</div>
                  <div className="col-span-6 text-xs text-zinc-500 truncate">{cf.description || "—"}</div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      data-testid={`edit-cf-${cf.id}`}
                      onClick={() => startEdit(cf)}
                      className="h-8 px-2 text-sm border border-zinc-200 rounded-sm hover:bg-zinc-50"
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
