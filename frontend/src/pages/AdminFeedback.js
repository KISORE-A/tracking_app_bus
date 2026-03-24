import React from "react";
import Navigation from "../components/Navigation";
import { getAllFeedback, replyFeedback } from "../services/api";

const STATUS_OPTIONS = ["open", "reviewed", "resolved"];
const TYPE_OPTIONS = ["all", "good", "bad", "complaint", "suggestion"];

export default function AdminFeedback() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [draft, setDraft] = React.useState({});
  const [savingId, setSavingId] = React.useState("");
  const [filters, setFilters] = React.useState({
    type: "all",
    status: "all",
    role: "all",
    query: ""
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllFeedback();
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

  const sendReply = async (id) => {
    const d = draft[id] || {};
    const adminReply = String(d.adminReply ?? "").trim();
    if (!adminReply) {
      alert("Reply message is required.");
      return;
    }

    setSavingId(id);
    try {
      await replyFeedback(id, {
        adminReply,
        status: d.status || "reviewed"
      });
      setDraft((prev) => ({ ...prev, [id]: { ...prev[id], adminReply: "" } }));
      await load();
    } catch (err) {
      alert(err?.message || "Failed to reply");
    } finally {
      setSavingId("");
    }
  };

  const roleOptions = React.useMemo(() => {
    const unique = new Set((rows || []).map((row) => String(row.userRole || "").toLowerCase()).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [rows]);

  const summary = React.useMemo(
    () =>
      (rows || []).reduce(
        (acc, row) => {
          const status = String(row.status || "open").toLowerCase();
          if (acc[status] !== undefined) acc[status] += 1;
          acc.total += 1;
          return acc;
        },
        { total: 0, open: 0, reviewed: 0, resolved: 0 }
      ),
    [rows]
  );

  const filteredRows = React.useMemo(() => {
    const query = String(filters.query || "").trim().toLowerCase();
    return (rows || []).filter((row) => {
      const type = String(row.type || "").toLowerCase();
      const status = String(row.status || "open").toLowerCase();
      const role = String(row.userRole || "").toLowerCase();
      const haystack = [row.title, row.message, row.userName, row.adminReply, row.userRole]
        .join(" ")
        .toLowerCase();

      if (filters.type !== "all" && type !== filters.type) return false;
      if (filters.status !== "all" && status !== filters.status) return false;
      if (filters.role !== "all" && role !== filters.role) return false;
      if (query && !haystack.includes(query)) return false;
      return true;
    });
  }, [rows, filters]);

  return (
    <>
      <Navigation />
      <div style={{ background: "#f4f7fe", minHeight: "100vh", padding: "100px 20px 20px 20px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ color: "#8a5a00", marginTop: 0 }}>Feedback Management</h3>
            <p style={{ color: "#707eae" }}>
              View all user feedback (good, bad, complaints, suggestions), then reply and update status.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "12px" }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: 700 }}>TOTAL</div>
                <div style={{ color: "#1f2a5a", fontWeight: 900, fontSize: "1.1rem" }}>{summary.total}</div>
              </div>
              <div style={{ border: "1px solid #fde68a", borderRadius: "10px", padding: "10px" }}>
                <div style={{ color: "#b45309", fontSize: "0.78rem", fontWeight: 700 }}>OPEN</div>
                <div style={{ color: "#92400e", fontWeight: 900, fontSize: "1.1rem" }}>{summary.open}</div>
              </div>
              <div style={{ border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px" }}>
                <div style={{ color: "#1d4ed8", fontSize: "0.78rem", fontWeight: 700 }}>REVIEWED</div>
                <div style={{ color: "#1e40af", fontWeight: 900, fontSize: "1.1rem" }}>{summary.reviewed}</div>
              </div>
              <div style={{ border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px" }}>
                <div style={{ color: "#15803d", fontSize: "0.78rem", fontWeight: 700 }}>RESOLVED</div>
                <div style={{ color: "#166534", fontWeight: 900, fontSize: "1.1rem" }}>{summary.resolved}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "12px" }}>
              <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
                ))}
              </select>
              <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role === "all" ? "All Roles" : role}</option>
                ))}
              </select>
              <input
                placeholder="Search title, message, user..."
                value={filters.query}
                onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
              />
            </div>

            {error && <p style={{ color: "#e53e3e" }}>{error}</p>}
            {loading && <p style={{ color: "#707eae" }}>Loading feedback...</p>}
            {!loading && rows.length === 0 && <p style={{ color: "#707eae" }}>No feedback yet.</p>}
            {!loading && rows.length > 0 && filteredRows.length === 0 && (
              <p style={{ color: "#707eae" }}>No feedback matches your filter.</p>
            )}

            {!loading && filteredRows.length > 0 && (
              <div style={{ display: "grid", gap: "14px", marginTop: "12px" }}>
                {filteredRows.map((row) => (
                  <div key={row._id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 900, color: "#1f2a5a" }}>{row.title}</div>
                        <div style={{ color: "#64748b", fontSize: "0.82rem" }}>
                          {row.userName} ({row.userRole}) • {new Date(row.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ color: "#2563eb", fontWeight: 800 }}>{String(row.type || "").toUpperCase()}</div>
                    </div>
                    <p style={{ margin: "8px 0", color: "#334155" }}>{row.message}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "10px", alignItems: "end" }}>
                      <textarea
                        rows={2}
                        value={draft[row._id]?.adminReply ?? row.adminReply ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [row._id]: { ...(prev[row._id] || {}), adminReply: e.target.value }
                          }))
                        }
                        placeholder="Write admin reply..."
                      />
                      <select
                        value={draft[row._id]?.status ?? row.status ?? "open"}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [row._id]: { ...(prev[row._id] || {}), status: e.target.value }
                          }))
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    {row.repliedAt && (
                      <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "0.82rem" }}>
                        Last admin reply: {new Date(row.repliedAt).toLocaleString()}
                      </p>
                    )}
                    <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                      <button className="primary" onClick={() => sendReply(row._id)} disabled={savingId === row._id}>
                        {savingId === row._id ? "Saving..." : "Save Reply"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

