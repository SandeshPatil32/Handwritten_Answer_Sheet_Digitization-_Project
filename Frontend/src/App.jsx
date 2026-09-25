import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Home from "./pages/Home";
import StudentLogin from "./pages/student/StudentLogin";
import StudentSignup from "./pages/student/StudentSignup";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherLogin from "./pages/teacher/TeacherLogin";
import TeacherSignup from "./pages/teacher/TeacherSignup";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

function ProtectedRoute({ role }) {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/${role}/login`} replace state={{ from: location.pathname }} />;
  }

  if (user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
}

function AppShell() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/signup" element={<StudentSignup />} />

        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/signup" element={<TeacherSignup />} />
        <Route element={<ProtectedRoute role="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return <AppShell />;
}
