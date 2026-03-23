import React, { useEffect, useState } from "react";
import { getWeatherUpdate, updateWeather } from "../services/api";
import { ClockIcon, WeatherIcon } from "./Icons";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export default function WeatherInfo({ allowEdit = false, coloredHeader = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState({
    condition: "Sunny",
    note: "",
    etaMinutes: 0,
    updatedByName: "",
    updatedByRole: "",
    updatedAt: null,
    liveUpdatedAt: null,
    temperatureC: 0,
    precipitationMm: 0,
    windSpeedKmh: 0,
    source: "",
    locationName: ""
  });
  const [form, setForm] = useState({
    note: "",
    etaMinutes: 0
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getWeatherUpdate();
        setWeather(data);
        setForm({
          note: data.note || "",
          etaMinutes: data.etaMinutes || 0
        });
      } catch (err) {
        setError(err?.message || "Unable to load weather update");
      } finally {
        setLoading(false);
      }
    };
    load();
    const intervalId = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = await updateWeather({
        condition: weather.condition,
        note: form.note,
        etaMinutes: form.etaMinutes,
        updatedByName: user.name || "Driver"
      });
      setWeather(updated);
    } catch (err) {
      setError(err?.message || "Failed to update weather");
    } finally {
      setSaving(false);
    }
  };

  const updatedAt = weather.updatedAt ? new Date(weather.updatedAt) : null;
  const liveUpdatedAt = weather.liveUpdatedAt ? new Date(weather.liveUpdatedAt) : null;

  return (
    <div className={`card weather-card ${coloredHeader ? "teacher-gradient-card" : ""}`}>
      {coloredHeader ? (
        <div className="teacher-gradient-header">
          <h3 style={{ margin: 0, border: "none", padding: 0, color: "white", display: "flex", alignItems: "center", gap: 10 }}><WeatherIcon size={22} color="white" />Weather & Delay Update</h3>
        </div>
      ) : (
        <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}><WeatherIcon size={22} />Weather & Delay Update</h3>
      )}

      {loading ? (
        <p style={{ color: "#707eae" }}>Loading weather update...</p>
      ) : (
        <>
          <div style={{ fontSize: "32px", margin: "12px 0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <WeatherIcon size={32} />
            <span>{weather.condition}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <span className="badge info">{Number(weather.temperatureC || 0)}°C</span>
            <span className="badge warning">{Number(weather.windSpeedKmh || 0)} km/h wind</span>
            <span className="badge info">{Number(weather.precipitationMm || 0).toFixed(1)} mm rain</span>
          </div>

          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <p style={{ margin: "6px 0" }}>
              <strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ClockIcon size={16} />Bus ETA:</strong> {Number(weather.etaMinutes) || 0} min
            </p>
            <p style={{ margin: "6px 0", color: "#707eae" }}>
              {weather.note || "No additional notes."}
            </p>
            <p style={{ margin: "6px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              Live weather for {weather.locationName || "campus"} via {weather.source || "weather API"}
            </p>
            {liveUpdatedAt && (
              <p style={{ margin: "6px 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                Weather refreshed at {liveUpdatedAt.toLocaleString()}
              </p>
            )}
            {updatedAt && (
              <p style={{ margin: "6px 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                Delay note by {weather.updatedByName || "Driver"} ({weather.updatedByRole || "driver"}) •{" "}
                {updatedAt.toLocaleString()}
              </p>
            )}
          </div>
        </>
      )}

      {allowEdit && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <p style={{ margin: "0 0 0.75rem 0", color: "#707eae", fontSize: "0.9rem" }}>
            Real weather updates automatically. You can publish only ETA and delay notes here.
          </p>

          <div className="form-group">
            <label>Bus ETA (minutes)</label>
            <input
              type="number"
              min="0"
              value={form.etaMinutes}
              onChange={(e) => setForm({ ...form, etaMinutes: Number(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Driver Note</label>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Rainy, bus will reach in 10 minutes."
            />
          </div>

          {error && <p style={{ color: "#e53e3e", marginTop: "0.5rem" }}>{error}</p>}

          <button className="primary" type="submit" disabled={saving}>
            {saving ? "Updating..." : "Publish Update"}
          </button>
        </form>
      )}
    </div>
  );
}
