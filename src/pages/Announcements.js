import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { getAnnouncements, createAnnouncement, deleteAnnouncement, getAllUsers, getStudents, getTeachers, getDrivers } from "../services/api";
import {
    AnnouncementIcon,
    CalendarIcon,
    CheckIcon,
    CloseIcon,
    EditIcon,
    EmergencyIcon,
    GlobeIcon,
    HolidayIcon,
    PlusIcon,
    RouteIcon,
    TrashIcon,
    WalletIcon
} from "../components/Icons";

const iconText = { display: "inline-flex", alignItems: "center", gap: "8px" };

const CATEGORY_CONFIG = {
    general: { icon: <AnnouncementIcon size={16} />, color: "#d89a10", bg: "rgba(67, 24, 255, 0.08)", label: "General" },
    emergency: { icon: <EmergencyIcon size={16} />, color: "#EE5D50", bg: "rgba(238, 93, 80, 0.08)", label: "Emergency" },
    route_change: { icon: <RouteIcon size={16} />, color: "#F76B1C", bg: "rgba(247, 107, 28, 0.08)", label: "Route Change" },
    delay: { icon: <CalendarIcon size={16} />, color: "#FFB547", bg: "rgba(255, 181, 71, 0.08)", label: "Delay" },
    holiday: { icon: <HolidayIcon size={16} />, color: "#05CD99", bg: "rgba(5, 205, 153, 0.08)", label: "Holiday" },
    fee_reminder: { icon: <WalletIcon size={16} />, color: "#f4bf32", bg: "rgba(59, 113, 254, 0.08)", label: "Fee Reminder" },
};

const PRIORITY_CONFIG = {
    low: { color: "#05CD99", bg: "rgba(5, 205, 153, 0.15)", label: "Low" },
    medium: { color: "#FFB547", bg: "rgba(255, 181, 71, 0.15)", label: "Medium" },
    high: { color: "#F76B1C", bg: "rgba(247, 107, 28, 0.15)", label: "High" },
    urgent: { color: "#EE5D50", bg: "rgba(238, 93, 80, 0.15)", label: "Urgent" },
};

const WhatsAppIcon = ({ size = 20 }) => (
    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width={size} height={size} />
);

const GmailIcon = ({ size = 18 }) => (
    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" width={size} height={size} />
);

