import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ProtectedRoute, RoleRoute } from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/Dashboard";
import Academic from "./pages/admin/Academic";
import Courses from "./pages/admin/Courses";
import Users from "./pages/admin/Users";
import Venues from "./pages/admin/Venues";
import GenerateTimetable from "./pages/admin/GenerateTimetable";
import Analytics from "./pages/admin/Analytics";
import Logs from "./pages/admin/Logs";

import LecturerDashboard from "./pages/lecturer/Dashboard";
import LecturerTimetable from "./pages/lecturer/Timetable";
import LecturerProfile from "./pages/lecturer/Profile";

import StudentDashboard from "./pages/student/Dashboard";
import StudentTimetable from "./pages/student/Timetable";
import StudentSearch from "./pages/student/Search";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const home = { admin: "/admin", lecturer: "/lecturer", student: "/student" }[user.role];
  return <Navigate to={home} replace />;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1e3a8a", color: "#fff", borderRadius: "12px", fontSize: "14px" },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RootRedirect />} />

          {/* ---------------- Admin ---------------- */}
          <Route element={<RoleRoute allow={["admin"]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="academic" element={<Academic />} />
              <Route path="courses" element={<Courses />} />
              <Route path="users" element={<Users />} />
              <Route path="venues" element={<Venues />} />
              <Route path="timetable" element={<GenerateTimetable />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Route>

          {/* ---------------- Lecturer ---------------- */}
          <Route element={<RoleRoute allow={["lecturer"]} />}>
            <Route path="/lecturer" element={<DashboardLayout />}>
              <Route index element={<LecturerDashboard />} />
              <Route path="timetable" element={<LecturerTimetable />} />
              <Route path="profile" element={<LecturerProfile />} />
            </Route>
          </Route>

          {/* ---------------- Student ---------------- */}
          <Route element={<RoleRoute allow={["student"]} />}>
            <Route path="/student" element={<DashboardLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="search" element={<StudentSearch />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
