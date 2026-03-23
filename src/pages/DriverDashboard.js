import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; import Navigation from "../components/Navigation";
import BusInfo from "../components/BusInfo";
import RouteInfo from "../components/RouteInfo";
import DriverInfo from "../components/DriverInfo";
import MapSection from "../components/MapSection";
import WeatherInfo from "../components/WeatherInfo";
import FeedbackPanel from "../components/FeedbackPanel";
import { createLeaveRequest, getLeaveRequests, getBuses, updateLocation } from "../services/api"; export default function DriverDashboard() { const navigate = useNavigate(); const geoWatchIdRef = useRef(null); const lastSentAtMsRef = useRef(0); const [leaveForm, setLeaveForm] = useState({ reason: "", fromDate: "", toDate: "", fromTime: "", toTime: "" }); const [leaves, setLeaves] = useState([]); const [leaveLoading, setLeaveLoading] = useState(true); const [leaveError, setLeaveError] = useState(""); const [leaveSubmitting, setLeaveSubmitting] = useState(false); const [assignedBus, setAssignedBus] = useState(null); const [busLoading, setBusLoading] = useState(true); const [tracking, setTracking] = useState({ active: false, sending: false, error: "", coords: null, accuracy: null, lastSentAt: null }); useEffect(() =>{
  const userStr = localStorage.getItem("user");
  const role = userStr ? JSON.parse(userStr).role : null;
  if (role !== "driver" && role !== "admin") {
    // navigate("/");
    // Commented out for easier testing if role is different
  }
}, [navigate]); const fetchLeaves = useCallback(async () =>{ setLeaveError(""); setLeaveLoading(true); try { const data = await getLeaveRequests(); setLeaves(Array.isArray(data) ? data : []); } catch (err) { setLeaveError(err?.message || "Failed to load leave records"); } finally { setLeaveLoading(false); } }, []); useEffect(() =>{ fetchLeaves(); }, [fetchLeaves]); useEffect(() =>{ let isMounted = true; const loadBus = async () =>{ setBusLoading(true); try { const userStr = localStorage.getItem("user"); const parsed = userStr ? JSON.parse(userStr) : {}; const userId = parsed?._id || parsed?.id; const buses = await getBuses(); const bus = Array.isArray(buses) ? buses.find((b) =>String(b.driverId || "") === String(userId || "")) : null; if (!isMounted) return; setAssignedBus(bus || null); } catch (e) { if (!isMounted) return; setAssignedBus(null); } finally { if (isMounted) setBusLoading(false); } }; loadBus(); return () =>{ isMounted = false; }; }, []); const submitLeave = async (e) =>{ e.preventDefault(); setLeaveSubmitting(true); setLeaveError(""); try { await createLeaveRequest(leaveForm); setLeaveForm({ reason: "", fromDate: "", toDate: "", fromTime: "", toTime: "" }); fetchLeaves(); } catch (err) { setLeaveError(err?.message || "Failed to submit leave"); } finally { setLeaveSubmitting(false); } }; const stopTracking = useCallback(() =>{ if (geoWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) { navigator.geolocation.clearWatch(geoWatchIdRef.current); } geoWatchIdRef.current = null; setTracking((prev) =>({ ...prev, active: false })); }, []); const startTracking = useCallback(() =>{
  setTracking((prev) =>({ ...prev, error: "" }));
  if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
    setTracking((prev) =>({ ...prev, error: "GPS requires HTTPS (or localhost). Open the site over HTTPS to enable location." }));
    return;
  }
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setTracking((prev) =>({ ...prev, error: "Geolocation is not supported on this device/browser." }));
    return;
  }

  const onSuccess = async (pos) =>{
    const { latitude, longitude, accuracy } = pos.coords || {};
    const coords = Number.isFinite(latitude) && Number.isFinite(longitude) ? { lat: latitude, lng: longitude } : null;
    setTracking((prev) =>({ ...prev, coords, accuracy: Number(accuracy) || null }));

    const now = Date.now();
    if (now - lastSentAtMsRef.current < 8000) return; // throttle to ~8s
    lastSentAtMsRef.current = now;

    try {
      setTracking((prev) =>({ ...prev, sending: true }));
      await updateLocation(latitude, longitude);
      setTracking((prev) =>({ ...prev, lastSentAt: new Date().toISOString() }));
    } catch (e) {
      setTracking((prev) =>({ ...prev, error: e?.message || "Failed to send location update." }));
    } finally {
      setTracking((prev) =>({ ...prev, sending: false }));
    }
  };

  const onError = (err) =>{
    const msg = err?.code === 1
      ? "Location permission denied. Please allow GPS permission."
      : err?.code === 2
        ? "Location unavailable. Try again outdoors or check GPS settings."
        : err?.code === 3
          ? "Location request timed out. Try again."
          : "Failed to get location.";
    setTracking((prev) =>({ ...prev, error: msg }));
    stopTracking();
  };

  geoWatchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 12000,
  });
  setTracking((prev) =>({ ...prev, active: true }));
}, [stopTracking]);