export default function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [shareModal, setShareModal] = useState(null);
    const [form, setForm] = useState({
        title: "", message: "", category: "general",
        targetAudience: "all", priority: "medium"
    });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin";

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const data = await getAnnouncements();
            setAnnouncements(data);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) return;
        setSubmitting(true);
        try {
            const newAnnouncement = await createAnnouncement({
                ...form,
                createdByName: user.name || "Admin"
            });
            setForm({ title: "", message: "", category: "general", targetAudience: "all", priority: "medium" });
            setShowForm(false);
            fetchAnnouncements();

            // After creating, automatically prompt to share
            if(window.confirm("Announcement created! Would you like to share it via WhatsApp now?")) {
                 askToShare(newAnnouncement, 'whatsapp');
            }
        } catch (err) {
            alert(err?.message || "Failed to create announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await deleteAnnouncement(id);
            setAnnouncements(announcements.filter(a => a._id !== id));
        } catch (err) {
            alert(err?.message || "Failed to delete announcement");
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // ========== SHARE FUNCTIONALITY ==========
    const askToShare = (announcement, type) => {
        setShareModal({ type, announcement });
    };

    const confirmShare = async () => {
        const ann = shareModal.announcement;
        
        if (shareModal.type === 'whatsapp') {
            const text = `Akshuu Transports Announcement\n\n${ann.title}\n${ann.message}\n\nTarget: ${ann.targetAudience}`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
            setShareModal(null);
        } else if (shareModal.type === 'email') {
            try {
                let emails = [];
                if (ann.targetAudience === 'all') {
                    const allUsers = await getAllUsers();
                    emails = allUsers.map(u => u.email).filter(Boolean);
                } else if (ann.targetAudience === 'students' || ann.targetAudience === 'student') {
                    const students = await getStudents();
                    emails = students.map(u => u.email).filter(Boolean);
                } else if (ann.targetAudience === 'teachers' || ann.targetAudience === 'teacher') {
                    const teachers = await getTeachers();
                    emails = teachers.map(u => u.email).filter(Boolean);
                } else if (ann.targetAudience === 'drivers' || ann.targetAudience === 'driver') {
                    const drivers = await getDrivers();
                    emails = drivers.map(u => u.email).filter(Boolean);
                }

                if (emails.length === 0) {
                    alert("No valid email addresses found for the target audience.");
                    setShareModal(null);
                    return;
                }

                const bcc = emails.join(',');
                const subject = `[Akshuu Transports] ${ann.title}`;
                const body = `Dear Users,\n\n${ann.message}\n\nRegards,\nAkshuu Transports`;
                
                // Keep 'To' empty, use BCC so users don't see everyone else's email.
                window.location.href = `mailto:?bcc=${bcc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                setShareModal(null);
            } catch (err) {
                console.error(err);
                alert("Failed to fetch users for email broadcast");
                setShareModal(null);
            }
        }
    };

    // ========== STYLES ==========
    const cardStyle = {
        background: "var(--card-bg, white)",
        borderRadius: "20px",
        padding: "1.5rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid var(--border-color, rgba(0,0,0,0.05))",
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1px solid var(--border-color, #e2e8f0)",
        fontSize: "0.95rem",
        background: "var(--background-light, #f4f7fe)",
        color: "var(--text-dark, #8a5a00)",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        marginBottom: "1rem",
        boxSizing: "border-box",
    };

    const modalOverlay = { 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', zIndex: 1000 
    };

    return (
        <>
            <Navigation />
            <div style={{ background: "var(--background-light, #f4f7fe)", minHeight: "100vh", padding: "2rem" }}>
                <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                        <div>
                            <h2 style={{ color: "var(--text-dark, #8a5a00)", fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={iconText}><AnnouncementIcon size={24} color="var(--text-dark, #8a5a00)" />Announcements</span>
                            </h2>
                            <p style={{ color: "var(--text-light, #707eae)", fontSize: "1rem", margin: "0.25rem 0 0" }}>
                                {isAdmin ? "Broadcast messages to your transport network" : "Stay updated with latest announcements"}
                            </p>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setShowForm(!showForm)}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "50px",
                                    border: "none",
                                    background: showForm ? "var(--card-bg, white)" : "linear-gradient(135deg, #d89a10, #f4bf32)",
                                    color: showForm ? "var(--text-dark, #8a5a00)" : "white",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    cursor: "pointer",
                                    boxShadow: showForm ? "0 2px 8px rgba(0,0,0,0.08)" : "0 4px 15px rgba(67, 24, 255, 0.3)",
                                    transition: "all 0.3s ease",
                                    display: "flex", alignItems: "center", gap: "8px",
                                }}
                            >
                                {showForm ? <span style={iconText}><CloseIcon size={16} />Cancel</span> : <span style={iconText}><PlusIcon size={16} />New Announcement</span>}
                            </button>
                        )}
                    </div>

                    {/* Create Form */}
                    {showForm && isAdmin && (
                        <div style={{
                            ...cardStyle,
                            marginBottom: "2rem",
                            animation: "slideDown 0.3s ease",
                            border: "2px solid rgba(67, 24, 255, 0.15)",
                        }}>
                            <h3 style={{ color: "var(--text-dark, #8a5a00)", marginBottom: "1.25rem", fontSize: "1.2rem" }}>
                                <span style={iconText}><EditIcon size={18} color="var(--text-dark, #8a5a00)" />Create Announcement</span>
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    placeholder="Announcement Title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => { e.target.style.borderColor = "#d89a10"; e.target.style.boxShadow = "0 0 0 3px rgba(67,24,255,0.1)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "var(--border-color, #e2e8f0)"; e.target.style.boxShadow = "none"; }}
                                />
                                <textarea
                                    placeholder="Write your announcement message here..."
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    required
                                    rows={4}
                                    style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                                    onFocus={(e) => { e.target.style.borderColor = "#d89a10"; e.target.style.boxShadow = "0 0 0 3px rgba(67,24,255,0.1)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "var(--border-color, #e2e8f0)"; e.target.style.boxShadow = "none"; }}
                                />

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light, #707eae)", marginBottom: "6px" }}>Category</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            style={{ ...inputStyle, marginBottom: 0, cursor: "pointer" }}
                                        >
                                            {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light, #707eae)", marginBottom: "6px" }}>Target Audience</label>
                                        <select
                                            value={form.targetAudience}
                                            onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                                            style={{ ...inputStyle, marginBottom: 0, cursor: "pointer" }}
                                        >
                                            <option value="all">Everyone</option>
                                            <option value="students">Students Only</option>
                                            <option value="teachers">Teachers Only</option>
                                            <option value="drivers">Drivers Only</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-light, #707eae)", marginBottom: "6px" }}>Priority</label>
                                        <select
                                            value={form.priority}
                                            onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                            style={{ ...inputStyle, marginBottom: 0, cursor: "pointer" }}
                                        >
                                            {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        width: "100%",
                                        padding: "14px",
                                        borderRadius: "12px",
                                        border: "none",
                                        background: "linear-gradient(135deg, #d89a10, #f4bf32)",
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: "1rem",
                                        cursor: submitting ? "not-allowed" : "pointer",
                                        opacity: submitting ? 0.7 : 1,
                                        transition: "all 0.3s ease",
                                        boxShadow: "0 4px 15px rgba(67, 24, 255, 0.3)",
                                    }}
                                >
                                    {submitting ? "Publishing..." : "Publish Announcement"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Announcements List */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem 0" }}>
                            <div style={{
                                width: "50px", height: "50px", border: "4px solid #e2e8f0",
                                borderTop: "4px solid #d89a10", borderRadius: "50%",
                                animation: "spin 1s linear infinite", margin: "0 auto 20px"
                            }} />
                            <p style={{ color: "var(--text-light, #707eae)" }}>Loading announcements...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div style={{ ...cardStyle, textAlign: "center", padding: "4rem 2rem" }}>
                            <div style={{ fontSize: "4rem", marginBottom: "1rem", display: "flex", justifyContent: "center" }}><AnnouncementIcon size={48} color="#d89a10" /></div>
                            <h3 style={{ color: "var(--text-dark, #8a5a00)", margin: "0 0 0.5rem" }}>No Announcements Yet</h3>
                            <p style={{ color: "var(--text-light, #707eae)", margin: 0 }}>
                                {isAdmin ? "Create your first announcement to broadcast to your network!" : "No announcements to show at this time."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {announcements.map((ann, idx) => {
                                const cat = CATEGORY_CONFIG[ann.category] || CATEGORY_CONFIG.general;
                                const pri = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.medium;
                                return (
                                    <div
                                        key={ann._id || idx}
                                        style={{
                                            ...cardStyle,
                                            animation: `fadeInUp 0.4s ease ${idx * 0.08}s both`,
                                            borderLeft: `4px solid ${cat.color}`,
                                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.1)"; }}
                                        onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
                                    >
                                        {/* Top row: category badge + priority + time + actions */}
                                        <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                                <span style={{
                                                    padding: "5px 12px", borderRadius: "50px",
                                                    background: cat.bg, color: cat.color,
                                                    fontWeight: 600, fontSize: "0.8rem",
                                                    display: "flex", alignItems: "center", gap: "5px",
                                                }}>
                                                    {cat.icon} {cat.label}
                                                </span>
                                                <span style={{
                                                    padding: "5px 12px", borderRadius: "50px",
                                                    background: pri.bg, color: pri.color,
                                                    fontWeight: 600, fontSize: "0.75rem",
                                                    textTransform: "uppercase", letterSpacing: "0.5px",
                                                }}>
                                                    {pri.label}
                                                </span>
                                                {ann.targetAudience !== "all" && (
                                                    <span style={{
                                                        padding: "5px 10px", borderRadius: "50px",
                                                        background: "var(--background-light, #f4f7fe)",
                                                        color: "var(--text-light, #707eae)",
                                                        fontWeight: 600, fontSize: "0.75rem",
                                                    }}>
                                                        <span style={iconText}><GlobeIcon size={14} />{ann.targetAudience}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontSize: "0.8rem", color: "var(--text-light, #707eae)" }}>
                                                    <span style={iconText}><CalendarIcon size={14} />{getTimeAgo(ann.createdAt)}</span>
                                                </span>
                                                
                                                {isAdmin && (
                                                    <>
                                                        {/* Share Action Buttons added specifically pointing to WhatsApp / Email Broadcast */}
                                                        <button
                                                            onClick={() => askToShare(ann, 'whatsapp')}
                                                            title="Broadcast via WhatsApp"
                                                            style={{
                                                                background: '#e6f8ec', border: 'none', borderRadius: '8px',
                                                                padding: '6px 10px', cursor: 'pointer',
                                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                                                            }}
                                                        ><WhatsAppIcon size={20} /></button>
                                                        <button
                                                            onClick={() => askToShare(ann, 'email')}
                                                            title="Broadcast via Email"
                                                            style={{
                                                                background: '#fce8e6', border: 'none', borderRadius: '8px',
                                                                padding: '8px 10px', cursor: 'pointer',
                                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                                                            }}
                                                        ><GmailIcon size={16} /></button>
                                                        
                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDelete(ann._id)}
                                                            title="Delete"
                                                            style={{
                                                                background: "rgba(238, 93, 80, 0.1)",
                                                                border: "none",
                                                                color: "#EE5D50",
                                                                padding: "6px 12px",
                                                                borderRadius: "8px",
                                                                cursor: "pointer",
                                                                fontSize: "0.8rem",
                                                                fontWeight: 600,
                                                                marginLeft: "5px",
                                                            }}
                                                        >
                                                            <span style={iconText}><TrashIcon size={14} />Delete</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 style={{
                                            color: "var(--text-dark, #8a5a00)",
                                            fontSize: "1.15rem",
                                            fontWeight: 700,
                                            margin: "0 0 8px",
                                            display: "block",
                                        }}>
                                            {ann.title}
                                        </h3>

                                        {/* Message */}
                                        <p style={{
                                            color: "var(--text-light, #707eae)",
                                            fontSize: "0.95rem",
                                            lineHeight: 1.6,
                                            margin: "0 0 10px",
                                            whiteSpace: "pre-wrap",
                                        }}>
                                            {ann.message}
                                        </p>

                                        {/* Footer */}
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-light, #707eae)", opacity: 0.7 }}>
                                            — {ann.createdByName || "Admin"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ========== BROADCAST CONFIRMATION MODAL ========== */}
            {shareModal && (
                <div style={modalOverlay}>
                    <div className="card" style={{ width: '480px', padding: '2rem', position: 'relative', background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <button onClick={() => setShareModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#a3aed0' }}><CloseIcon size={18} /></button>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                {shareModal.type === 'whatsapp' ? <WhatsAppIcon size={50} /> : <GmailIcon size={44} />}
                            </div>
                            <h3 style={{ color: '#8a5a00', margin: 0 }}>
                                Broadcast via {shareModal.type === 'whatsapp' ? 'WhatsApp' : 'Email'}?
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: '#707eae', marginTop: '5px' }}>
                                Target Audience: <strong>{shareModal.announcement.targetAudience.toUpperCase()}</strong>
                            </p>
                        </div>

                        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '12px', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: '600', color: '#92400e', margin: '0 0 5px 0' }}>Preview Content:</p>
                            <p style={{ 
                                fontSize: '0.85rem', color: '#78350f', margin: 0, 
                                whiteSpace: 'pre-line', lineHeight: '1.4', 
                                maxHeight: '120px', overflowY: 'auto' 
                            }}>
                                <strong>{shareModal.announcement.title}</strong><br/><br/>
                                {shareModal.announcement.message}
                            </p>
                        </div>

                        {shareModal.type === 'whatsapp' && (
                            <p style={{ fontSize: '0.8rem', color: '#a3aed0', textAlign: 'center', marginBottom: '1rem' }}>
                                This will open WhatsApp where you can select multiple contacts or groups to forward this message.
                            </p>
                        )}

                        {shareModal.type === 'email' && (
                            <p style={{ fontSize: '0.8rem', color: '#a3aed0', textAlign: 'center', marginBottom: '1rem' }}>
                                This will open your default email client and BCC all valid users under the target audience.
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={confirmShare} style={{
                                flex: 1, padding: '12px', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', color: 'white', fontSize: '0.9rem',
                                background: shareModal.type === 'whatsapp' ? '#25D366' : '#EA4335'
                            }}>
                                <span style={iconText}><CheckIcon size={16} />Pre-fill & Broadcast</span>
                            </button>
                            <button onClick={() => setShareModal(null)} style={{
                                flex: 1, padding: '12px', fontWeight: 'bold', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', color: '#707eae', background: 'white', fontSize: '0.9rem'
                            }}>
                                <span style={iconText}><CloseIcon size={16} />Cancel</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(15px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                  form > div { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </>
    );
}


