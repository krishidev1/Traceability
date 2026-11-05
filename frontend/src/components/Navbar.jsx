import { useEffect, useRef, useState } from "react";
import {
  FiBarChart2,
  FiCamera,
  FiChevronDown,
  FiHome,
  FiLogOut,
  FiShield,
  FiUser,
  FiVideo,
  FiUserPlus,
} from "react-icons/fi";
import "../styles/Navbar.css";

export default function Navbar({
  user,
  route,
  navigate,
  signOut,
  logoSrc,
  hasProcessImages,
  hasTraceCapture,
  toast,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const links =
    user.role === "admin"
    ? [{ label: "Admin review", path: "/admin", icon: <FiShield /> }]
    : user.role === "grower"
    ? [
        { label: "Dashboard", path: "/grower", icon: <FiHome /> },
        { label: "Reports", path: "/reports", icon: <FiBarChart2 /> },
        ]
      : [
          { label: "Dashboard", path: "/supplier", icon: <FiHome /> },
          { label: "Reports", path: "/reports", icon: <FiBarChart2 /> },
        ];
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => navigate("/")}>
        <span className="brand-icon">
          <img src={logoSrc} alt="TraceConnect Logo" />
        </span>
        <span className="brand-copy">
          <span className="brand-text">Traceconnect</span>
        </span>
      </button>
      <nav className="header-nav">
        <span className="header-links">
          {links.map((link) => (
            <button
              key={link.path}
              type="button"
              className={`nav-pill ${route === link.path ? "active" : ""}`}
              onClick={() => navigate(link.path)}
            >
              {link.icon} {link.label}
            </button>
          ))}
        </span>
        <span className="header-actions">
        {user.role !== "admin" && <button
          className="verify-nav-button"
          type="button"
          title="Verification tools coming soon"
          aria-label="Verify - coming soon"
        >
          <span className="verify-nav-icon">
            <FiShield />
          </span>
          <span>Verify</span>
          <span className="verify-nav-badge">Soon</span>
        </button>}
        {user.role === "admin" ? <button
          className="profile-item admin-header-logout"
          type="button"
          onClick={() => { signOut(); navigate("/"); }}
        >
          <FiLogOut /> Logout
        </button> : <div className="profile-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className={`profile-trigger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle profile details"
            aria-expanded={menuOpen}
            aria-controls="navbar-profile-menu"
          >
            <span className="profile-avatar">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" />
              ) : (
                <FiUser />
              )}
            </span>
            <span className="profile-name">{user.name}</span>
            <FiChevronDown className="profile-chevron" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              className="profile-dropdown"
              id="navbar-profile-menu"
              role="region"
              aria-label="Profile details"
            >
              <div className="dropdown-user-info">
                <span className="dropdown-user-copy">
                  <span className="dropdown-name">{user.name}</span>
                  {user.email && (
                    <span className="dropdown-email">{user.email}</span>
                  )}
                </span>
              </div>
              <div className="dropdown-divider" />
              <button
                className="profile-item"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
              >
                <FiUser /> My Profile
              </button>
              <button
                className="profile-item"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(user.role === "supplier" ? "/supplier" : "/grower");
                }}
              >
                <FiHome /> Dashboard
              </button>
              {user.role === "grower" && (
                <button
                  className="profile-item"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (!hasProcessImages) {
                      toast("No images captured yet.", "error");
                      return;
                    }
                    navigate("/process-gallery");
                  }}
                >
                  <FiCamera /> Process Gallery
                </button>
              )}
              <button
                className="profile-item"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (!hasTraceCapture) {
                    toast("No trace captures generated yet.", "error");
                    return;
                  }
                  navigate("/trace-captures");
                }}
              >
                <FiVideo /> Trace Captures
              </button>
              <button
                className="profile-item danger"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                  navigate("/");
                }}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>}
        </span>
      </nav>
    </header>
  );
}

export function PublicNavbar({ onLogin, onSignup, logoSrc }) {
  return (
    <header className="app-header public-app-header">
      <button
        className="brand"
        type="button"
        onClick={() => {
          window.location.hash = "/";
        }}
      >
        <span className="brand-icon">
          <img src={logoSrc} alt="TraceConnect Logo" />
        </span>
        <span className="brand-copy">
          <span className="brand-text">TraceConnect</span>
        </span>
      </button>
      <nav className="header-nav auth-nav" aria-label="Authentication">
        <button className="nav-pill auth-nav-button" onClick={onLogin} type="button">
          <FiUser aria-hidden="true" />
          Login
        </button>
        <button className="nav-pill active auth-nav-button" onClick={onSignup} type="button">
          <FiUserPlus aria-hidden="true" />
          Signup
        </button>
      </nav>
    </header>
  );
}
