import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "guest";
  const name = user?.name || "User";
  const avatarSrc =
    role?.toLowerCase() === "admin"
      ? "/divya.jpeg"
      : role?.toLowerCase() === "teacher"
        ? user?.email === "akshayaa@bitsathy.ac.in"
          ? "/harita.jpeg"
          : "/mam.png"
        : role?.toLowerCase() === "driver"
          ? "/sabbudriver.jpeg"
        : "/kisore.png";

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const pending = sessionStorage.getItem("scrollToSectionId");
    if (!pending) return;

    sessionStorage.removeItem("scrollToSectionId");
    setTimeout(() => {
      const element = document.getElementById(pending);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [location.pathname]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const scrollToSection = (id, path) => {
    if (!id && path) {
      navigate(path);
      setIsOpen(false);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    } else if (path !== location.pathname) {
      // If we are on a different page (e.g. Profile), navigate home first then scroll?
      // For now, if ID exists but element doesn't (different page), just go to path
      if (id) sessionStorage.setItem("scrollToSectionId", id);
      navigate(path);
      setIsOpen(false);
    }
  };

  const currentRole = role?.toLowerCase() || "student";

  const leaveSummaryNav =
    currentRole === "admin"
      ? { path: "/admin/leaves", id: null }
      : currentRole === "teacher"
        ? { path: "/teacher/leaves", id: null }
        : currentRole === "student"
          ? { path: "/student/leaves", id: null }
          : currentRole === "driver"
            ? { path: "/driver", id: "leave-section" }
            : { path: `/${currentRole}`, id: "attendance-section" };

  const navLinks = [
    { name: "🏠 Home Dashboard", path: `/${currentRole}`, id: "top" },
    { name: "👤 My Profile", path: "/profile", id: null },
    { name: "📍 Live Bus Tracking", path: `/${currentRole}`, id: "map-section" },
    { name: "🚌 Route & Stops", path: `/${currentRole}`, id: "route-section" },
    { name: "📅 Attendance Records", ...leaveSummaryNav },
    { name: "🔔 All Notifications", path: `/${currentRole}`, id: "notification-section" },
    { name: "🗣️ Feedback", path: currentRole === "admin" ? "/admin/feedback" : `/${currentRole}`, id: currentRole === "admin" ? null : "feedback-panel" },
    { name: "🆘 Emergency Support", path: `/${currentRole}`, id: "support-section" },
  ];
  const notificationCount = 8;

  const openNotificationsFromNavbar = () => {
    window.dispatchEvent(new CustomEvent("akshuu:toggle-notifications"));
  };

  const openFeedbackFromNavbar = () => {
    if (currentRole === "admin") {
      navigate("/admin/feedback");
      return;
    }
    window.dispatchEvent(new CustomEvent("akshuu:toggle-feedback"));
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <button
              className="menu-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle Menu"
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>
            <h1 className="navbar-title">Akshuu</h1>
          </div>

          <div className="navbar-user">
            <button
              className="navbar-avatar-btn"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "2px solid white",
                padding: 0,
                overflow: "hidden",
                background: "white",
                cursor: "pointer"
              }}
            >
              <img
                src={avatarSrc}
                alt={`${name} profile`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
            <span className="navbar-role">{role}</span>
            <span className="desktop-only text-white" style={{ marginLeft: '10px' }}>Hello, {name}</span>
            <button
              className="navbar-notify-btn"
              onClick={openNotificationsFromNavbar}
              aria-label="Open notifications"
              title="Notifications"
              style={{ marginLeft: "6px" }}
            >
              <span className="navbar-notify-icon">🔔</span>
              <span className="navbar-notify-badge">{notificationCount}</span>
            </button>
            <button
              className="navbar-notify-btn"
              onClick={openFeedbackFromNavbar}
              aria-label="Open feedback"
              title="Feedback"
              style={{ marginLeft: "6px" }}
            >
              <span className="navbar-notify-icon">💬</span>
            </button>
            <button className="navbar-logout desktop-only" onClick={handleLogout} style={{ marginLeft: '15px' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => {
          setIsOpen(false);
        }}
        style={{ cursor: 'pointer', display: isOpen ? 'block' : 'none' }}
      ></div>

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header" style={{ position: 'relative' }}>
          <h2>Akshuu</h2>
          <p>{name} • {role}</p>
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '1.2rem',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">Navigation</div>
          {navLinks.slice(0, 3).map((link, idx) => (
            <div
              key={idx}
              className={`sidebar-link ${location.pathname === link.path && idx === 0 ? "active" : ""}`}
              style={{ cursor: 'pointer' }}
              onClick={() => scrollToSection(link.id, link.path)}
            >
              {link.name}
            </div>
          ))}

          <div className="sidebar-section">Profile & History</div>
          {navLinks.slice(3, 8).map((link, idx) => (
            <div
              key={idx + 3}
              className="sidebar-link"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (link.id === "feedback-panel") {
                  setIsOpen(false);
                  openFeedbackFromNavbar();
                  return;
                }
                scrollToSection(link.id, link.path);
              }}
            >
              {link.name}
            </div>
          ))}

          <div className="sidebar-section">App Settings</div>
          <div className="sidebar-link" style={{ justifyContent: 'space-between' }}>
            <span>🌓 {isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            <div
              onClick={toggleTheme}
              style={{
                width: '40px',
                height: '20px',
                background: isDarkMode ? 'var(--primary-color)' : '#cbd5e0',
                borderRadius: '20px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: isDarkMode ? '22px' : '2px',
                transition: 'all 0.3s'
              }} />
            </div>
          </div>

          <div className="sidebar-section">About</div>
          <Link to="/terms-privacy" className="sidebar-link" onClick={() => setIsOpen(false)}>
            📜 Terms & Privacy
          </Link>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