useEffect(() =>{
  return () =>stopTracking();
}, [stopTracking]);
return (<><Navigation /><div className="dashboard-wrapper dashboard-wrapper--wide" id="top"><div className="dashboard"><div id="map-section" className="map-card"><MapSection driverLocation={tracking.coords} /></div><div className="dashboard-tri-row"><BusInfo /><div id="route-section"><RouteInfo /></div><DriverInfo /></div><div style={{ marginTop: "1rem", gridColumn: "1 / -1", width: "100%" }}><WeatherInfo allowEdit /></div><div id="leave-section" className="card" style={{ padding: "1.5rem", marginTop: "1rem", gridColumn: "1 / -1", width: "100%" }}><h3 style={{ color: "#8a5a00", marginTop: 0 }}>Leave Requests</h3><form onSubmit={submitLeave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}><div className="form-group" style={{ margin: 0 }}><label>From Date</label><input type="date" value={leaveForm.fromDate} onChange={(e) =>setLeaveForm({ ...leaveForm, fromDate: e.target.value })} required /></div><div className="form-group" style={{ margin: 0 }}><label>To Date</label><input type="date" value={leaveForm.toDate} onChange={(e) =>setLeaveForm({ ...leaveForm, toDate: e.target.value })} required /></div><div className="form-group" style={{ margin: 0 }}><label>From Time (optional)</label><input type="time" value={leaveForm.fromTime} onChange={(e) =>setLeaveForm({ ...leaveForm, fromTime: e.target.value })} /></div><div className="form-group" style={{ margin: 0 }}><label>To Time (optional)</label><input type="time" value={leaveForm.toTime} onChange={(e) =>setLeaveForm({ ...leaveForm, toTime: e.target.value })} /></div><div className="form-group" style={{ gridColumn: "1 / -1", margin: 0 }}><label>Reason</label><textarea rows={3} value={leaveForm.reason} onChange={(e) =>setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason for leave" required /></div>{leaveError && (<p style={{ gridColumn: "1 / -1", color: "#e53e3e", margin: 0 }}>{leaveError}</p>)}<div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}><button className="primary" type="submit" disabled={leaveSubmitting}>{leaveSubmitting ? "Submitting..." : "Apply Leave"}</button></div></form><div style={{ marginTop: "1.25rem" }}><h3 style={{ color: "#8a5a00", marginTop: 0 }}>My Leave Records</h3>{leaveLoading ? (<p style={{ color: "#707eae", margin: 0 }}>Loading leave records...</p>) : leaves.length === 0 ? (<p style={{ color: "#707eae", margin: 0 }}>No leave requests yet.</p>) : (<div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left" }}><th style={{ padding: "10px 8px", borderBottom: "1px solid #e7eaf1" }}>From</th><th style={{ padding: "10px 8px", borderBottom: "1px solid #e7eaf1" }}>To</th><th style={{ padding: "10px 8px", borderBottom: "1px solid #e7eaf1" }}>Reason</th><th style={{ padding: "10px 8px", borderBottom: "1px solid #e7eaf1" }}>Status</th></tr></thead><tbody>{leaves.map((l) =>(<tr key={l._id}><td style={{ padding: "10px 8px", borderBottom: "1px solid #f1f5f9" }}>{l.fromDate ? new Date(l.fromDate).toLocaleDateString() : "-"} {l.fromTime ? ` ${l.fromTime}` : ""}</td><td style={{ padding: "10px 8px", borderBottom: "1px solid #f1f5f9" }}>{l.toDate ? new Date(l.toDate).toLocaleDateString() : "-"} {l.toTime ? ` ${l.toTime}` : ""}</td><td style={{ padding: "10px 8px", borderBottom: "1px solid #f1f5f9" }}>{l.reason}</td><td style={{ padding: "10px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 700 }}>{String(l.status || "pending").toUpperCase()}</td></tr>))}</tbody></table></div>)}</div></div><div className="dashboard-tri-row driver-action-cards" style={{ marginTop: "1rem" }}><div className="card driver-action-card" style={{ padding: "1.5rem" }}><div className="driver-action-card__header"><h3 style={{ color: "#8a5a00", marginTop: 0 }}>️ Damage Reports</h3><p style={{ color: "#707eae", margin: 0 }}>Report bus damages with photos and track approval/payment.</p></div><div className="driver-action-card__body"><p style={{ margin: 0, color: "#707eae" }}>Upload photos (max 3) and add clear details.</p><p style={{ margin: 0, color: "#94a3b8" }}>Admin will approve and update payment status.</p></div><div className="driver-action-card__footer"><Link to="/driver/damages" style={{ textDecoration: "none" }}><button className="primary" style={{ padding: "10px 16px" }}>Open Damage Hub</button></Link></div></div><div className="card driver-action-card" style={{ padding: "1.5rem" }}><div className="driver-action-card__header"><h3 style={{ color: "#8a5a00", marginTop: 0 }}>Vehicle Details</h3><p style={{ color: "#707eae", margin: 0 }}>Quick snapshot of insurance, maintenance, and your assigned bus.</p></div><div className="driver-action-card__body driver-action-card__body--left">{busLoading ? (<p style={{ color: "#707eae", margin: 0 }}>Loading vehicle details...</p>) : assignedBus ? (<><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}><div><div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.5px" }}>BUS NO</div><div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#1f2a5a" }}>{assignedBus.busNo}</div></div><div><div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.5px" }}>STATUS</div><div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#1f2a5a" }}>{assignedBus.status || "Running"}</div></div><div><div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.5px" }}>TYPE</div><div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#1f2a5a" }}>{assignedBus.type || "Transport"}</div></div><div><div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.5px" }}>CAPACITY</div><div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#1f2a5a" }}>{Number(assignedBus.capacity || 0)}</div></div></div><div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}><span className="pill pending">Insurance: Pending</span><span className="pill paid">Maintenance: OK</span><span className="pill pending">Fitness: Due</span></div></>) : (<div><p style={{ color: "#707eae", margin: "0 0 10px 0" }}>No bus assigned yet.</p><p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>Ask admin to assign a bus to your driver account.</p></div>)}</div><div className="driver-action-card__footer"><Link to="/profile" style={{ textDecoration: "none" }}><button className="secondary" style={{ padding: "10px 16px" }}>Open Driver Profile</button></Link></div></div><div className="card driver-action-card" style={{ padding: "1.5rem" }}><div className="driver-action-card__header"><h3 style={{ color: "#8a5a00", marginTop: 0 }}>Live Bus Tracking</h3><p style={{ color: "#707eae", margin: 0 }}>Turn on GPS to share your live location for real-time tracking.</p></div><div className="driver-action-card__body"><div className="driver-action-card__actions">{!tracking.active ? (<button className="primary" style={{ padding: "10px 16px" }} onClick={startTracking}>Enable GPS</button>) : (<button className="danger" style={{ padding: "10px 16px" }} onClick={stopTracking}>Stop GPS</button>)}<button className="secondary" style={{ padding: "10px 16px" }} onClick={() =>{ const el = document.getElementById("map-section"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} >View on Map</button></div><div className="driver-action-card__meta"><span className={`pill ${tracking.active ? "paid" : "pending"}`}>GPS: {tracking.active ? "ON" : "OFF"}</span>{tracking.sending &&<span className="pill pending">Sending…</span>} {tracking.accuracy != null && (<span className="pill pending">Accuracy: ~{Math.round(tracking.accuracy)}m</span>)}</div>{tracking.coords && (<p className="driver-action-card__coords">Lat: {tracking.coords.lat.toFixed(5)} • Lng: {tracking.coords.lng.toFixed(5)} {tracking.lastSentAt ? ` • Updated: ${new Date(tracking.lastSentAt).toLocaleTimeString()}` : ""}</p>)} {tracking.error && (<p className="driver-action-card__error">{tracking.error}</p>)}</div><div className="driver-action-card__footer" /></div></div><FeedbackPanel /></div></div></>);
} 








