import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import QrReader from "react-qr-reader";
import { CameraIcon, ClockIcon, DriverIcon } from "./Icons";

function AttendanceDriver() {
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [active, setActive] = useState(false);

  // Generate 6-digit OTP
  const generateOTP = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(newOtp);
    setTimeLeft(30);
    setActive(true);
  };

  // timer
  useEffect(() => {
    if (!active) return;

    if (timeLeft === 0) {
      setActive(false);
      setOtp("");
      alert("OTP expired.");
      return;
    }

    const timer = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, active]);

  const markAttendance = () => {
    const userId = localStorage.getItem("userId") || "driver";
    const key = "attendance";
    const raw = localStorage.getItem(key);
    const attendance = raw ? JSON.parse(raw) : {};
    const today = new Date().toISOString().slice(0, 10);

    attendance[userId] = attendance[userId] || [];
    if (!attendance[userId].includes(today)) attendance[userId].push(today);
    localStorage.setItem(key, JSON.stringify(attendance));
  };

  // Scan QR
  const handleScan = (data) => {
    if (data && active && data === otp) {
      markAttendance();
      alert("Attendance marked successfully.");
      setActive(false);
      setOtp("");
    }
  };

  const submitOtp = () => {
    if (!active) {
      alert("No active OTP. Generate one first.");
      return;
    }
    if (enteredOtp === otp) {
      markAttendance();
      alert("Attendance marked.");
      setActive(false);
      setOtp("");
      setEnteredOtp("");
    } else {
      alert("Invalid OTP.");
    }
  };

  const handleError = (err) => console.error(err);

  return (
    <div className="card attendance-card">
      <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}><DriverIcon size={22} />Driver Attendance Panel</h3>

      {!active && (
        <button onClick={generateOTP} style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
          Generate 6-Digit OTP & QR
        </button>
      )}

      {active && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <p style={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", margin: "12px 0" }}>
            OTP: {otp}
          </p>
          <p style={{ textAlign: "center", color: "#d9534f", margin: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ClockIcon size={16} color="#d9534f" />Time Left: {timeLeft} sec</span>
          </p>

          <div className="attendance-qr" style={{ textAlign: "center", padding: 12, borderRadius: 6 }}>
            <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 6 }}>
              <QRCode value={otp} size={180} />
            </div>
            <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6 }}><CameraIcon size={16} />Scan QR Code</div>
            <div style={{ width: "100%", maxWidth: 320 }}>
              <QrReader
                delay={300}
                onScan={handleScan}
                onError={handleError}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="attendance-otp" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              style={{ width: 140, textAlign: "center" }}
            />
            <button onClick={submitOtp} style={{ minWidth: 120 }}>
              Submit OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceDriver;
