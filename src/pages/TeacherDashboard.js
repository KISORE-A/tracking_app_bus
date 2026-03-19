import Navigation from "../components/Navigation";
import BusInfo from "../components/BusInfo";
import RouteInfo from "../components/RouteInfo";
import DriverInfo from "../components/DriverInfo";
import MapSection from "../components/MapSection";
import Notifications from "../components/Notifications";
import MarkStudentAttendance from "../components/MarkStudentAttendance";
import WeatherInfo from "../components/WeatherInfo";
import FeedbackPanel from "../components/FeedbackPanel";

export default function TeacherDashboard() {
    return (
        <>
            <Navigation />
            <div className="dashboard-wrapper dashboard-wrapper--wide" id="top">
                <div className="dashboard">
                    <div id="map-section" className="map-card"><MapSection /></div>

                    <div className="dashboard-tri-row" id="profile-section">
                        <BusInfo />
                        <div id="route-section"><RouteInfo /></div>
                        <DriverInfo />
                    </div>

                    <div id="notification-section">
                        <Notifications />
                    </div>

                    <div id="attendance-section" style={{ marginTop: "1rem", gridColumn: "1 / -1", width: "100%" }}>
                        <MarkStudentAttendance />
                    </div>

                    <div style={{ marginTop: "1rem", gridColumn: "1 / -1", width: "100%" }}>
                        <WeatherInfo allowEdit={false} coloredHeader />
                    </div>

                    <div className="card teacher-gradient-card" style={{ padding: "1.5rem", marginTop: "1rem", gridColumn: "1 / -1", width: "100%" }}>
                        <div className="teacher-gradient-header">
                            <h3 style={{ color: "white", margin: 0, border: "none", padding: 0 }}>📋 Student Leave Approvals</h3>
                        </div>
                        <p style={{ color: "#707eae" }}>Approve or reject student leave requests.</p>
                        <a href="/teacher/leaves" className="primary" style={{ display: "inline-block", padding: "10px 16px", textDecoration: "none" }}>
                            Open Leave Approvals
                        </a>
                    </div>
                    <FeedbackPanel />


                </div>
            </div>
        </>
    );
}
