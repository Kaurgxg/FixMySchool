import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../api/axios";

const USER_LINKS = [
  { to: "/dashboard",     label: "Overview",     icon: "◉" },
  { to: "/issues/new",    label: "Report",        icon: "+" },
  { to: "/issues",        label: "My Reports",    icon: "≡" },
  { to: "/notifications", label: "Alerts",        icon: "🔔" },
];

const ADMIN_LINKS = [
  { to: "/admin",         label: "Admin Dashboard", icon: "⚙" },
  { to: "/issues",        label: "All Issues",      icon: "≡" },
  { to: "/notifications", label: "Alerts",          icon: "🔔" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get("/notifications").then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const links = user.role === "admin" ? ADMIN_LINKS : USER_LINKS;

  function handleLogout() { logout(); navigate("/login"); }

  const pillClass = (isActive) =>
    `nav-pill ${isActive ? "active" : ""}`;

  const homeRoute = user.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header style={{ background: "#1C0D04", position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid rgba(200,160,12,.15)" }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between" style={{ height: 58, gap: 12 }}>

        {/* Brand */}
        <Link to={homeRoute} className="flex items-center gap-2 shrink-0" style={{ textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#C8960C", display: "flex", alignItems: "center", justifyContent: "center", color: "#1C0D04", fontWeight: 800, fontSize: 14 }}>F</div>
          <span className="hidden sm:block" style={{ color: "#E8B830", fontWeight: 700, fontSize: 15, letterSpacing: "-.01em" }}>FixMySchool</span>
        </Link>

        {/* Desktop pill tabs */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 justify-center">
          {links.map(({ to, label, icon }) => {
            const active = window.location.pathname === to || (to !== "/dashboard" && window.location.pathname.startsWith(to) && to !== "/issues/new");
            return (
              <NavLink key={to} to={to} className={({ isActive }) => pillClass(isActive || active)}>
                <span style={{ fontSize: ".75rem" }}>{icon}</span>
                {label}
                {to === "/notifications" && unread > 0 && (
                  <span style={{ background: "#E05252", color: "#fff", borderRadius: "999px", fontSize: ".6rem", fontWeight: 700, padding: "1px 5px", marginLeft: 2 }}>{unread}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Right: user info + logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block text-right">
            <p style={{ color: "#F2E5C4", fontSize: ".75rem", fontWeight: 600, lineHeight: 1.1 }}>{user.name.split(" ")[0]}</p>
            <p style={{ color: "#9B7A40", fontSize: ".62rem", textTransform: "capitalize", lineHeight: 1.1, marginTop: 2 }}>{user.role}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost-wood" style={{ fontSize: ".75rem", padding: "5px 14px" }}>Sign out</button>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen(m => !m)}
            style={{ color: "#E8B830", background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className="md:hidden" style={{ background: "#1C0D04", borderTop: "1px solid rgba(200,160,12,.12)", padding: "8px 16px 12px" }}>
          <div className="flex flex-wrap gap-2">
            {links.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => pillClass(isActive)} onClick={() => setMenuOpen(false)}>
                <span style={{ fontSize: ".75rem" }}>{icon}</span>{label}
                {to === "/notifications" && unread > 0 && (
                  <span style={{ background: "#E05252", color: "#fff", borderRadius: "999px", fontSize: ".58rem", fontWeight: 700, padding: "1px 5px" }}>{unread}</span>
                )}
              </NavLink>
            ))}
          </div>
          <p style={{ color: "#9B7A40", fontSize: ".72rem", marginTop: 10 }}>Signed in as <strong style={{ color: "#E8B830" }}>{user.name}</strong> · {user.role}</p>
        </div>
      )}

      {/* Subtle bottom divider */}
      <div style={{ height: 1, background: "rgba(200,160,12,.08)" }} />
    </header>
  );
}
