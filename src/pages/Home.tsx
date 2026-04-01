import { useEffect, useState } from 'react';
import { Search, Filter, Baby, Heart, Stethoscope, Activity, Bone, Eye, Brain, Users } from 'lucide-react';
import { supabase, type Doctor, type Specialization } from '../lib/supabase';
import DoctorCard from '../components/DoctorCard';
import Footer from '../components/Footer';

type HomeProps = {
  onNavigate: (page: string, doctorId?: string) => void;
};

export default function Home({ onNavigate }: HomeProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [doctorSpecializations, setDoctorSpecializations] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [doctorsRes, specializationsRes, docSpecRes] = await Promise.all([
        supabase.from('doctors').select('*').order('rating', { ascending: false }),
        supabase.from('specializations').select('*'),
        supabase
          .from('doctor_specializations')
          .select('doctor_id, specialization_id, is_primary, specializations(name)')
          .eq('is_primary', true),
      ]);

      if (doctorsRes.data) setDoctors(doctorsRes.data);
      if (specializationsRes.data) setSpecializations(specializationsRes.data);

      if (docSpecRes.data) {
        const map = new Map<string, string>();
        docSpecRes.data.forEach((ds: any) => {
          if (ds.specializations) {
            map.set(ds.doctor_id, ds.specializations.name);
          }
        });
        setDoctorSpecializations(map);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.title.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedSpecialization === 'all') return matchesSearch;

    const docSpec = doctorSpecializations.get(doctor.id);
    const matchesSpec =
      docSpec?.toLowerCase() === selectedSpecialization.toLowerCase();

    return matchesSearch && matchesSpec;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Find Your Perfect Doctor
          </h1>
          <p className="text-center text-teal-100 text-lg mb-8">
            Connect with top healthcare professionals in Bangladesh
          </p>

          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-2">
            <div className="flex items-center">
              <Search className="h-5 w-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Search by doctor name or qualification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-800 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec.id} value={spec.name}>
                {spec.name}
              </option>
            ))}
          </select>
          <span className="text-gray-600">
            {filteredDoctors.length} doctors found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              specialization={doctorSpecializations.get(doctor.id)}
              onViewProfile={(id) => onNavigate('doctor', id)}
            />
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No doctors found matching your criteria
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Find By Specialty
              </h2>
            </div>
            <button
              onClick={() => onNavigate('category', undefined, { type: 'all' })}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center transition-colors"
            >
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { name: 'Gynecologist & Obstetrician', icon: Baby },
              { name: 'Medicine Specialist', icon: Stethoscope },
              { name: 'Cardiologist', icon: Heart },
              { name: 'Pediatrician', icon: Users },
              { name: 'General Surgeon', icon: Activity },
              { name: 'Otolaryngologists (ENT)', icon: Brain },
            ].map((category, index) => {
              const Icon = category.icon;
              return (
                <button
                  key={index}
                  onClick={() => onNavigate('category', undefined, { type: 'specialization', value: category.name })}
                  className="group flex flex-col items-center text-center transition-transform hover:scale-105"
                >
                  <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all group-hover:bg-teal-600">
                    <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {category.name}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
