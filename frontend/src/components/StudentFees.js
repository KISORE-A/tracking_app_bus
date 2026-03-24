import React from "react";

import { getStudentFeeHistoryDownloadUrl, getUserProfile } from "../services/api";

export default function StudentFees() {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="card" style={{ padding: "1.5rem" }}>Loading fee status...</div>;
  if (!profile) return <div className="card" style={{ padding: "1.5rem" }}>Unable to load fees.</div>;

  const totalFees = Number(profile.totalFees || 0);
  const paidFees = Number(profile.paidFees || 0);
  const due = Math.max(0, totalFees - paidFees);
  const percent = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;
  const feeHistory = profile.feeHistory || {};
  const studentId = profile.id || profile._id;

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ color: "#8a5a00", marginTop: 0 }}>Fee Status</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
          <div style={{ fontSize: "0.75rem", color: "#707eae" }}>Total Fees</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#8a5a00" }}>Rs.{totalFees.toLocaleString()}</div>
        </div>
        <div style={{ background: "#f0fff4", padding: "12px", borderRadius: "10px" }}>
          <div style={{ fontSize: "0.75rem", color: "#2f855a" }}>Paid</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2f855a" }}>Rs.{paidFees.toLocaleString()}</div>
        </div>
        <div style={{ background: "#fff5f5", padding: "12px", borderRadius: "10px" }}>
          <div style={{ fontSize: "0.75rem", color: "#e53e3e" }}>Due</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#e53e3e" }}>Rs.{due.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ marginTop: "14px" }}>
        <div style={{ fontSize: "0.8rem", color: "#707eae", marginBottom: "6px" }}>Payment Progress</div>
        <div style={{ height: "8px", background: "#edf2f7", borderRadius: "999px" }}>
          <div style={{ height: "100%", width: `${percent}%`, background: "linear-gradient(90deg,#d89a10,#05cd99)", borderRadius: "999px" }} />
        </div>
        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#64748b" }}>{percent}% paid</div>
      </div>

      <div style={{ marginTop: "18px", borderTop: "1px solid #edf2f7", paddingTop: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h4 style={{ margin: 0, color: "#334155" }}>{feeHistory.title || "Individual Fee History"}</h4>
            <p style={{ margin: "6px 0 0", color: "#707eae", fontSize: "0.85rem" }}>
              {feeHistory.note || "Admin can upload your PDF fee-history file here."}
            </p>
          </div>
          {feeHistory.updatedAt ? (
            <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              Updated {new Date(feeHistory.updatedAt).toLocaleString()}
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginTop: "14px" }}>
          <div style={{ border: "1px solid #dbeafe", background: "#f8fbff", borderRadius: "12px", padding: "14px" }}>
            <div style={{ fontWeight: 800, color: "#1d4ed8" }}>PDF</div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px", minHeight: "34px" }}>
              {feeHistory.pdf?.fileName || "No PDF uploaded yet"}
            </div>
            {feeHistory.pdf ? (
              <a
                href={getStudentFeeHistoryDownloadUrl(studentId, "pdf")}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", marginTop: "12px", textDecoration: "none", padding: "9px 14px", borderRadius: "8px", background: "#1d4ed8", color: "white", fontWeight: 700, fontSize: "0.82rem" }}
              >
                Download PDF
              </a>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}
