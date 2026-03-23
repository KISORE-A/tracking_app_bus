import React, { useState } from "react";
import QrReader from "react-qr-reader";
import { verifyAttendanceOtp } from "../services/api";
import { CameraIcon, StudentIcon } from "./Icons";

function AttendanceStudent() {
  const [enteredOtp, setEnteredOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const getStudentId = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr).id : null;
  };

  const handleAttendance = async (code) => {
    setLoading(true);
    try {
      await verifyAttendanceOtp(code);
      alert("Attendance marked successfully.");
    } catch (err) {
      alert("OTP verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = () => {
    if (enteredOtp.length !== 6) {
      alert("Enter a valid 6-digit OTP.");
      return;
    }
    handleAttendance(enteredOtp);
  };

  const handleScan = (data) => {
    if (data) {
      handleAttendance(String(data).trim());
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div className="card attendance-card">
      <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}><StudentIcon size={22} />Student Attendance</h3>

      <div className="attendance-qr" style={{ marginBottom: 12 }}>
        <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}><CameraIcon size={18} />Scan QR Code</h4>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <QrReader
            delay={300}
            onScan={handleScan}
            onError={handleError}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div className="attendance-otp">
        <h4>OR Enter OTP</h4>
        <div className="otp-input-group">
          <input
            type="text"
            maxLength="6"
            value={enteredOtp}
            onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit Code"
            style={{ marginBottom: 0 }}
          />
          <button onClick={submitOTP} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? "..." : "Verify OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceStudent;
