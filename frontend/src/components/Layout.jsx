import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Beaker, FlaskConical, LayoutDashboard, Library, LogOut, Settings, Sparkles, Upload, Zap } from "lucide-react";
import ChatAgent from "./ChatAgent";
import { useState } from "react";

const GEAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function MainBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none overflow-hidden"
      style={{ position: "fixed", left: 240, right: 0, top: 0, bottom: 0, zIndex: 0 }}
    >
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox="0 0 1200 850"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mainBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E7EAF6" />
            <stop offset="55%" stopColor="#EDF0FA" />
            <stop offset="100%" stopColor="#EBF5EE" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="1200" height="850" fill="url(#mainBg)" />

        {/* ── Blob shapes ── */}
        {/* Top-left */}
        <circle cx="42" cy="42" r="132" fill="#D2D9F0" opacity="0.55" />
        {/* Left-middle small */}
        <circle cx="24" cy="364" r="40" fill="#C8D2E8" opacity="0.42" />
        {/* Top-right yellow (corner) */}
        <circle cx="1222" cy="88" r="148" fill="#F5D490" opacity="0.52" />
        {/* Top-right green */}
        <circle cx="976" cy="175" r="102" fill="#B0E8CC" opacity="0.5" />
        {/* Bottom-left large */}
        <circle cx="80" cy="838" r="162" fill="#C8D2EE" opacity="0.5" />
        {/* Bottom-right green */}
        <circle cx="1174" cy="848" r="128" fill="#B0E8C5" opacity="0.5" />
        {/* Right-side purple */}
        <circle cx="1224" cy="572" r="94" fill="#BCB5E0" opacity="0.42" />

        {/* ── Paper airplane trail (top-left) ── */}
        <path
          d="M 126 114 Q 216 72 336 108"
          fill="none"
          stroke="#A0ABCC"
          strokeWidth="1.8"
          strokeDasharray="5 4"
          opacity="0.75"
        />

        {/* Paper airplane at ~(250, 82) */}
        <g transform="translate(248, 80) rotate(-14)">
          {/* Outer wing */}
          <polygon
            points="0,16 40,7 0,-7"
            fill="none"
            stroke="#7B8ECC"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Inner fold */}
          <polygon
            points="0,16 14,2 0,-7"
            fill="#C8CEEC"
            stroke="#7B8ECC"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Crease */}
          <line x1="0" y1="4" x2="34" y2="7" stroke="#7B8ECC" strokeWidth="1" opacity="0.55" />
        </g>

        {/* Yellow star sparkle near plane */}
        <g transform="translate(308, 74)" opacity="0.95">
          <line x1="0" y1="-7" x2="0" y2="7" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-7" y1="0" x2="7" y2="0" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-5" y1="-5" x2="5" y2="5" stroke="#F5C035" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5" y1="-5" x2="-5" y2="5" stroke="#F5C035" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* ── Clipboard (top-right, x≈936) ── */}
        <g transform="translate(934, 40)">
          {/* Board */}
          <rect x="0" y="18" width="92" height="120" rx="7" fill="white" stroke="#8090CC" strokeWidth="2" />
          {/* Clip tab */}
          <rect x="28" y="8" width="36" height="24" rx="5" fill="#8090CC" />
          <circle cx="46" cy="20" r="5" fill="white" />
          {/* Row 1 */}
          <polyline points="13,54 20,62 33,46" fill="none" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="40" y1="54" x2="78" y2="54" stroke="#D4D8EE" strokeWidth="2" />
          {/* Row 2 */}
          <polyline points="13,76 20,84 33,68" fill="none" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="40" y1="76" x2="78" y2="76" stroke="#D4D8EE" strokeWidth="2" />
          {/* Row 3 */}
          <polyline points="13,98 20,106 33,90" fill="none" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="40" y1="98" x2="78" y2="98" stroke="#D4D8EE" strokeWidth="2" />
        </g>

        {/* ── Robot head (top-right, x≈1056) ── */}
        <g transform="translate(1056, 46)">
          {/* Ear blobs */}
          <circle cx="4" cy="36" r="8" fill="#5CB890" />
          <circle cx="74" cy="36" r="8" fill="#5CB890" />
          {/* Head */}
          <ellipse cx="39" cy="36" rx="35" ry="32" fill="#6EC8A0" />
          {/* Eyes white */}
          <circle cx="28" cy="30" r="8" fill="white" />
          <circle cx="50" cy="30" r="8" fill="white" />
          {/* Pupils */}
          <circle cx="29" cy="31" r="4" fill="#3D62A8" />
          <circle cx="51" cy="31" r="4" fill="#3D62A8" />
          {/* Eye shine */}
          <circle cx="30.5" cy="29.5" r="1.8" fill="white" />
          <circle cx="52.5" cy="29.5" r="1.8" fill="white" />
          {/* Smile */}
          <path d="M 24 43 Q 39 55 54 43" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
          {/* Antenna */}
          <line x1="39" y1="4" x2="39" y2="-6" stroke="#5CB890" strokeWidth="3" />
          <circle cx="39" cy="-11" r="6" fill="#F5C035" />
          {/* Magnifying glass handle */}
          <line x1="70" y1="56" x2="100" y2="78" stroke="#6B8ACC" strokeWidth="4.5" strokeLinecap="round" />
          {/* Magnifying glass ring */}
          <circle cx="82" cy="58" r="22" fill="none" stroke="#6B8ACC" strokeWidth="3.5" />
          {/* Glass inner highlight */}
          <circle cx="82" cy="58" r="14" fill="white" fillOpacity="0.22" />
        </g>

        {/* Sparkles near robot */}
        {/* Top-right green cross */}
        <line x1="1140" y1="44" x2="1140" y2="57" stroke="#50C898" strokeWidth="2.8" strokeLinecap="round" opacity="0.9" />
        <line x1="1134" y1="50" x2="1146" y2="50" stroke="#50C898" strokeWidth="2.8" strokeLinecap="round" opacity="0.9" />
        {/* Left-of-clipboard indigo/green bars */}
        <line x1="916" y1="66" x2="916" y2="80" stroke="#7B8ECC" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
        <line x1="933" y1="50" x2="933" y2="64" stroke="#50C898" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />

        {/* ── Code window (bottom-left, x≈47, y≈692) ── */}
        <g transform="translate(47, 692)">
          {/* Frame */}
          <rect x="0" y="0" width="122" height="97" rx="9" fill="none" stroke="#A0ABCC" strokeWidth="2.2" />
          {/* Traffic lights */}
          <circle cx="18" cy="16" r="5" fill="#F07068" opacity="0.8" />
          <circle cx="36" cy="16" r="5" fill="#F5C038" opacity="0.8" />
          <circle cx="54" cy="16" r="5" fill="#5CC870" opacity="0.8" />
          {/* Separator */}
          <line x1="0" y1="30" x2="122" y2="30" stroke="#A0ABCC" strokeWidth="1.5" opacity="0.45" />
          {/* Code symbol */}
          <text
            x="61" y="73"
            textAnchor="middle"
            fontSize="26"
            fontFamily="monospace"
            fill="#A0ABCC"
            fontWeight="600"
          >
            {"</>"}
          </text>
        </g>

        {/* ── Gear (bottom-left, x≈184, y≈738) ── */}
        <g transform="translate(184, 738)">
          <circle cx="20" cy="20" r="12" fill="none" stroke="#BBC5D8" strokeWidth="2.8" />
          <circle cx="20" cy="20" r="5" fill="none" stroke="#BBC5D8" strokeWidth="2.2" />
          {GEAR_ANGLES.map((a) => (
            <rect
              key={a}
              x="18"
              y="2"
              width="4"
              height="7"
              rx="1.5"
              fill="#BBC5D8"
              transform={`rotate(${a} 20 20)`}
            />
          ))}
        </g>

        {/* Sparkles near code window */}
        {/* Yellow cross */}
        <g transform="translate(178, 714)" opacity="0.92">
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#F5C035" strokeWidth="2.8" strokeLinecap="round" />
        </g>
        {/* Red diagonal */}
        <line x1="202" y1="705" x2="209" y2="716" stroke="#F07068" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        {/* Indigo bar */}
        <line x1="221" y1="730" x2="221" y2="742" stroke="#8090CC" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        {/* Green bar */}
        <line x1="196" y1="748" x2="196" y2="758" stroke="#50C898" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />

        {/* ── Dashed trail (bottom, bug → checkmark) ── */}
        <path
          d="M 838 813 Q 918 778 1024 798 Q 1092 812 1158 787"
          fill="none"
          stroke="#A0ABCC"
          strokeWidth="1.8"
          strokeDasharray="5 4"
          opacity="0.72"
        />

        {/* ── Checkmark circle (bottom center-right) ── */}
        <circle cx="985" cy="813" r="17" fill="#5B6CF9" />
        <polyline
          points="976,813 982,821 995,805"
          fill="none"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ── Bug (bottom-right, x≈1190, y≈724) ── */}
        <g transform="translate(1190, 723)">
          {/* Head */}
          <circle cx="18" cy="12" r="11" fill="none" stroke="#A0ABCC" strokeWidth="2.2" />
          {/* Eyes */}
          <circle cx="13.5" cy="10" r="2.5" fill="#A0ABCC" />
          <circle cx="22.5" cy="10" r="2.5" fill="#A0ABCC" />
          {/* Body */}
          <ellipse cx="18" cy="33" rx="13" ry="18" fill="none" stroke="#A0ABCC" strokeWidth="2.2" />
          {/* Wing split */}
          <line x1="18" y1="15" x2="18" y2="51" stroke="#A0ABCC" strokeWidth="1.5" opacity="0.5" />
          {/* Left legs */}
          <line x1="5" y1="24" x2="-8" y2="18" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="5" y1="32" x2="-8" y2="32" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="5" y1="40" x2="-8" y2="46" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          {/* Right legs */}
          <line x1="31" y1="24" x2="44" y2="18" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="31" y1="32" x2="44" y2="32" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="31" y1="40" x2="44" y2="46" stroke="#A0ABCC" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Bug sparkle rays */}
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
    `flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors border-l-2 ${
      isActive
        ? "bg-indigo-50 text-indigo-700 border-indigo-500 font-medium"
        : "text-zinc-500 hover:bg-indigo-50/50 hover:text-zinc-700 border-transparent"
    }`;

  return (
    <div className="min-h-screen flex" style={{ background: "#E7EAF6" }}>
      {/* Sidebar — sits on top of background */}
      <aside
        className="w-60 shrink-0 bg-white border-r border-indigo-100 flex flex-col"
        style={{ position: "relative", zIndex: 10 }}
      >
        <div className="p-5 border-b border-indigo-100">
          <Link to="/" className="flex items-center gap-2" data-testid="brand-link">
            <div className="w-8 h-8 bg-indigo-600 text-white flex items-center justify-center rounded-xl shadow-sm shadow-indigo-200">
              <Beaker className="w-4 h-4" />
            </div>
            <span className="font-heading font-black text-base tracking-tight text-zinc-900">TestHub</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} data-testid={item.testid} className={navCls}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}

          <button
            type="button"
            data-testid="open-chat-button"
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors border-l-2 text-zinc-500 hover:bg-indigo-50/50 hover:text-zinc-700 border-transparent"
          >
            <Sparkles className="w-4 h-4" />
            Ask the Agent
          </button>

          {user?.role !== "viewer" && (
            <NavLink to="/qa" data-testid="nav-qa-actions" className={navCls}>
              <FlaskConical className="w-4 h-4" />
              QA Actions
            </NavLink>
          )}

          {user?.role === "admin" && (
            <>
              <div className="px-3 pt-4 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300">Admin</span>
              </div>
              <NavLink to="/admin/core-features" data-testid="nav-admin-core-features" className={navCls}>
                <Settings className="w-4 h-4" />
                Core Features
              </NavLink>
            </>
          )}
        </nav>

        {user?.role !== "viewer" && (
          <div className="p-3 border-t border-indigo-100">
            <button
              data-testid="new-feature-button"
              type="button"
              onClick={() => navigate("/features/quick-add")}
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-indigo-200"
            >
              <Zap className="w-4 h-4" /> Quick Add
            </button>
          </div>
        )}

        {user && (
          <div className="p-3 border-t border-indigo-100 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-700">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate text-zinc-800" data-testid="current-user-name">{user.name}</div>
              <div className="text-[11px] text-zinc-400 truncate">{user.email}</div>
              {user.role && (
                <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 mt-0.5 rounded-full bg-indigo-100 text-indigo-600" data-testid="user-role-badge">
                  {user.role}
                </span>
              )}
            </div>
            <button
              type="button"
              data-testid="logout-button"
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-indigo-50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main content — background layer + page content */}
      <main className="flex-1 min-w-0 overflow-x-hidden relative">
        <MainBackground />
        <div className="relative" style={{ zIndex: 1 }}>
          <Outlet context={{ openChat: () => setChatOpen(true) }} />
        </div>
      </main>

      <ChatAgent open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
