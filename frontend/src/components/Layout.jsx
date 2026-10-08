// biome-ignore assist/source/organizeImports: <explanation>
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Beaker, FlaskConical, LayoutDashboard, Library, LogOut, Settings, Sparkles, Upload, Zap } from "lucide-react";
import ChatAgent from "./ChatAgent";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

const GEAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const BG_STYLE = { position: "fixed", left: 240, right: 0, top: 0, bottom: 0, zIndex: 0 };

function LightBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none overflow-hidden dark:hidden" style={BG_STYLE}>
      <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 1200 850" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E7EAF6" />
            <stop offset="55%" stopColor="#EDF0FA" />
            <stop offset="100%" stopColor="#EBF5EE" />
          </linearGradient>
        </defs>
        <rect width="1200" height="850" fill="url(#lBg)" />
        <circle cx="42" cy="42" r="132" fill="#D2D9F0" opacity="0.55" />
        <circle cx="24" cy="364" r="40" fill="#C8D2E8" opacity="0.42" />
        <circle cx="1222" cy="88" r="148" fill="#F5D490" opacity="0.52" />
        <circle cx="976" cy="175" r="102" fill="#B0E8CC" opacity="0.5" />
        <circle cx="80" cy="838" r="162" fill="#C8D2EE" opacity="0.5" />
        <circle cx="1174" cy="848" r="128" fill="#B0E8C5" opacity="0.5" />
        <circle cx="1224" cy="572" r="94" fill="#BCB5E0" opacity="0.42" />
        <path d="M 126 114 Q 216 72 336 108" fill="none" stroke="#A0ABCC" strokeWidth="1.8" strokeDasharray="5 4" opacity="0.75" />
        <g transform="translate(248, 80) rotate(-14)">
          <polygon points="0,16 40,7 0,-7" fill="none" stroke="#7B8ECC" strokeWidth="2.2" strokeLinejoin="round" />
          <polygon points="0,16 14,2 0,-7" fill="#C8CEEC" stroke="#7B8ECC" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="0" y1="4" x2="34" y2="7" stroke="#7B8ECC" strokeWidth="1" opacity="0.55" />
        </g>
        <g transform="translate(308, 74)" opacity="0.95">
          <line x1="0" y1="-7" x2="0" y2="7" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-5" y1="-5" x2="5" y2="5" stroke="#F5C035" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5" y1="-5" x2="-5" y2="5" stroke="#F5C035" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <g transform="translate(934, 40)">
          <rect x="0" y="18" width="92" height="120" rx="7" fill="white" stroke="#8090CC" strokeWidth="2" />
          <rect x="28" y="8" width="36" height="24" rx="5" fill="#8090CC" />
          <circle cx="46" cy="20" r="5" fill="white" />
          <polyline points="13,54 20,62 33,46" fill="none" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="40" y1="54" x2="78" y2="54" stroke="#D4D8EE" strokeWidth="2" />
          <polyline points="13,76 20,84 33,68" fill="none" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="40" y1="76" x2="78" y2="76" stroke="#D4D8EE" strokeWidth="2" />
          <polyline points="13,98 20,106 33,90" fill="none" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="40" y1="98" x2="78" y2="98" stroke="#D4D8EE" strokeWidth="2" />
        </g>
        <g transform="translate(1056, 46)">
          <circle cx="4" cy="36" r="8" fill="#5CB890" />
          <circle cx="74" cy="36" r="8" fill="#5CB890" />
          <ellipse cx="39" cy="36" rx="35" ry="32" fill="#6EC8A0" />
          <circle cx="28" cy="30" r="8" fill="white" />
          <circle cx="50" cy="30" r="8" fill="white" />
          <circle cx="29" cy="31" r="4" fill="#3D62A8" />
          <circle cx="51" cy="31" r="4" fill="#3D62A8" />
          <circle cx="30.5" cy="29.5" r="1.8" fill="white" />
          <circle cx="52.5" cy="29.5" r="1.8" fill="white" />
          <path d="M 24 43 Q 39 55 54 43" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="39" y1="4" x2="39" y2="-6" stroke="#5CB890" strokeWidth="3" />
          <circle cx="39" cy="-11" r="6" fill="#F5C035" />
          <line x1="70" y1="56" x2="100" y2="78" stroke="#6B8ACC" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="82" cy="58" r="22" fill="none" stroke="#6B8ACC" strokeWidth="3.5" />
          <circle cx="82" cy="58" r="14" fill="white" fillOpacity="0.22" />
        </g>
        <line x1="1140" y1="44" x2="1140" y2="57" stroke="#50C898" strokeWidth="2.8" strokeLinecap="round" opacity="0.9" />
        <line x1="1134" y1="50" x2="1146" y2="50" stroke="#50C898" strokeWidth="2.8" strokeLinecap="round" opacity="0.9" />
        <line x1="916" y1="66" x2="916" y2="80" stroke="#7B8ECC" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
        <line x1="933" y1="50" x2="933" y2="64" stroke="#50C898" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
        <g transform="translate(47, 692)">
          <rect x="0" y="0" width="122" height="97" rx="9" fill="none" stroke="#A0ABCC" strokeWidth="2.2" />
          <circle cx="18" cy="16" r="5" fill="#F07068" opacity="0.8" />
          <circle cx="36" cy="16" r="5" fill="#F5C038" opacity="0.8" />
          <circle cx="54" cy="16" r="5" fill="#5CC870" opacity="0.8" />
          <line x1="0" y1="30" x2="122" y2="30" stroke="#A0ABCC" strokeWidth="1.5" opacity="0.45" />
          <text x="61" y="73" textAnchor="middle" fontSize="26" fontFamily="monospace" fill="#A0ABCC" fontWeight="600">{"</>"}</text>
        </g>
        <g transform="translate(184, 738)">
          <circle cx="20" cy="20" r="12" fill="none" stroke="#BBC5D8" strokeWidth="2.8" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="#BBC5D8" strokeWidth="2.2" />
          {GEAR_ANGLES.map((a) => (
            <rect key={a} x="18" y="2" width="4" height="7" rx="1.5" fill="#BBC5D8" transform={`rotate(${a} 20 20)`} />
          ))}
        </g>
        <g transform="translate(178, 714)" opacity="0.92">
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
        </g>
        <line x1="202" y1="705" x2="209" y2="716" stroke="#F07068" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        <line x1="221" y1="730" x2="221" y2="742" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        <line x1="196" y1="748" x2="196" y2="758" stroke="#50C898" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <path d="M 838 813 Q 918 778 1024 798 Q 1092 812 1158 787" fill="none" stroke="#A0ABCC" strokeWidth="1.8" strokeDasharray="5 4" opacity="0.72" />
        <circle cx="985" cy="813" r="17" fill="#5B6CF9" />
        <polyline points="976,813 982,821 995,805" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(1190, 723)">
          <circle cx="18" cy="12" r="11" fill="none" stroke="#A0ABCC" strokeWidth="2.2" />
          <circle cx="13.5" cy="10" r="2.5" fill="#A0ABCC" />
          <circle cx="22.5" cy="10" r="2.5" fill="#A0ABCC" />
          <ellipse cx="18" cy="33" rx="13" ry="18" fill="none" stroke="#A0ABCC" strokeWidth="2.2" />
          <line x1="18" y1="15" x2="18" y2="51" stroke="#A0ABCC" strokeWidth="1.5" opacity="0.5" />
          <line x1="5" y1="24" x2="-8" y2="18" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="5" y1="32" x2="-8" y2="32" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="5" y1="40" x2="-8" y2="46" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="31" y1="24" x2="44" y2="18" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="31" y1="32" x2="44" y2="32" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="31" y1="40" x2="44" y2="46" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g opacity="0.88">
          <line x1="1237" y1="720" x2="1247" y2="710" stroke="#F5C035" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="1248" y1="726" x2="1262" y2="721" stroke="#F5C035" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="1248" y1="740" x2="1263" y2="740" stroke="#F5C035" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="1231" y1="716" x2="1231" y2="704" stroke="#F5C035" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

function DarkBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none overflow-hidden hidden dark:block" style={BG_STYLE}>
      <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 1200 850" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="dBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0c0a18" />
            <stop offset="55%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#050d0a" />
          </linearGradient>
          <radialGradient id="dGlow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#312e81" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dGlow3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#78350f" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="dGlow4" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="850" fill="url(#dBg)" />
        {/* Glowing orbs - dark tinted versions of the light blobs */}
        <ellipse cx="80" cy="80" rx="220" ry="200" fill="url(#dGlow1)" />
        <ellipse cx="1180" cy="120" rx="240" ry="220" fill="url(#dGlow3)" />
        <ellipse cx="1020" cy="200" rx="180" ry="160" fill="url(#dGlow2)" />
        <ellipse cx="100" cy="820" rx="240" ry="200" fill="url(#dGlow4)" />
        <ellipse cx="1160" cy="820" rx="200" ry="180" fill="url(#dGlow2)" />
        <ellipse cx="1200" cy="560" rx="160" ry="150" fill="url(#dGlow1)" />
        {/* Subtle grid lines */}
        <line x1="0" y1="425" x2="1200" y2="425" stroke="#27272a" strokeWidth="0.5" opacity="0.5" />
        <line x1="600" y1="0" x2="600" y2="850" stroke="#27272a" strokeWidth="0.5" opacity="0.5" />
        {/* Faint decorative strokes */}
        <path d="M 126 114 Q 216 72 336 108" fill="none" stroke="#3f3f46" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.5" />
        <path d="M 838 813 Q 918 778 1024 798 Q 1092 812 1158 787" fill="none" stroke="#3f3f46" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.45" />
        {/* Paper plane outline */}
        <g transform="translate(248, 80) rotate(-14)" opacity="0.35">
          <polygon points="0,16 40,7 0,-7" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinejoin="round" />
          <polygon points="0,16 14,2 0,-7" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round" />
        </g>
        {/* Star sparkle */}
        <g transform="translate(308, 74)" opacity="0.4">
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#a16207" strokeWidth="2" strokeLinecap="round" />
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#a16207" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Clipboard outline */}
        <g transform="translate(934, 40)" opacity="0.22">
          <rect x="0" y="18" width="92" height="120" rx="7" fill="none" stroke="#4f46e5" strokeWidth="1.5" />
          <rect x="28" y="8" width="36" height="24" rx="5" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.2" />
          <line x1="13" y1="54" x2="78" y2="54" stroke="#3f3f46" strokeWidth="1.5" />
          <line x1="13" y1="76" x2="78" y2="76" stroke="#3f3f46" strokeWidth="1.5" />
          <line x1="13" y1="98" x2="78" y2="98" stroke="#3f3f46" strokeWidth="1.5" />
        </g>
        {/* Robot head outline */}
        <g transform="translate(1056, 46)" opacity="0.25">
          <circle cx="4" cy="36" r="8" fill="#064e3b" />
          <circle cx="74" cy="36" r="8" fill="#064e3b" />
          <ellipse cx="39" cy="36" rx="35" ry="32" fill="#052e16" stroke="#10b981" strokeWidth="1.2" />
          <circle cx="28" cy="30" r="6" fill="#0f172a" />
          <circle cx="50" cy="30" r="6" fill="#0f172a" />
          <circle cx="29" cy="31" r="3" fill="#6366f1" />
          <circle cx="51" cy="31" r="3" fill="#6366f1" />
          <path d="M 24 43 Q 39 55 54 43" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <line x1="39" y1="4" x2="39" y2="-6" stroke="#064e3b" strokeWidth="2.5" />
          <circle cx="39" cy="-11" r="6" fill="#78350f" />
          <line x1="70" y1="56" x2="100" y2="78" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />
          <circle cx="82" cy="58" r="22" fill="none" stroke="#4338ca" strokeWidth="2.5" />
        </g>
        {/* Code window */}
        <g transform="translate(47, 692)" opacity="0.25">
          <rect x="0" y="0" width="122" height="97" rx="9" fill="none" stroke="#3f3f46" strokeWidth="1.8" />
          <circle cx="18" cy="16" r="5" fill="#7f1d1d" opacity="0.8" />
          <circle cx="36" cy="16" r="5" fill="#78350f" opacity="0.8" />
          <circle cx="54" cy="16" r="5" fill="#14532d" opacity="0.8" />
          <line x1="0" y1="30" x2="122" y2="30" stroke="#3f3f46" strokeWidth="1.2" opacity="0.6" />
          <text x="61" y="73" textAnchor="middle" fontSize="22" fontFamily="monospace" fill="#4f46e5" fontWeight="600">{"</>"}</text>
        </g>
        {/* Gear */}
        <g transform="translate(184, 738)" opacity="0.25">
          <circle cx="20" cy="20" r="12" fill="none" stroke="#3f3f46" strokeWidth="2.4" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="#3f3f46" strokeWidth="1.8" />
          {GEAR_ANGLES.map((a) => (
            <rect key={a} x="18" y="2" width="4" height="7" rx="1.5" fill="#3f3f46" transform={`rotate(${a} 20 20)`} />
          ))}
        </g>
        {/* Checkmark */}
        <circle cx="985" cy="813" r="17" fill="#1e1b4b" opacity="0.5" />
        <polyline points="976,813 982,821 995,805" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        {/* Accent sparks */}
        <g opacity="0.3">
          <line x1="1140" y1="44" x2="1140" y2="57" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="1134" y1="50" x2="1146" y2="50" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="916" y1="66" x2="916" y2="80" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="221" y1="730" x2="221" y2="742" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
          <line x1="196" y1="748" x2="196" y2="758" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

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
      <main className="flex-1 min-h-screen bg-slate-50/50 dark:bg-zinc-950 overflow-x-hidden overflow-y-auto transition-colors duration-200 ease-in-out relative">
        <LightBackground />
        <DarkBackground />
        <div className="relative z-[1]">
          <Outlet context={{ openChat: () => setChatOpen(true) }} />
        </div>
      </main>

      <ChatAgent open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
