// biome-ignore assist/source/organizeImports: <explanation>
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Beaker, FlaskConical, LayoutDashboard, Library, LogOut, Settings, Sparkles, Upload, Zap } from "lucide-react";
import ChatAgent from "./ChatAgent";
import ThemeToggle from "./ThemeToggle";
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

  const navCls = ({ isActive }) =>
    `group flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out border-l-2 ${
      isActive
        ? "bg-slate-100/80 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 font-medium"
        : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 border-transparent"
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 transition-colors duration-200 ease-in-out">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col sticky top-0 h-screen overflow-y-auto z-10 transition-colors duration-200 ease-in-out">
        {/* Brand */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
            <div className="w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-xl shadow-sm shadow-indigo-200">
              <Beaker className="w-4 h-4" />
            </div>
            <span className="font-heading font-black text-base tracking-tight text-slate-900 dark:text-zinc-50">TestHub</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} data-testid={item.testid} className={navCls}>
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            data-testid="open-chat-button"
            onClick={() => setChatOpen(true)}
            className="group w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ease-in-out border-l-2 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 border-transparent"
          >
            <Sparkles className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors duration-200" />
            Ask the Agent
          </button>

          {user?.role !== "viewer" && (
            <NavLink to="/qa" data-testid="nav-qa-actions" className={navCls}>
              {({ isActive }) => (
                <>
                  <FlaskConical
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                    }`}
                  />
                  QA Actions
                </>
              )}
            </NavLink>
          )}

          {user?.role === "admin" && (
            <>
              <div className="px-3 pt-4 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-zinc-600">Admin</span>
              </div>
              <NavLink to="/admin/core-features" data-testid="nav-admin-core-features" className={navCls}>
                {({ isActive }) => (
                  <>
                    <Settings
                      className={`w-4 h-4 transition-colors duration-200 ${
                        isActive
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300"
                      }`}
                    />
                    Core Features
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>

        {/* Quick Add */}
        {user?.role !== "viewer" && (
          <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              data-testid="new-feature-button"
              type="button"
              onClick={() => navigate("/features/quick-add")}
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors duration-200 shadow-sm shadow-indigo-200"
            >
              <Zap className="w-4 h-4" /> Quick Add
            </button>
          </div>
        )}

        {/* Profile card */}
        {user && (
          <div className="p-3 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2.5 transition-colors duration-200">
            {/* Avatar */}
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/60 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-indigo-400 shrink-0">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>

            {/* Name / email / role */}
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold truncate text-slate-900 dark:text-zinc-100 leading-tight"
                data-testid="current-user-name"
              >
                {user.name}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate leading-tight mt-0.5">
                {user.email}
              </div>
              {user.role && (
                <span
                  className="inline-block text-[10px] font-mono px-1.5 py-0.5 mt-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700"
                  data-testid="user-role-badge"
                >
                  {user.role}
                </span>
              )}
            </div>

            {/* Theme toggle + Logout */}
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle />
              <button
                type="button"
                data-testid="logout-button"
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-slate-50/50 dark:bg-zinc-950 overflow-x-hidden overflow-y-auto transition-colors duration-200 ease-in-out">
        <Outlet context={{ openChat: () => setChatOpen(true) }} />
      </main>

      <ChatAgent open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
