import React from "react";
import { Link } from "react-router-dom";

import Navigation from "../components/Navigation";
import {
  createFeeReminder,
  deleteUser,
  getBuses,
  getStudentFeeHistoryDownloadUrl,
  getStudents,
  updateUser,
} from "../services/api";

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        data: reader.result,
      });
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const formatFileSize = (size) => {
  const bytes = Number(size || 0);
  if (!bytes) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const normalizeWhatsappNumber = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const buildWhatsappMessage = (student) => {
  const totalFees = Number(student.totalFees || 0);
  const paidFees = Number(student.paidFees || 0);
  const due = Math.max(0, totalFees - paidFees);
  const isPaid = due <= 0 && totalFees > 0;
  const studentId = student.studentId ? ` (${student.studentId})` : "";
  const pdfLink =
    student.feeHistory?.pdf ? getStudentFeeHistoryDownloadUrl(student.id || student._id, "pdf") : "";
  const docxLink =
    student.feeHistory?.docx ? getStudentFeeHistoryDownloadUrl(student.id || student._id, "docx") : "";

  const lines = [
    `Hello ${student.name}${studentId},`,
    "",
    `Transport fee status: ${isPaid ? "Paid" : "Pending"}`,
    `Total fees: Rs.${totalFees.toLocaleString()}`,
    `Paid fees: Rs.${paidFees.toLocaleString()}`,
    `Pending fees: Rs.${due.toLocaleString()}`,
  ];

  if (student.feeHistory?.title) {
    lines.push(`Document: ${student.feeHistory.title}`);
  }
  if (student.feeHistory?.note) {
    lines.push(`Note: ${student.feeHistory.note}`);
  }
  if (pdfLink) {
    lines.push(`PDF download: ${pdfLink}`);
  }
  if (docxLink) {
    lines.push(`Word download: ${docxLink}`);
  }

  lines.push("", "Please check and contact admin if anything needs correction.");
  return lines.join("\n");
};

const buildEmailMessage = (student) => {
  const totalFees = Number(student.totalFees || 0);
  const paidFees = Number(student.paidFees || 0);
  const due = Math.max(0, totalFees - paidFees);
  const isPaid = due <= 0 && totalFees > 0;
  const pdfLink = student.feeHistory?.pdf ? getStudentFeeHistoryDownloadUrl(student.id || student._id, "pdf") : "";
  const docxLink = student.feeHistory?.docx ? getStudentFeeHistoryDownloadUrl(student.id || student._id, "docx") : "";

  const lines = [
    `Hello ${student.name},`,
    "",
    `Transport fee status: ${isPaid ? "Paid" : "Pending"}`,
    `Total fees: Rs.${totalFees.toLocaleString()}`,
    `Paid fees: Rs.${paidFees.toLocaleString()}`,
    `Pending fees: Rs.${due.toLocaleString()}`,
  ];

  if (student.feeHistory?.title) lines.push(`Document: ${student.feeHistory.title}`);
  if (student.feeHistory?.note) lines.push(`Note: ${student.feeHistory.note}`);
  if (pdfLink) lines.push(`PDF download: ${pdfLink}`);
  if (docxLink) lines.push(`Word download: ${docxLink}`);
  lines.push("", "Please contact admin if any correction is needed.");
  return lines.join("\n");
};

const whatsappIcon = (
  <span
    style={{
      width: "20px",
      height: "20px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0,
      flexShrink: 0,
    }}
  >
    <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" style={{ display: "block" }}>
      <path
        fill="currentColor"
        d="M19.11 17.19c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.18-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.97 2.64 1.11 2.82c.14.18 1.9 2.9 4.61 4.07.65.28 1.15.45 1.54.58.65.21 1.24.18 1.7.11.52-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.06-.11-.25-.18-.52-.32Z"
      />
      <path
        fill="currentColor"
        d="M16.02 3.2c-7.06 0-12.8 5.73-12.8 12.78 0 2.25.59 4.45 1.7 6.39L3.2 28.8l6.62-1.69a12.82 12.82 0 0 0 6.2 1.58h.01c7.06 0 12.8-5.73 12.8-12.79 0-3.42-1.33-6.64-3.75-9.05A12.73 12.73 0 0 0 16.02 3.2Zm0 23.33h-.01a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-3.93 1 1.05-3.84-.26-.4a10.62 10.62 0 0 1-1.63-5.67c0-5.88 4.77-10.64 10.64-10.64 2.84 0 5.51 1.11 7.52 3.11a10.57 10.57 0 0 1 3.12 7.52c0 5.88-4.78 10.64-10.66 10.64Z"
      />
    </svg>
  </span>
);

const gmailIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      fill="currentColor"
      d="M21.5 6.75v10.5a1.75 1.75 0 0 1-1.75 1.75H18V9.56l-6 4.5-6-4.5V19H4.25A1.75 1.75 0 0 1 2.5 17.25V6.75A1.75 1.75 0 0 1 4.25 5h.57L12 10.38 19.18 5h.57A1.75 1.75 0 0 1 21.5 6.75Z"
    />
    <path fill="#EA4335" d="M21.5 6.75V7l-3.5 2.63L12 14.12 6 9.63 2.5 7v-.25A1.75 1.75 0 0 1 4.25 5h.57L12 10.38 19.18 5h.57A1.75 1.75 0 0 1 21.5 6.75Z" />
    <path fill="#34A853" d="M18 19V9.56L21.5 7v10.25A1.75 1.75 0 0 1 19.75 19H18Z" />
    <path fill="#4285F4" d="M2.5 7 6 9.56V19H4.25A1.75 1.75 0 0 1 2.5 17.25V7Z" />
    <path fill="#FBBC04" d="M18 9.56V19H6V9.56l6 4.5 6-4.5Z" opacity=".18" />
  </svg>
);

