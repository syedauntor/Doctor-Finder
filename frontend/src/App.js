import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import DoctorDetail from "./pages/DoctorDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Category from "./pages/Category";
import BookAppointment from "./pages/BookAppointment";

import DoctorLogin from "./pages/DoctorLogin";
import DoctorRegistration from "./pages/DoctorRegistration";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfileEdit from "./pages/DoctorProfileEdit";
import AvailabilityManagement from "./pages/AvailabilityManagement";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }
  if (!user) return <Navigate to={role === "admin" ? "/admin/login" : "/doctor/login"} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/category" element={<Category />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/book/:doctorId" element={<BookAppointment />} />

          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/doctor/register" element={<DoctorRegistration />} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/profile" element={<ProtectedRoute role="doctor"><DoctorProfileEdit /></ProtectedRoute>} />
          <Route path="/doctor/availability" element={<ProtectedRoute role="doctor"><AvailabilityManagement /></ProtectedRoute>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
