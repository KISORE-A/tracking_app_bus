import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BusIcon, CheckIcon, CloseIcon, EditIcon } from "./Icons";

const defaultBus = {
  busNo: "TN-23-AB-1234",
  type: "College Transport",
  status: "Running",
};

export default function BusInfo() {
  const navigate = useNavigate();
  const [bus, setBus] = useState(defaultBus);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const role = localStorage.getItem("role");
  const canEdit = role === "Driver" || role === "Admin";

  useEffect(() => {
    const saved = localStorage.getItem("busInfo");
    if (saved) {
      setBus(JSON.parse(saved));
    }
  }, []);

  const handleEditChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleStartEdit = () => {
    setEditForm({ ...bus });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setBus(editForm);
    localStorage.setItem("busInfo", JSON.stringify(editForm));
    setIsEditing(false);
  };

  return (
    <div
      className="card"
      onClick={!isEditing ? () => navigate("/profile") : undefined}
      style={{ cursor: isEditing ? "default" : "pointer" }}
    >
      <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}><BusIcon size={22} />Bus Information</h3>
      {isEditing ? (
        <div className="edit-box">
          <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}><EditIcon size={18} />Edit Bus</h4>
          <div className="form-group">
            <label>Bus No</label>
            <input
              type="text"
              value={editForm.busNo || ""}
              onChange={(e) => handleEditChange("busNo", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Bus Type</label>
            <input
              type="text"
              value={editForm.type || ""}
              onChange={(e) => handleEditChange("type", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={editForm.status || ""}
              onChange={(e) => handleEditChange("status", e.target.value)}
            >
              <option value="Running">Running</option>
              <option value="Stopped">Stopped</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div className="form-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              className="success"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckIcon size={16} />Save</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
              }}
              className="secondary"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CloseIcon size={16} />Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>
            <strong>Bus No:</strong> {bus.busNo}
          </p>
          <p>
            <strong>Bus Type:</strong> {bus.type}
          </p>
          <p>
            <strong>Status:</strong> {bus.status}
          </p>
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
              style={{ width: "100%", marginTop: "8px" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><EditIcon size={16} />Edit</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
