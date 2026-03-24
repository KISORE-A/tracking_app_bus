import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Notifications from "./Notifications";
import {
  BellIcon,
  CalendarIcon,
  CloseIcon,
  FileIcon,
  HomeIcon,
  LocationPinIcon,
  LogoutIcon,
  MapIcon,
  MessageIcon,
  RouteIcon,
  ThemeIcon,
  UserIcon
} from "./Icons";

const iconWrap = { display: "inline-flex", alignItems: "center", gap: "0.6rem" };

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
          ? String(user?.email || "").toLowerCase() === "siva@driverbitsathy.ac.in"
            ? "/sabbudriver.jpeg?v=2"
            : "/tamil.jpeg"
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

    const doScroll = (targetId) => {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return true;
      }
      return false;
    };

    // Always close the sidebar first for a clean scroll.
    setIsOpen(false);

    if (doScroll(id)) {
      return;
    }

    if (path && path !== location.pathname) {
      if (id) sessionStorage.setItem("scrollToSectionId", id);
      navigate(path);
      return;
    }

    // Try again after the sidebar closes and layout settles.
    setTimeout(() => {
      doScroll(id);
    }, 50);
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

  const mapSectionId = currentRole === "admin" ? "central-map-view" : "map-section";
  const routeSectionId = currentRole === "admin" ? "central-map-view" : "route-section";

  const navLinks = [
    { name: "Home Dashboard", icon: <HomeIcon size={18} />, path: `/${currentRole}`, id: "top" },
    { name: "My Profile", icon: <UserIcon size={18} />, path: "/profile", id: null },
    { name: "Live Bus Tracking", icon: <LocationPinIcon size={18} />, path: `/${currentRole}`, id: mapSectionId },
    { name: "Route & Stops", icon: <MapIcon size={18} />, path: `/${currentRole}`, id: routeSectionId },
    { name: "Attendance Records", icon: <CalendarIcon size={18} />, ...leaveSummaryNav },
    { name: "All Notifications", icon: <BellIcon size={18} />, path: `/${currentRole}`, id: "notification-section" },
    { name: "Feedback", icon: <MessageIcon size={18} />, path: currentRole === "admin" ? "/admin/feedback" : `/${currentRole}`, id: currentRole === "admin" ? null : "feedback-panel" },
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
          </div>

          <div className="navbar-user">
            <button
              className="navbar-avatar-btn"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              <img
                src={avatarSrc}
                alt={`${name} profile`}
                className="navbar-avatar-image"
              />
            </button>
            <span className="navbar-role">{role}</span>
            <span className="desktop-only text-white navbar-user-greeting">Hello, {name}</span>
            <div className="navbar-action-cluster">
              <button
                className="navbar-notify-btn"
                onClick={openNotificationsFromNavbar}
                aria-label="Open notifications"
                title="Notifications"
              >
                <span className="navbar-notify-icon"><BellIcon size={18} /></span>
                <span className="navbar-notify-badge">{notificationCount}</span>
              </button>
              <button
                className="navbar-notify-btn"
                onClick={openFeedbackFromNavbar}
                aria-label="Open feedback"
                title="Feedback"
              >
                <span className="navbar-notify-icon"><MessageIcon size={18} /></span>
              </button>
            </div>
            <button className="navbar-logout desktop-only" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={() => {
          setIsOpen(false);
        }}
        style={{ cursor: "pointer", display: isOpen ? "block" : "none" }}
      ></div>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header" style={{ position: "relative" }}>
          <p>{name} • {role}</p>
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            style={{
              position: "absolute",
              top: "1.5rem",
              right: "1.5rem",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              fontSize: "1.2rem",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: "1.2rem",
                lineHeight: 1,
                display: "block",
                color: "white",
                fontWeight: 700
              }}
            >
              ×
            </span>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">Navigation</div>
          {navLinks.slice(0, 3).map((link, idx) => (
            <div
              key={idx}
              className={`sidebar-link ${location.pathname === link.path && idx === 0 ? "active" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => scrollToSection(link.id, link.path)}
            >
              <span style={iconWrap}>{link.icon}{link.name}</span>
            </div>
          ))}

          <div className="sidebar-section">Profile & History</div>
          {navLinks.slice(3, 8).map((link, idx) => (
            <div
              key={idx + 3}
              className="sidebar-link"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (link.id === "feedback-panel") {
                  setIsOpen(false);
                  openFeedbackFromNavbar();
                  return;
                }
                scrollToSection(link.id, link.path);
              }}
            >
              <span style={iconWrap}>{link.icon}{link.name}</span>
            </div>
          ))}

          <div className="sidebar-section">App Settings</div>
          <div className="sidebar-link" style={{ justifyContent: "space-between" }}>
            <span style={iconWrap}><ThemeIcon size={18} />{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            <div
              onClick={toggleTheme}
              style={{
                width: "40px",
                height: "20px",
                background: isDarkMode ? "var(--primary-color)" : "#cbd5e0",
                borderRadius: "20px",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.3s"
              }}
            >
              <div style={{
                width: "16px",
                height: "16px",
                background: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: isDarkMode ? "22px" : "2px",
                transition: "all 0.3s"
              }} />
            </div>
          </div>

          <div className="sidebar-section">About</div>
          <Link to="/terms-privacy" className="sidebar-link" onClick={() => setIsOpen(false)}>
            <span style={iconWrap}><FileIcon size={18} />Terms & Privacy</span>
          </Link>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span style={iconWrap}><LogoutIcon size={18} />Logout</span>
          </button>
        </div>
      </aside>

      <Notifications />
    </>
  );
}
