import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const defaultDrivers = [
  { id: 1, name: "TAMIZHAKARAN K", phone: "9876543210", experience: 8, busNo: "TN-23-AB-1234", image: "/tamil.jpeg" },
  { id: 2, name: "Vikram Singh", phone: "9876543211", experience: 5, busNo: "TN-23-AB-5678" },
  { id: 3, name: "Arjun Patel", phone: "9876543212", experience: 10, busNo: "TN-23-AB-9012" },
];

export default function DriverInfo() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState(defaultDrivers);
  const [selectedId, setSelectedId] = useState(defaultDrivers[0]?.id || 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  useEffect(() => {
    const saved = localStorage.getItem("drivers");
    if (saved) {
      setDrivers(JSON.parse(saved));
    }
  }, []);

  const currentDriver = drivers.find((d) => d.id === selectedId) || drivers[0];

  const handleEditChange = (field, value) => {
    setEditForm({ ...editForm, [field]: field === "id" || field === "experience" ? parseInt(value) : value });
  };

  const handleStartEdit = () => {
    setEditForm({ ...currentDriver });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const updated = drivers.map((d) =>
      d.id === editForm.id ? editForm : d
    );
    setDrivers(updated);
    localStorage.setItem("drivers", JSON.stringify(updated));
    setIsEditing(false);
  };

  const handleAddDriver = () => {
    const newId = Math.max(...drivers.map(d => d.id)) + 1;
    const newDriver = {
      id: newId,
      name: "New Driver",
      phone: "0000000000",
      experience: 0,
      busNo: "TN-00-XX-0000",
    };
    const updated = [...drivers, newDriver];
    setDrivers(updated);
    localStorage.setItem("drivers", JSON.stringify(updated));
    setSelectedId(newId);
  };

  const handleDeleteDriver = (id) => {
    if (window.confirm("Delete this driver?")) {
      const updated = drivers.filter((d) => d.id !== id);
      setDrivers(updated);
      localStorage.setItem("drivers", JSON.stringify(updated));
      if (selectedId === id) {
        setSelectedId(updated[0]?.id || 1);
      }
    }
  };

  return (
    <div
      className="card"
      onClick={!isEditing ? () => navigate("/profile") : undefined}
      style={{ cursor: isEditing ? "default" : "pointer" }}
    >
      <h3>👨‍✈️ Driver Details</h3>

      {isAdmin && (
        <div className="form-group">
          <label>Select Driver</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(parseInt(e.target.value));
                setIsEditing(false);
              }}
              style={{ flex: 1 }}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone})
                </option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddDriver();
              }}
              className="success"
            >
              ➕ Add
            </button>
          </div>
        </div>
      )}

      {currentDriver ? (
        isEditing ? (
          <div className="edit-box">
            <h4>✏️ Edit Driver</h4>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editForm.name || ""}
                onChange={(e) => handleEditChange("name", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={editForm.phone || ""}
                onChange={(e) => handleEditChange("phone", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Experience (Years)</label>
              <input
                type="number"
                value={editForm.experience || 0}
                onChange={(e) => handleEditChange("experience", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Bus No</label>
              <input
                type="text"
                value={editForm.busNo || ""}
                onChange={(e) => handleEditChange("busNo", e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                className="success"
              >
                ✓ Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className="secondary"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                height: "140px",
                background: "linear-gradient(135deg, #11479d 0%, #2e86de 100%)",
              }}
            />
            <div
              style={{
                padding: "0 28px 28px",
                marginTop: "-62px",
                display: "flex",
                alignItems: "flex-end",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              {currentDriver.image && (
                <img
                  src={currentDriver.image}
                  alt={currentDriver.name}
                  style={{
                    width: "124px",
                    height: "124px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "6px solid #ffffff",
                    background: "#ffffff",
                    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.14)",
                  }}
                />
              )}
              <div style={{ paddingBottom: "12px" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "clamp(2rem, 5vw, 3rem)",
                    lineHeight: 1,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "0.02em",
                  }}
                >
                  {currentDriver.name}
                </h2>
                <div
                  style={{
                    marginTop: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 18px",
                    borderRadius: "999px",
                    background: "#dbe4f0",
                    color: "#35527a",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  DRIVER
                </div>
              </div>
            </div>
            <div style={{ padding: "0 28px 28px" }}>
              <p>
                <strong>Phone:</strong> {currentDriver.phone}
              </p>
              <p>
                <strong>Experience:</strong> {currentDriver.experience} Years
              </p>
              <p>
                <strong>Bus No:</strong> {currentDriver.busNo}
              </p>
            </div>
            {isAdmin && (
              <div className="form-actions" style={{ margin: "0 28px 28px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit();
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDriver(currentDriver.id);
                  }}
                  className="danger"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <p>No driver data available</p>
      )}
    </div>
  );
}
