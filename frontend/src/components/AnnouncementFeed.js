import React, { useState, useEffect } from "react";
import { AnnouncementIcon } from "./Icons";

export default function AnnouncementFeed() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMsg, setNewMsg] = useState("");

    useEffect(() => {
        // Mock data
        const mockAnnouncements = [
            { id: 1, title: "School Trip", content: "Bus 12 will depart 30 mins early tomorrow.", date: "2026-03-16", author: "Admin" },
            { id: 2, title: "Maintenance", content: "Bus 05 is undergoing repairs. Backup bus provided.", date: "2026-03-15", author: "Transport Mgr" },
        ];
        setTimeout(() => {
            setAnnouncements(mockAnnouncements);
            setLoading(false);
        }, 600);
    }, []);

    const handleSend = () => {
        if (!newMsg) return;
        const newAnn = {
            id: Date.now(),
            title: "Urgent Update",
            content: newMsg,
            date: new Date().toISOString().slice(0, 10),
            author: "Admin"
        };
        setAnnouncements([newAnn, ...announcements]);
        setNewMsg("");
    };

    if (loading) return <div className="card" style={{ minHeight: "450px", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Announcements...</div>;

    return (
        <div className="card" style={{ minHeight: "450px", padding: "1.5rem", textAlign: "left" }}>
            <h3 style={{ color: "#8a5a00", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}><AnnouncementIcon size={22} color="#8a5a00" />Global Announcements</h3>
            
            <div style={{ marginBottom: "2rem", display: "flex", gap: "10px" }}>
                <input 
                    type="text" 
                    placeholder="Type broadcast message..." 
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    style={{ 
                        flex: 1, padding: "12px 16px", borderRadius: "12px", 
                        border: "1px solid #edf2f7", fontSize: "0.9rem" 
                    }} 
                />
                <button 
                    onClick={handleSend}
                    style={{ 
                        padding: "10px 25px", borderRadius: "12px", border: "none",
                        background: "linear-gradient(135deg, #d89a10 0%, #f4bf32 100%)",
                        color: "white", fontWeight: "bold", cursor: "pointer"
                    }}
                >
                    Send
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {announcements.map((a) => (
                    <div key={a.id} style={{ 
                        padding: "1rem", borderRadius: "14px", 
                        background: "#f4f7fe", border: "1px solid #edf2f7"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontWeight: "700", color: "#8a5a00" }}>{a.title}</span>
                            <span style={{ fontSize: "0.75rem", color: "#a3aed0" }}>{a.date}</span>
                        </div>
                        <p style={{ margin: 0, color: "#707eae", fontSize: "0.9rem" }}>{a.content}</p>
                        <div style={{ marginTop: "8px", fontSize: "0.7rem", color: "#d89a10", fontWeight: "600" }}>By {a.author}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

