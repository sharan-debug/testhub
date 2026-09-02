import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Beaker, LayoutDashboard, Library, Upload, LogOut, Sparkles, Plus } from "lucide-react";
import ChatAgent from "./ChatAgent";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", end: true },
    { to: "/features", label: "Features", icon: Library, testid: "nav-features" },
    { to: "/import", label: "Import", icon: Upload, testid: "nav-import" },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-60 shrink-0 bg-white border-r border-zinc-200 flex flex-col">
        <div className="p-5 border-b border-zinc-200">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-sm">
              <Beaker className="w-4 h-4" />
            </div>
            <span className="font-heading font-black text-base tracking-tight">TestHub</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors border-l-2 ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 border-blue-600 font-medium"
                    : "text-zinc-600 hover:bg-zinc-50 border-transparent"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}

          <button
            data-testid="open-chat-button"
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors border-l-2 text-zinc-600 hover:bg-zinc-50 border-transparent"
          >
            <Sparkles className="w-4 h-4" />
            Ask the Agent
          </button>
        </nav>

        {user?.role !== "viewer" && (
          <div className="p-3 border-t border-zinc-200">
            <button
              data-testid="new-feature-button"
              type="button"
              onClick={() => navigate("/features/new")}
              className="w-full h-9 bg-black hover:bg-zinc-800 text-white rounded-sm text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Feature
            </button>
          </div>
        )}

        {user && (
          <div className="p-3 border-t border-zinc-200 flex items-center gap-2">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-sm font-medium">
                {user.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" data-testid="current-user-name">{user.name}</div>
              <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
              {user.role && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 mt-0.5 rounded-sm bg-zinc-100 text-zinc-600" data-testid="user-role-badge">
                  {user.role}
                </span>
              )}
            </div>
            <button
              data-testid="logout-button"
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-sm hover:bg-zinc-100"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet context={{ openChat: () => setChatOpen(true) }} />
      </main>

      <ChatAgent open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
