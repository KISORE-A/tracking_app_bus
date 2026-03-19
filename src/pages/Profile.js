
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { updateUserProfile, getUserProfile, getBuses } from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "User",
    email: "user@example.com",
    role: "student",
    phone: "+91 98765 43210",
    id: "BIT-2026-001",
    studentId: "BIT-2026-001",
    department: "Computer Science Engineering (CSE)",
    year: "3rd Year",
    // Driver-only fields
    licenseNo: "",
    licenseCardImage: "",
    assignedBusNo: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [assignedBus, setAssignedBus] = useState(null);
  const [busLoading, setBusLoading] = useState(false);
  const licenseInputRef = useRef(null);
  const [isLicenseViewerOpen, setIsLicenseViewerOpen] = useState(false);
  const departmentOptions = [
    "Computer Science Engineering (CSE)",
    "Information Technology (IT)",
    "Mechanical Engineering (ME)",
    "Civil Engineering (CE)",
    "Electrical and Electronics Engineering (EEE)",
    "Electronics and Communication Engineering (ECE)",
    "Artificial Intelligence and Data Science (AI & DS)",
    "Artificial Intelligence and Machine Learning (AI & ML)",
    "Automobile Engineering",
    "Agricultural Engineering",
    "Mechatronics Engineering",
    "Biomedical Engineering"
  ];
  const avatarSrc =
    user?.role?.toLowerCase() === "admin"
      ? "/divya.jpeg"
      : user?.role?.toLowerCase() === "teacher"
        ? user?.email === "akshayaa@bitsathy.ac.in"
          ? "/harita.jpeg"
          : "/mam.png"
        : user?.role?.toLowerCase() === "driver"
          ? "/sabbudriver.jpeg"
        : "/kisore.png";

  const isDriver = user?.role?.toLowerCase() === "driver";

  const handleImageFile = async (file) => {
    if (!file) return;
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
    setUser((prev) => ({ ...prev, licenseCardImage: dataUrl }));
    if (licenseInputRef.current) licenseInputRef.current.value = "";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // First try to load from local storage for immediate display
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(prev => ({ ...prev, ...JSON.parse(storedUser) }));
        }

        // Then fetch latest from server
        const profileData = await getUserProfile();
        // Merge server data with default structure to ensure all fields exist
        setUser(prev => {
          const mappedStudentId =
            profileData.studentId ||
            profileData.id ||
            profileData._id ||
            prev.studentId ||
            prev.id;
          return {
            ...prev,
            ...profileData,
            // Normalize register number field names from API responses.
            studentId: mappedStudentId,
            id: mappedStudentId
          };
        });

        // Update local storage with latest
        localStorage.setItem("user", JSON.stringify(profileData));
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const loadBus = async () => {
      if (!isDriver) {
        setAssignedBus(null);
        return;
      }
      setBusLoading(true);
      try {
        const buses = await getBuses();
        const userId = user?._id || user?.id;
        const fromDriverId = Array.isArray(buses)
          ? buses.find((b) => String(b.driverId || "") === String(userId || ""))
          : null;
        const fromAssignedNo = !fromDriverId && Array.isArray(buses) && user?.assignedBusNo
          ? buses.find((b) => String(b.busNo || "") === String(user.assignedBusNo))
          : null;
        setAssignedBus(fromDriverId || fromAssignedNo || null);
      } catch (e) {
        setAssignedBus(null);
      } finally {
        setBusLoading(false);
      }
    };
    loadBus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriver, user?._id, user?.id, user?.assignedBusNo]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsLicenseViewerOpen(false);
    };
    if (isLicenseViewerOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLicenseViewerOpen]);

  const handleSave = async () => {
    try {
      // Call backend API to update user
      const response = await updateUserProfile(user);

      // Update local state and storage with response to ensure sync
      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      alert("Profile updated successfully!");

      // Optional: Trigger a window event
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile. Please try again.");
    }
  };

  const toggle2FA = async () => {
    const newState = !user.isTwoFactorEnabled;
    // Optimistic update
    setUser(prev => ({ ...prev, isTwoFactorEnabled: newState }));

    try {
      const response = await updateUserProfile({ ...user, isTwoFactorEnabled: newState });
      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert(`Two-Factor Authentication is now ${newState ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      console.error("Failed to toggle 2FA:", err);
      setUser(prev => ({ ...prev, isTwoFactorEnabled: !newState })); // Revert on failure
      alert("Failed to update 2FA settings.");
    }
  };

  return (
    <>
      <Navigation />
      <div className="profile-page-wrapper">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-cover"></div>
            <div className="profile-avatar-section">
              <div className="avatar-circle">
                <img className="avatar-image" src={avatarSrc} alt={`${user.name} profile`} />
              </div>
              <div className="profile-title">
                <h1>{user.name}</h1>
                <span className="role-badge">{user.role.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <div className="card-header">
                <h2>Personal Information</h2>
                <button
                  className={`edit-btn ${isEditing ? 'save' : ''}`}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </button>
              </div>

              <div className="info-grid">
                <div className="info-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={user.name}
                    disabled={!isEditing}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                  />
                </div>

                <div className="info-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled={!isEditing}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                  />
                </div>

                <div className="info-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={user.phone}
                    disabled={!isEditing}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  />
                </div>

                {isDriver ? (
                  <>
                    <div className="info-group">
                      <label>License Number</label>
                      <input
                        type="text"
                        value={user.licenseNo || ""}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, licenseNo: e.target.value })}
                        placeholder="e.g. TN-XXXX-XXXXXX"
                      />
                    </div>

                    <div className="info-group">
                      <label>Assigned Bus Number</label>
                      <input
                        type="text"
                        value={assignedBus?.busNo || user.assignedBusNo || (busLoading ? "Loading..." : "Not assigned")}
                        disabled
                      />
                      {!assignedBus?.busNo && isEditing && (
                        <p className="hint-text">
                          If your bus is not linked yet, admin can set it in the system.
                        </p>
                      )}
                    </div>

                    <div className="info-group info-group-span">
                      <label>License Card Image</label>
                      <div className="license-card-row">
                        <button
                          type="button"
                          className="license-card-preview license-card-preview-btn"
                          onClick={() => user.licenseCardImage && setIsLicenseViewerOpen(true)}
                          aria-label={user.licenseCardImage ? "Open license image" : "No license image"}
                          disabled={!user.licenseCardImage}
                        >
                          {user.licenseCardImage ? (
                            <img src={user.licenseCardImage} alt="License card" />
                          ) : (
                            <div className="license-card-empty">No image uploaded</div>
                          )}
                        </button>
                        <div className="license-card-actions">
                          {isEditing ? (
                            <>
                              <input
                                ref={licenseInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => handleImageFile(e.target.files?.[0])}
                              />
                              <button
                                type="button"
                                className="secondary-btn"
                                onClick={() => licenseInputRef.current?.click()}
                              >
                                {user.licenseCardImage ? "Change Image" : "Upload Image"}
                              </button>
                              {user.licenseCardImage && (
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  onClick={() => setUser((prev) => ({ ...prev, licenseCardImage: "" }))}
                                >
                                  Remove Image
                                </button>
                              )}
                            </>
                          ) : (
                            <p className="hint-text">Edit profile to upload your license card.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {isLicenseViewerOpen && user.licenseCardImage && (
                      <div
                        className="license-viewer-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-label="License image viewer"
                        onClick={() => setIsLicenseViewerOpen(false)}
                      >
                        <div className="license-viewer-content" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="license-viewer-close"
                            onClick={() => setIsLicenseViewerOpen(false)}
                            aria-label="Close"
                          >
                            ×
                          </button>
                          <img src={user.licenseCardImage} alt="License card full view" />
                        </div>
                      </div>
                    )}

                    <div className="info-group info-group-span">
                      <label>Bus Details</label>
                      <div className="bus-details-card">
                        {busLoading ? (
                          <p style={{ margin: 0, color: "#707eae" }}>Loading bus details...</p>
                        ) : assignedBus ? (
                          <div className="bus-details-grid">
                            <div>
                              <div className="label">Bus No</div>
                              <div className="value">{assignedBus.busNo}</div>
                            </div>
                            <div>
                              <div className="label">Type</div>
                              <div className="value">{assignedBus.type || "Transport"}</div>
                            </div>
                            <div>
                              <div className="label">Status</div>
                              <div className="value">{assignedBus.status || "Running"}</div>
                            </div>
                            <div>
                              <div className="label">Capacity</div>
                              <div className="value">{Number(assignedBus.capacity || 0)}</div>
                            </div>
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: "#707eae" }}>No bus assigned to this driver yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-group">
                      <label>Register Number</label>
                      <input
                        type="text"
                        value={user.studentId || user.id || "N/A"}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, studentId: e.target.value, id: e.target.value })}
                      />
                    </div>

                    <div className="info-group">
                      <label>Department</label>
                      <select
                        value={user.department || ""}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, department: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="info-group">
                      <label>Year / Designation</label>
                      <input type="text" value={user.year} disabled={!isEditing} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="profile-card">
              <h2>Account Settings</h2>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Push Notifications</h4>
                  <p>Receive updates about bus location and attendance</p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Email Alerts</h4>
                  <p>Receive daily route summaries via email</p>
                </div>
                <label className="switch">
                  <input type="checkbox" />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <button
                  className={`secondary-btn ${user.isTwoFactorEnabled ? 'enabled' : ''}`}
                  onClick={toggle2FA}
                  style={{
                    background: user.isTwoFactorEnabled ? '#48bb78' : '#edf2f7',
                    color: user.isTwoFactorEnabled ? 'white' : '#2d3748'
                  }}
                >
                  {user.isTwoFactorEnabled ? "Enabled" : "Enable"}
                </button>
              </div>

              <div className="setting-item danger-zone">
                <button className="danger-btn">Delete Account</button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .profile-page-wrapper {
            padding-top: 80px;
            min-height: 100vh;
            background-color: var(--background-color);
            display: flex;
            justify-content: center;
          }
          .profile-container {
            width: 100%;
            max-width: 1000px;
            padding: 20px;
          }
          .profile-header {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            position: relative;
          }
          .profile-cover {
            height: 150px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          }
          .profile-avatar-section {
            padding: 0 30px 30px;
            margin-top: -50px;
            display: flex;
            align-items: flex-end;
            gap: 20px;
          }
          .avatar-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: white;
            border: 4px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: bold;
            color: var(--primary-color);
            overflow: hidden;
          }
          .avatar-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .profile-title h1 {
            margin: 0;
            color: var(--text-dark);
            font-size: 2rem;
          }
          .role-badge {
            display: inline-block;
            background: #e2e8f0;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            color: #4a5568;
            margin-top: 5px;
          }
          
          .profile-content {
            display: grid;
            gap: 2rem;
          }
          .profile-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
          }
          .edit-btn {
            background: transparent;
            border: 1px solid var(--primary-color);
            color: var(--primary-color);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          }
          .edit-btn:hover {
            background: var(--primary-color-light);
          }
          .edit-btn.save {
            background: var(--primary-color);
            color: white;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
          }
          .info-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .info-group label {
            font-weight: 600;
            color: #718096;
            font-size: 0.9rem;
          }
          .info-group input {
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s;
          }
          .info-group select {
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.2s;
            background: white;
          }
          .info-group input:focus {
            border-color: var(--primary-color);
            outline: none;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
          }
          .info-group select:focus {
            border-color: var(--primary-color);
            outline: none;
            box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
          }
          .info-group input:disabled {
            background: #f7fafc;
            color: #4a5568;
          }
          .info-group select:disabled {
            background: #f7fafc;
            color: #4a5568;
          }

          .info-group-span {
            grid-column: 1 / -1;
          }

          .hint-text {
            margin: 6px 0 0 0;
            font-size: 0.85rem;
            color: #94a3b8;
          }

          .license-card-row {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 14px;
            align-items: start;
          }

          .license-card-preview {
            border: 1px solid #e4eaff;
            background: #f7f9ff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 24px rgba(14, 24, 75, 0.08);
            min-height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .license-card-preview-btn {
            width: 100%;
            padding: 0;
            border: none;
            cursor: pointer;
          }

          .license-card-preview-btn:disabled {
            cursor: not-allowed;
            opacity: 0.9;
          }

          .license-card-preview img {
            width: 100%;
            height: 160px;
            object-fit: cover;
            display: block;
          }

          .license-card-empty {
            padding: 16px;
            font-weight: 700;
            color: #2b3674;
          }

          .license-card-actions input[type="file"] {
            margin-bottom: 10px;
          }

          .license-viewer-overlay {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.72);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            z-index: 9999;
          }

          .license-viewer-content {
            position: relative;
            width: min(980px, 96vw);
            max-height: 88vh;
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid rgba(226, 232, 240, 0.25);
            box-shadow: 0 26px 70px rgba(0, 0, 0, 0.45);
            background: #0b1b3a;
          }

          .license-viewer-content img {
            width: 100%;
            height: 100%;
            max-height: 88vh;
            object-fit: contain;
            display: block;
            background: #0b1b3a;
          }

          .license-viewer-close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 38px;
            height: 38px;
            border-radius: 999px;
            border: none;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.92);
            color: #0f172a;
            font-size: 22px;
            font-weight: 900;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .bus-details-card {
            border: 1px solid #e4eaff;
            background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
            border-radius: 16px;
            padding: 14px 14px;
            box-shadow: 0 10px 26px rgba(14, 24, 75, 0.08);
          }

          .bus-details-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .bus-details-grid .label {
            color: #94a3b8;
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.6px;
            margin-bottom: 4px;
          }

          .bus-details-grid .value {
            color: #0f172a;
            font-weight: 800;
            font-size: 1rem;
          }

          .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .setting-item:last-child {
            border-bottom: none;
          }
          .setting-info h4 {
            margin: 0 0 5px 0;
            color: var(--text-dark);
          }
          .setting-info p {
            margin: 0;
            color: #a0aec0;
            font-size: 0.9rem;
          }

          /* Toggle Switch */
          .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 28px;
          }
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
          }
          .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
          }
          input:checked + .slider {
            background-color: var(--primary-color);
          }
          input:checked + .slider:before {
            transform: translateX(22px);
          }
          .slider.round {
            border-radius: 34px;
          }
          .slider.round:before {
            border-radius: 50%;
          }

          .secondary-btn {
            background: #edf2f7;
            color: #2d3748;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
          }
          .danger-btn {
            background: #fff5f5;
            color: #c53030;
            border: 1px solid #c53030;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
          }
          .danger-btn:hover {
            background: #c53030;
            color: white;
          }

          @media (max-width: 600px) {
            .profile-avatar-section {
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            .avatar-circle {
              margin-bottom: 10px;
            }
            .card-header {
              flex-direction: column;
              gap: 15px;
            }
            .edit-btn {
              width: 100%;
            }
            .license-card-row {
              grid-template-columns: 1fr;
            }
            .bus-details-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
        `}</style>
      </div>
    </>
  );
}
