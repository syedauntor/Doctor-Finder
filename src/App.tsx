import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DoctorDetail from './pages/DoctorDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Category from './pages/Category';

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
    </div>
  );
}

export default App;
