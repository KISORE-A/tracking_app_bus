import React from "react";
import { createFeedback, getMyFeedback } from "../services/api";

const FEEDBACK_TYPES = [
  { value: "good", label: "Good" },
  { value: "bad", label: "Bad" },
  { value: "complaint", label: "Complaint" },
  { value: "suggestion", label: "Suggestion" }
];

const STATUS_COLORS = {
  open: "#f59e0b",
  reviewed: "#2563eb",
  resolved: "#16a34a"
};

export default function FeedbackSection() {
  const [form, setForm] = React.useState({ type: "suggestion", title: "", message: "" });
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyFeedback();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createFeedback(form);
      setForm({ type: "suggestion", title: "", message: "" });
      await load();
    } catch (err) {
      setError(err?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" id="feedback-section" style={{ padding: "1.5rem", width: "100%" }}>
      <h3 style={{ color: "#8a5a00", marginTop: 0 }}>Feedback & Complaints</h3>
      <p style={{ color: "#707eae", marginTop: "-4px" }}>
        Post good/bad feedback, complaints, or suggestions. Admin can review and reply.
      </p>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            {FEEDBACK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Short summary"
            required
          />
        </div>
        <div className="form-group" style={{ gridColumn: "1 / -1", margin: 0 }}>
          <label>Message</label>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Write details here..."
            required
          />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}>
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post Feedback"}
          </button>
        </div>
      </form>

      {error && <p style={{ color: "#e53e3e", marginTop: "10px" }}>{error}</p>}

      <div style={{ marginTop: "1.1rem" }}>
        <h4 style={{ color: "#8a5a00", margin: "0 0 8px 0" }}>My Feedback History</h4>
        {loading ? (
          <p style={{ color: "#707eae", margin: 0 }}>Loading...</p>
        ) : rows.length === 0 ? (
          <p style={{ color: "#707eae", margin: 0 }}>No feedback posted yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {rows.map((row) => (
              <div key={row._id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 800, color: "#1f2a5a" }}>{row.title}</div>
                  <div style={{ fontSize: "0.82rem", color: STATUS_COLORS[row.status] || "#64748b", fontWeight: 800 }}>
                    {String(row.status || "open").toUpperCase()}
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "4px" }}>
                  {String(row.type || "").toUpperCase()} • {new Date(row.createdAt).toLocaleString()}
                </div>
                <p style={{ margin: "8px 0 0 0", color: "#334155" }}>{row.message}</p>
                {row.adminReply ? (
                  <div style={{ marginTop: "10px", background: "#eef4ff", borderRadius: "10px", padding: "10px" }}>
                    <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "4px" }}>Admin Reply</div>
                    <div style={{ color: "#1f2937" }}>{row.adminReply}</div>
                  </div>
                ) : (
                  <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#94a3b8" }}>
                    No admin reply yet.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