export default function ManageStudents() {
  const [students, setStudents] = React.useState([]);
  const [buses, setBuses] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [editingStudent, setEditingStudent] = React.useState(null);
  const [savingStudent, setSavingStudent] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [studentData, busData] = await Promise.all([getStudents(), getBuses()]);
      setStudents(studentData);
      setBuses(busData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      (student.assignedBus || "").toLowerCase().includes(query) ||
      (student.department || "").toLowerCase().includes(query) ||
      (student.studentId || "").toLowerCase().includes(query)
    );
  });

  const openEditor = (student) => {
    setEditingStudent({
      ...student,
      feeHistoryTitle: student.feeHistory?.title || "",
      feeHistoryNote: student.feeHistory?.note || "",
      removePdf: false,
      removeDocx: false,
      pendingPdfUpload: null,
      pendingDocxUpload: null,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete student account?")) return;
    try {
      await deleteUser(id);
      await fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleFilePick = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const expectedMime =
      type === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (file.type !== expectedMime) {
      alert(type === "pdf" ? "Please upload a PDF file." : "Please upload a DOCX file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Please keep each file below 8 MB.");
      return;
    }

    try {
      const uploaded = await readFileAsDataUrl(file);
      setEditingStudent((current) =>
        current
          ? {
              ...current,
              [type === "pdf" ? "pendingPdfUpload" : "pendingDocxUpload"]: uploaded,
              [type === "pdf" ? "removePdf" : "removeDocx"]: false,
            }
          : current
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingStudent) return;

    setSavingStudent(true);
    try {
      const studentId = editingStudent.id || editingStudent._id;
      const userPayload = {
        name: editingStudent.name || "",
        email: editingStudent.email || "",
        phone: editingStudent.phone || "",
        department: editingStudent.department || "",
        year: editingStudent.year || "",
        parentContact: editingStudent.parentContact || "",
        bloodGroup: editingStudent.bloodGroup || "",
        assignedBus: editingStudent.assignedBus || "",
        totalFees: Number(editingStudent.totalFees || 0),
        paidFees: Number(editingStudent.paidFees || 0),
        address: editingStudent.address || "",
        feeHistoryTitle: editingStudent.feeHistoryTitle || "",
        feeHistoryNote: editingStudent.feeHistoryNote || "",
        pdfDocument: editingStudent.pendingPdfUpload || undefined,
        docxDocument: editingStudent.pendingDocxUpload || undefined,
        removePdf: editingStudent.removePdf,
        removeDocx: editingStudent.removeDocx,
      };

      await updateUser(studentId, userPayload);

      setEditingStudent(null);
      await fetchData();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setSavingStudent(false);
    }
  };

  const handleWhatsappShare = async (student) => {
    if (student.pendingPdfUpload || student.pendingDocxUpload) {
      alert("Please save the student first so the new file links are available in WhatsApp.");
      return;
    }

    const targetNumber = normalizeWhatsappNumber(student.phone || student.parentContact);
    if (!targetNumber) {
      alert("This student does not have a valid phone or parent contact number.");
      return;
    }

    const message = buildWhatsappMessage(student);
    const due = Math.max(0, Number(student.totalFees || 0) - Number(student.paidFees || 0));

    try {
      await createFeeReminder({
        studentId: student.studentId || student.id || student._id,
        studentName: student.name,
        email: student.email,
        phone: student.phone || "",
        parentContact: student.parentContact || "",
        assignedBus: student.assignedBus || "",
        dueAmount: due,
        channel: "whatsapp",
        subject: student.feeHistory?.title || "Student fee history",
        message,
      });
    } catch (error) {
      console.error("Failed to log WhatsApp reminder", error);
    }

    window.open(`https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleEmailShare = async (student) => {
    if (!student.email) {
      alert("This student does not have an email address.");
      return;
    }

    const subject = student.feeHistory?.title || "Student fee history";
    const body = buildEmailMessage(student);
    const due = Math.max(0, Number(student.totalFees || 0) - Number(student.paidFees || 0));

    try {
      await createFeeReminder({
        studentId: student.studentId || student.id || student._id,
        studentName: student.name,
        email: student.email,
        phone: student.phone || "",
        parentContact: student.parentContact || "",
        assignedBus: student.assignedBus || "",
        dueAmount: due,
        channel: "gmail",
        subject,
        message: body,
      });
    } catch (error) {
      console.error("Failed to log email reminder", error);
    }

    window.open(
      `mailto:${encodeURIComponent(student.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_self"
    );
  };

  const paidCount = students.filter((student) => {
    const due = Number(student.totalFees || 0) - Number(student.paidFees || 0);
    return due <= 0 && Number(student.totalFees || 0) > 0;
  }).length;

  return (
    <>
      <Navigation />
      <div style={{ background: "#f4f7fe", minHeight: "100vh", padding: "100px 20px 20px 20px" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ color: "#8a5a00", margin: 0 }}>Student Management</h2>
              <p style={{ color: "#707eae" }}>
                Manage student accounts, fee status, and individual history files in one place.
              </p>
            </div>
            <Link to="/admin/students/add">
              <button className="primary" style={{ padding: "12px 24px" }}>+ Register Student</button>
            </Link>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
            <input
              type="text"
              placeholder="Search students by name, register number, email, bus, or department..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #edf2f7" }}
            />
          </div>

          <div style={{ display: "flex", gap: "15px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: "0.85rem", color: "#8a5a00", fontWeight: "600" }}>
              Total: <strong>{students.length}</strong>
            </div>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: "0.85rem", color: "#38a169", fontWeight: "600" }}>
              Paid: <strong>{paidCount}</strong>
            </div>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: "0.85rem", color: "#e53e3e", fontWeight: "600" }}>
              Pending: <strong>{students.length - paidCount}</strong>
            </div>
            <div style={{ padding: "8px 16px", borderRadius: "10px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontSize: "0.85rem", color: "#2563eb", fontWeight: "600" }}>
              History Uploaded: <strong>{students.filter((student) => student.feeHistory?.hasAnyDocument).length}</strong>
            </div>
            {searchQuery ? (
              <div style={{ padding: "8px 16px", borderRadius: "10px", background: "#edf2f7", fontSize: "0.85rem", color: "#d89a10", fontWeight: "600" }}>
                Found: <strong>{filtered.length}</strong>
              </div>
            ) : null}
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1180px" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.8rem", color: "#707eae", fontWeight: "700" }}>Student</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.8rem", color: "#707eae", fontWeight: "700" }}>Email</th>
                    <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "0.8rem", color: "#707eae", fontWeight: "700" }}>Department</th>
                    <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.8rem", color: "#707eae", fontWeight: "700" }}>Bus</th>
                    <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.8rem", color: "#707eae", fontWeight: "700" }}>Fees</th>
                    <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.8rem", color: "#707eae", fontWeight: "700" }}>History</th>
                    <th style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.8rem", color: "#707eae", fontWeight: "700", minWidth: "300px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>Loading students...</td>
                    </tr>
                  ) : filtered.map((student) => {
                    const due = Math.max(0, Number(student.totalFees || 0) - Number(student.paidFees || 0));
                    const isPaid = due <= 0 && Number(student.totalFees || 0) > 0;
                    const hasPdf = Boolean(student.feeHistory?.pdf);
                    const hasDocx = Boolean(student.feeHistory?.docx);

                    return (
                      <tr key={student.id || student._id} style={{ borderBottom: "1px solid #edf2f7" }}>
                        <td style={{ padding: "14px 20px", fontWeight: "bold", fontSize: "0.85rem" }}>
                          <div>{student.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>
                            {student.studentId || "No register number"} {student.year ? `• ${student.year}` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "0.8rem", color: "#4a5568" }}>{student.email}</td>
                        <td style={{ padding: "14px 20px", fontSize: "0.8rem" }}>{student.department || "N/A"}</td>
                        <td style={{ padding: "14px 20px", textAlign: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "600", background: student.assignedBus ? "#ebf4ff" : "#fff5f5", color: student.assignedBus ? "#3182ce" : "#e53e3e", whiteSpace: "nowrap" }}>
                            {student.assignedBus || "Unassigned"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "600", background: isPaid ? "#c6f6d5" : "#fed7d7", color: isPaid ? "#22543d" : "#9b2c2c", whiteSpace: "nowrap" }}>
                            {isPaid ? "Paid" : `Rs.${due.toLocaleString()} Due`}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textAlign: "center", fontSize: "0.76rem" }}>
                          <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ padding: "3px 8px", borderRadius: "999px", background: hasPdf ? "#dbeafe" : "#f8fafc", color: hasPdf ? "#1d4ed8" : "#94a3b8", fontWeight: 700 }}>PDF</span>
                            <span style={{ padding: "3px 8px", borderRadius: "999px", background: hasDocx ? "#dcfce7" : "#f8fafc", color: hasDocx ? "#15803d" : "#94a3b8", fontWeight: 700 }}>WORD</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                            <button onClick={() => openEditor(student)} style={{ color: "#fff", fontWeight: "600", background: "#d89a10", border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem" }}>
                              Edit
                            </button>
                            <button
                              onClick={() => handleWhatsappShare(student)}
                              aria-label="Send via WhatsApp"
                              title="Send via WhatsApp"
                              style={{ color: "#fff", background: "#0f9d58", border: "none", cursor: "pointer", padding: "8px 12px", borderRadius: "6px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                            >
                              {whatsappIcon}
                            </button>
                            <button
                              onClick={() => handleEmailShare(student)}
                              aria-label="Send via Gmail"
                              title="Send via Gmail"
                              style={{ color: "#2563eb", background: "#ffffff", border: "1px solid #dbe4f0", cursor: "pointer", padding: "8px 12px", borderRadius: "6px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(15, 23, 42, 0.08)" }}
                            >
                              {gmailIcon}
                            </button>
                            <button onClick={() => handleDelete(student.id || student._id)} style={{ color: "#fff", fontWeight: "600", background: "#e53e3e", border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: "6px", fontSize: "0.78rem" }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {editingStudent ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card" style={{ width: "900px", maxWidth: "100%", padding: "2rem", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "16px" }}>
              <div>
                <h3 style={{ margin: 0, color: "#8a5a00" }}>Edit Student</h3>
                <p style={{ margin: "6px 0 0", color: "#707eae", fontSize: "0.9rem" }}>
                  Update fee details, upload the individual PDF/DOCX history, and share it through WhatsApp.
                </p>
              </div>
              <button onClick={() => setEditingStudent(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#a3aed0" }}>
                x
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "15px" }}>
                <div className="info-group">
                  <label>Name</label>
                  <input type="text" value={editingStudent.name || ""} onChange={(event) => setEditingStudent({ ...editingStudent, name: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Email</label>
                  <input type="email" value={editingStudent.email || ""} onChange={(event) => setEditingStudent({ ...editingStudent, email: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Phone</label>
                  <input type="tel" value={editingStudent.phone || ""} onChange={(event) => setEditingStudent({ ...editingStudent, phone: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Parent Contact</label>
                  <input type="tel" value={editingStudent.parentContact || ""} onChange={(event) => setEditingStudent({ ...editingStudent, parentContact: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Department</label>
                  <input type="text" value={editingStudent.department || ""} onChange={(event) => setEditingStudent({ ...editingStudent, department: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Year</label>
                  <input type="text" value={editingStudent.year || ""} onChange={(event) => setEditingStudent({ ...editingStudent, year: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Blood Group</label>
                  <input type="text" value={editingStudent.bloodGroup || ""} onChange={(event) => setEditingStudent({ ...editingStudent, bloodGroup: event.target.value })} style={inputStyle} />
                </div>
                <div className="info-group">
                  <label>Assigned Bus</label>
                  <select value={editingStudent.assignedBus || ""} onChange={(event) => setEditingStudent({ ...editingStudent, assignedBus: event.target.value })} style={inputStyle}>
                    <option value="">Unassigned</option>
                    {buses.map((bus) => (
                      <option key={bus._id} value={bus.busNo}>
                        {bus.busNo} ({bus.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #edf2f7", marginTop: "18px", paddingTop: "18px" }}>
                <h4 style={{ color: "#707eae", marginBottom: "10px", fontSize: "0.9rem" }}>Fee Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "15px" }}>
                  <div className="info-group">
                    <label>Total Fees (Rs.)</label>
                    <input type="number" value={editingStudent.totalFees || 0} onChange={(event) => setEditingStudent({ ...editingStudent, totalFees: Number(event.target.value) })} style={inputStyle} />
                  </div>
                  <div className="info-group">
                    <label>Paid Fees (Rs.)</label>
                    <input type="number" value={editingStudent.paidFees || 0} onChange={(event) => setEditingStudent({ ...editingStudent, paidFees: Number(event.target.value) })} style={inputStyle} />
                  </div>
                </div>
                <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", marginTop: "8px", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#707eae" }}>Due</span>
                  <span style={{ fontWeight: "bold", color: Number(editingStudent.totalFees || 0) - Number(editingStudent.paidFees || 0) > 0 ? "#e53e3e" : "#38a169" }}>
                    Rs.{Math.max(0, Number(editingStudent.totalFees || 0) - Number(editingStudent.paidFees || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #edf2f7", marginTop: "18px", paddingTop: "18px" }}>
                <h4 style={{ color: "#707eae", marginBottom: "10px", fontSize: "0.9rem" }}>Individual History Files</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "15px" }}>
                  <div className="info-group">
                    <label>Document Title</label>
                    <input type="text" value={editingStudent.feeHistoryTitle || ""} onChange={(event) => setEditingStudent({ ...editingStudent, feeHistoryTitle: event.target.value })} placeholder="Example: March 2026 fee history" style={inputStyle} />
                  </div>
                  <div className="info-group">
                    <label>Admin Note</label>
                    <input type="text" value={editingStudent.feeHistoryNote || ""} onChange={(event) => setEditingStudent({ ...editingStudent, feeHistoryNote: event.target.value })} placeholder="Example: Pending balance to be cleared before April 5" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px", marginTop: "12px" }}>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", background: "#f8fbff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
                      <strong style={{ color: "#1d4ed8" }}>PDF File</strong>
                      {editingStudent.feeHistory?.pdf ? (
                        <a href={getStudentFeeHistoryDownloadUrl(editingStudent.id || editingStudent._id, "pdf")} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontSize: "0.82rem", fontWeight: 700 }}>
                          Download
                        </a>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#475569", minHeight: "36px" }}>
                      {editingStudent.pendingPdfUpload ? (
                        <>New file: {editingStudent.pendingPdfUpload.fileName} ({formatFileSize(editingStudent.pendingPdfUpload.size)})</>
                      ) : editingStudent.feeHistory?.pdf ? (
                        <>{editingStudent.feeHistory.pdf.fileName} ({formatFileSize(editingStudent.feeHistory.pdf.size)})</>
                      ) : (
                        "No PDF uploaded yet."
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "9px 14px", borderRadius: "8px", background: "#1d4ed8", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                        Upload PDF
                        <input type="file" accept="application/pdf" hidden onChange={(event) => handleFilePick(event, "pdf")} />
                      </label>
                      {(editingStudent.feeHistory?.pdf || editingStudent.pendingPdfUpload) ? (
                        <button type="button" onClick={() => setEditingStudent({ ...editingStudent, pendingPdfUpload: null, removePdf: true })} style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                          Remove PDF
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px", background: "#f6fff8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
                      <strong style={{ color: "#15803d" }}>Word File</strong>
                      {editingStudent.feeHistory?.docx ? (
                        <a href={getStudentFeeHistoryDownloadUrl(editingStudent.id || editingStudent._id, "docx")} target="_blank" rel="noreferrer" style={{ color: "#15803d", fontSize: "0.82rem", fontWeight: 700 }}>
                          Download
                        </a>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#475569", minHeight: "36px" }}>
                      {editingStudent.pendingDocxUpload ? (
                        <>New file: {editingStudent.pendingDocxUpload.fileName} ({formatFileSize(editingStudent.pendingDocxUpload.size)})</>
                      ) : editingStudent.feeHistory?.docx ? (
                        <>{editingStudent.feeHistory.docx.fileName} ({formatFileSize(editingStudent.feeHistory.docx.size)})</>
                      ) : (
                        "No Word file uploaded yet."
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "9px 14px", borderRadius: "8px", background: "#15803d", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                        Upload Word
                        <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(event) => handleFilePick(event, "docx")} />
                      </label>
                      {(editingStudent.feeHistory?.docx || editingStudent.pendingDocxUpload) ? (
                        <button type="button" onClick={() => setEditingStudent({ ...editingStudent, pendingDocxUpload: null, removeDocx: true })} style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>
                          Remove Word
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

              </div>

              <div className="info-group" style={{ marginTop: "18px" }}>
                <label>Address</label>
                <textarea rows="3" value={editingStudent.address || ""} onChange={(event) => setEditingStudent({ ...editingStudent, address: event.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem", flexWrap: "wrap" }}>
                <button type="submit" className="primary" style={{ flex: 1, minWidth: "180px" }} disabled={savingStudent}>
                  {savingStudent ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => handleWhatsappShare(editingStudent)} style={{ flex: 1, minWidth: "180px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "#0f9d58", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Send via WhatsApp
                </button>
                <button type="button" onClick={() => handleEmailShare(editingStudent)} style={{ flex: 1, minWidth: "180px", padding: "10px 16px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Send via Gmail
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="secondary" style={{ flex: 1, minWidth: "180px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
