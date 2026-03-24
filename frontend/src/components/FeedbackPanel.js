import React from "react";
import { createFeedback, getMyFeedback } from "../services/api";
import "./FeedbackPanel.css";

const FEEDBACK_TYPES = [
  { value: "good", label: "Good" },
  { value: "bad", label: "Bad" },
  { value: "complaint", label: "Complaint" },
  { value: "suggestion", label: "Suggestion" }
];

export default function FeedbackPanel() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [form, setForm] = React.useState({ type: "suggestion", title: "", message: "" });

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
    const onToggle = () => {
      setIsOpen((prev) => !prev);
      load();
    };
    window.addEventListener("akshuu:toggle-feedback", onToggle);
    return () => window.removeEventListener("akshuu:toggle-feedback", onToggle);
  }, [load]);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => setIsOpen(false);

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

  if (!isOpen) return null;

  return (
    <>
      <div className="feedback-overlay" onClick={close} />
      <aside className="feedback-drawer" role="dialog" aria-label="Feedback panel">
        <div className="feedback-drawer-header">
          <h3>Feedback</h3>
          <button className="feedback-close-btn" onClick={close} aria-label="Close feedback">
            X
          </button>
        </div>

        <form onSubmit={submit} className="feedback-form">
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            {FEEDBACK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            required
          />
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Write your feedback..."
            required
          />
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post Feedback"}
          </button>
        </form>

        {error && <p style={{ color: "#e53e3e", margin: "10px 0 0 0" }}>{error}</p>}

        <div className="feedback-history">
          <h4>My Feedback</h4>
          {loading ? (
            <p>Loading...</p>
          ) : rows.length === 0 ? (
            <p>No feedback posted yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row._id} className="feedback-item">
                <div className="feedback-item-head">
                  <strong>{row.title}</strong>
                  <span className={`feedback-status ${row.status || "open"}`}>{String(row.status || "open").toUpperCase()}</span>
                </div>
                <p className="feedback-meta">{String(row.type || "").toUpperCase()} • {new Date(row.createdAt).toLocaleString()}</p>
                <p>{row.message}</p>
                {row.adminReply ? (
                  <div className="feedback-reply">
                    <div className="feedback-reply-title">Admin Reply</div>
                    <div>{row.adminReply}</div>
                  </div>
                ) : (
                  <div className="feedback-waiting">No admin reply yet.</div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
