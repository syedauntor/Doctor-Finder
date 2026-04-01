import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DoctorDetail from './pages/DoctorDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Category from './pages/Category';
import DoctorRegistration from './pages/DoctorRegistration';
import DoctorLogin from './pages/DoctorLogin';
import DoctorDashboard from './pages/DoctorDashboard';
import BookAppointment from './pages/BookAppointment';
import AvailabilityManagement from './pages/AvailabilityManagement';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<{ type: string; value: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');

    if (page) {
      setCurrentPage(page);

      if (page === 'book-appointment') {
        const doctor = params.get('doctor');
        if (doctor) {
          setSelectedDoctorId(doctor);
        }
      }
    }
  }, []);

  const handleNavigate = (page: string, doctorId?: string, filter?: { type: string; value: string }) => {
    setCurrentPage(page);
    if (doctorId) {
      setSelectedDoctorId(doctorId);
    }
    if (filter) {
      setCategoryFilter(filter);
    }
    window.scrollTo(0, 0);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}

        {currentPage === 'doctor' && selectedDoctorId && (
          <DoctorDetail doctorId={selectedDoctorId} onNavigate={handleNavigate} />
        )}

        {currentPage === 'category' && categoryFilter && (
          <Category filter={categoryFilter} onNavigate={handleNavigate} />
        )}

        {currentPage === 'about' && <About />}

        {currentPage === 'contact' && <Contact />}

        {currentPage === 'doctor-registration' && <DoctorRegistration />}

        {currentPage === 'doctor-login' && <DoctorLogin />}

        {currentPage === 'dashboard' && <DoctorDashboard />}

        {currentPage === 'book-appointment' && <BookAppointment doctorId={selectedDoctorId} />}

        {currentPage === 'availability' && <AvailabilityManagement />}

        {currentPage === 'admin-login' && <AdminLogin onNavigate={handleNavigate} />}

        {currentPage === 'admin-dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
      </div>
    </AuthProvider>
  );
}

export default App;
