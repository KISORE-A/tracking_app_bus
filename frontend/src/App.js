import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import StudentDashboard from "./pages/StudentDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import EmergencySupport from "./pages/EmergencySupport";
import TermsPrivacy from "./pages/TermsPrivacy";
import Profile from "./pages/Profile";

// Admin Sub Pages
import ManageBuses from "./pages/ManageBuses";
import ManageStudents from "./pages/ManageStudents";
import ManageTeachers from "./pages/ManageTeachers";
import ManageDrivers from "./pages/ManageDrivers";
import FinanceDashboard from "./pages/FinanceDashboard";
import AddBus from "./pages/AddBus";
import AddStudent from "./pages/AddStudent";
import AddTeacher from "./pages/AddTeacher";
import AddDriver from "./pages/AddDriver";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Announcements from "./pages/Announcements";
import DamageReports from "./pages/DamageReports";
import DriverDamageReports from "./pages/DriverDamageReports";
import DriverDamageReportsHub from "./pages/DriverDamageReportsHub";
import DriverDamageReportView from "./pages/DriverDamageReportView";
import LeaveSummary from "./pages/LeaveSummary";
import StudentLeavePage from "./pages/StudentLeavePage";
import TeacherLeaveApproval from "./pages/TeacherLeaveApproval";
import AdminLeaveList from "./pages/AdminLeaveList";
import AdminFeedback from "./pages/AdminFeedback";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/damages" element={<DriverDamageReportsHub />} />
        <Route path="/driver/damages/status/:status" element={<DriverDamageReportsHub />} />
        <Route path="/driver/damages/new" element={<DriverDamageReports />} />
        <Route path="/driver/damages/:id" element={<DriverDamageReportView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/leaves" element={<TeacherLeaveApproval />} />
        <Route path="/emergency" element={<EmergencySupport />} />
        <Route path="/terms-privacy" element={<TermsPrivacy />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin Sub Pages */}
        <Route path="/admin/buses" element={<ManageBuses />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/teachers" element={<ManageTeachers />} />
        <Route path="/admin/drivers" element={<ManageDrivers />} />
        <Route path="/admin/finance" element={<FinanceDashboard />} />
        <Route path="/admin/buses/add" element={<AddBus />} />
        <Route path="/admin/students/add" element={<AddStudent />} />
        <Route path="/admin/teachers/add" element={<AddTeacher />} />
        <Route path="/admin/drivers/add" element={<AddDriver />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        <Route path="/admin/announcements" element={<Announcements />} />
        <Route path="/admin/damages" element={<DamageReports />} />
        <Route path="/admin/leaves" element={<LeaveSummary />} />
        <Route path="/admin/leaves/teachers" element={<AdminLeaveList role="teacher" />} />
        <Route path="/admin/leaves/drivers" element={<AdminLeaveList role="driver" />} />
        <Route path="/admin/leaves/students" element={<AdminLeaveList role="student" />} />
        <Route path="/student/leaves" element={<StudentLeavePage />} />
        <Route path="/admin/feedback" element={<AdminFeedback />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
