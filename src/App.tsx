import { useState } from 'react';
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

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<{ type: string; value: string } | null>(null);

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

        {currentPage === 'book-appointment' && <BookAppointment />}

        {currentPage === 'availability' && <AvailabilityManagement />}
      </div>
    </AuthProvider>
  );
}

export default App;
