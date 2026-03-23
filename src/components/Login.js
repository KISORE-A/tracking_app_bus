import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { loginUser } from "../services/api";

import "./Login.css";

const HERO_VARIANTS = ["zoom", "route", "beacon", "shimmer", "glitch", "ripple"];
const HERO_VARIANT_INTERVAL_MS = 5200;
const LOGIN_ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "driver", label: "Driver" },
  { value: "admin", label: "Admin" },
];

const getNextVariantIndex = (currentIndex) => {
  if (HERO_VARIANTS.length <= 1) return currentIndex;

  let nextIndex = currentIndex;
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * HERO_VARIANTS.length);
  }
  return nextIndex;
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(""); // Role selection
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (prefill?.role) {
      setSelectedRole(prefill.role);
      setEmail(prefill.email || "");
      setPassword(prefill.password || "");
    }
  }, [location.state]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return undefined;

    const intervalId = window.setInterval(() => {
      setHeroVariantIndex((currentIndex) => getNextVariantIndex(currentIndex));
    }, HERO_VARIANT_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      const userRole = data.user.role;

      if (userRole !== selectedRole) {
        setError(`Access Denied: You are not authorized as a ${selectedRole.toUpperCase()}. Please select the correct role.`);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (userRole === "student") navigate("/student");
      else if (userRole === "driver") navigate("/driver");
      else if (userRole === "admin") navigate("/admin");
      else if (userRole === "teacher") navigate("/teacher");
      else setError("Unknown role");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `linear-gradient(rgba(28, 18, 4, 0.2), rgba(28, 18, 4, 0.28)), url(${process.env.PUBLIC_URL || ""}/busbackground.png)`,
      }}
    >
      <div className="login-backdrop">
        <section className={`login-hero login-hero--${HERO_VARIANTS[heroVariantIndex]}`}>
          <div className="login-badge">My Bus Portal</div>
          <h1 className="login-hero-title">
            <span>WELCOME</span>
            <span>BACK</span>
          </h1>
          <p className="login-hero-copy">
            Sign in to manage routes, attendance, live bus tracking, and daily transport updates from one place.
          </p>
          <div className="login-hero-list">
            <div>Live Bus Tracking</div>
            <div>GPS Monitoring</div>
            <div>Instant Notifications</div>
            <div>Driver and Student Access</div>
          </div>
        </section>

        <div className="login-box">
          <h2 className="title">My Bus Portal</h2>
          <p className="subtitle">Safe • Smart • On Time</p>

          <form onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}

            {!selectedRole ? (
              <div className="form-group role-select-group">
                <label>Select Your Login Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                  className="role-select"
                >
                  <option value="" disabled>-- Choose your role --</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="role-picker-mobile" role="radiogroup" aria-label="Select your login role">
                  {LOGIN_ROLES.map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      className={`role-picker-option${selectedRole === roleOption.value ? " active" : ""}`}
                      onClick={() => setSelectedRole(roleOption.value)}
                      aria-pressed={selectedRole === roleOption.value}
                    >
                      <span className="role-picker-title">{roleOption.label}</span>
                      <span className="role-picker-copy">Continue as {roleOption.label.toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="selected-role-header">
                <p>Logging in as <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedRole}</span></p>
                <button
                  type="button"
                  onClick={() => { setSelectedRole(""); setEmail(""); setPassword(""); }}
                  className="change-role-btn"
                >
                  Change Role
                </button>
              </div>
            )}

            <div className={`login-fields ${selectedRole ? 'visible' : ''}`}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!!selectedRole}
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!!selectedRole}
              />

              <button type="submit" disabled={loading || !selectedRole}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="footer">
            <Link to="/terms-privacy" style={{ color: '#666', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer' }}>Terms & Privacy Policy</Link>
          </p>
          <p className="footer">© 2026 Akshuu Transports</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
