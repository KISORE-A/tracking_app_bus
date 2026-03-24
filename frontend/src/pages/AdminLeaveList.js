import React from "react";
import Navigation from "../components/Navigation";
import { getLeaveRequests, updateLeaveStatus } from "../services/api";

const actionWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const actionButtonStyle = {
  minWidth: "130px",
};

export default function AdminLeaveList({ role }) {
  const [leaves, setLeaves] = React.useState([]);
  const [updatingId, setUpdatingId] = React.useState("");

  const formatDateTime = (date, time) => {
    if (!date) return "-";
    const formatted = new Date(date).toLocaleDateString();
    return time ? `${formatted} ${time}` : formatted;
  };

  const fetchLeaves = React.useCallback(async () => {
    try {
      const data = await getLeaveRequests(role);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, [role]);

  React.useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const setStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      await updateLeaveStatus(id, status);
      await fetchLeaves();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId("");
    }
  };

  const title = role === "teacher" ? "Teacher Leave Approvals" : "Driver Leave Approvals";

  return (
    <>
      <Navigation />
      <div style={{ background: "#f4f7fe", minHeight: "100vh", padding: "100px 20px 20px 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ color: "#8a5a00" }}>{title}</h2>
          <div className="card" style={{ padding: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th>Name</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>{l.requesterName}</td>
                    <td>{formatDateTime(l.fromDate, l.fromTime)}</td>
                    <td>{formatDateTime(l.toDate, l.toTime)}</td>
                    <td>{l.reason}</td>
                    <td style={{ textTransform: "capitalize" }}>{l.status}</td>
                    <td>
                      <div style={actionWrapStyle}>
                        <button
                          className="primary"
                          style={actionButtonStyle}
                          disabled={updatingId === l._id}
                          onClick={() => setStatus(l._id, "approved")}
                        >
                          {updatingId === l._id ? "Updating..." : "Approve"}
                        </button>
                        <button
                          className="secondary"
                          style={actionButtonStyle}
                          disabled={updatingId === l._id}
                          onClick={() => setStatus(l._id, "rejected")}
                        >
                          {updatingId === l._id ? "Updating..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

