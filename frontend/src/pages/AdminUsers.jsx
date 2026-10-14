import { UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";

const ROLES = ["viewer", "editor", "approver", "admin"];

const ROLE_COLOR = {
  viewer: "bg-zinc-100 text-zinc-600 border-zinc-200",
  editor: "bg-indigo-100 text-indigo-700 border-indigo-200",
  approver: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get("/users");
        setUsers(r.data);
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Failed to load users");
      }
      setLoading(false);
    })();
  }, []);

  const changeRole = async (userId, newRole) => {
    setSaving(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success("Role updated");
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to update role");
    }
    setSaving(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">Admin</p>
        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-zinc-900 dark:text-zinc-100">Users</h1>
        <p className="text-sm text-zinc-400 mt-1.5">Manage roles for TestHub members.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-2.5 text-[11px] font-mono uppercase tracking-widest text-indigo-400 dark:text-indigo-600 bg-indigo-50/50 dark:bg-zinc-800/50 border-b border-indigo-100 dark:border-zinc-800">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Last Login</div>
          <div className="col-span-2 text-right">Change Role</div>
        </div>

        {loading && <div className="p-8 text-center text-sm text-zinc-400">Loading…</div>}

        <div className="divide-y divide-indigo-50 dark:divide-zinc-800">
          {users.map((u) => (
            <div key={u.user_id} className="grid grid-cols-12 px-5 py-3.5 items-center">
              <div className="col-span-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-indigo-400 shrink-0">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{u.name || "—"}</span>
              </div>
              <div className="col-span-3 text-sm text-zinc-500 dark:text-zinc-400 truncate">{u.email}</div>
              <div className="col-span-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${ROLE_COLOR[u.role] || ROLE_COLOR.editor}`}>
                  {u.role}
                </span>
              </div>
              <div className="col-span-2 text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                {u.last_login_at
                  ? new Date(u.last_login_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : <span className="text-zinc-300 dark:text-zinc-600 italic">never</span>}
              </div>
              <div className="col-span-2 flex justify-end">
                <select
                  value={u.role}
                  disabled={saving === u.user_id}
                  onChange={(e) => changeRole(u.user_id, e.target.value)}
                  className="h-8 px-2 text-xs border border-indigo-100 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {!loading && users.length === 0 && (
          <div className="p-8 text-center">
            <UserCog className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
