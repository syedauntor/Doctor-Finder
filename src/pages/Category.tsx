import { useEffect, useState } from 'react';
import { ArrowLeft, Filter, Search, MapPin, Stethoscope, Users } from 'lucide-react';
import { supabase, type Doctor } from '../lib/supabase';
import DoctorCard from '../components/DoctorCard';
import Footer from '../components/Footer';

interface CategoryProps {
  filter: { type: string; value: string };
  onNavigate: (page: string, doctorId?: string, filter?: { type: string; value: string }) => void;
}

export default function Category({ filter, onNavigate }: CategoryProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('all');
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableUpazilas, setAvailableUpazilas] = useState<string[]>([]);

  const filterType = filter.type;
  const filterValue = filter.value;

  useEffect(() => {
    fetchFilteredDoctors();
  }, [filterType, filterValue]);

  const fetchFilteredDoctors = async () => {
    setLoading(true);
    try {
      let query = supabase.from('doctors').select('*');

      if (filterType === 'specialization' && filterValue) {
        query = query.eq('specialization', filterValue);
      } else if (filterType === 'chamber' && filterValue) {
        // Get doctor IDs from chambers with matching location
        const { data: chambers } = await supabase
          .from('chambers')
          .select('doctor_id')
          .or(`name.ilike.%${filterValue}%,area.ilike.%${filterValue}%,city.ilike.%${filterValue}%`);

        if (chambers && chambers.length > 0) {
          const doctorIds = [...new Set(chambers.map(c => c.doctor_id))];
          query = query.in('id', doctorIds);
        } else {
          setDoctors([]);
          setLoading(false);
          return;
        }
      } else if (filterType === 'institution' && filterValue) {
        // Get doctor IDs from current or previous experiences matching institution
        const { data: currentExp } = await supabase
          .from('current_experience')
          .select('doctor_id')
          .ilike('institution', `%${filterValue}%`);

        const { data: previousExp } = await supabase
          .from('previous_experience')
          .select('doctor_id')
          .ilike('institution', `%${filterValue}%`);

        const doctorIds = [
          ...(currentExp?.map(e => e.doctor_id) || []),
          ...(previousExp?.map(e => e.doctor_id) || [])
        ];

        const uniqueDoctorIds = [...new Set(doctorIds)];

        if (uniqueDoctorIds.length > 0) {
          query = query.in('id', uniqueDoctorIds);
        } else {
          setDoctors([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setDoctors(data || []);
      setAllDoctors(data || []);

      // Extract unique locations from chambers
      if (data && data.length > 0) {
        const doctorIds = data.map(d => d.id);
        const { data: chambers } = await supabase
          .from('chambers')
          .select('division, district, upazila')
          .in('doctor_id', doctorIds);

        if (chambers) {
          const uniqueDivisions = [...new Set(chambers.map(c => c.division))].filter(Boolean);
          const uniqueDistricts = [...new Set(chambers.map(c => c.district))].filter(Boolean);
          const uniqueUpazilas = [...new Set(chambers.map(c => c.upazila))].filter(Boolean);

          setAvailableDivisions(uniqueDivisions.sort());
          setAvailableDistricts(uniqueDistricts.sort());
          setAvailableUpazilas(uniqueUpazilas.sort());
        }
      }
    } catch (error) {
      console.error('Error fetching filtered doctors:', error);
      setDoctors([]);
      setAllDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedGender, selectedDivision, selectedDistrict, selectedUpazila, allDoctors]);

  const applyFilters = async () => {
    let filtered = [...allDoctors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Gender filter
    if (selectedGender !== 'all') {
      filtered = filtered.filter(doctor => doctor.gender === selectedGender);
    }

    // Location filters - hierarchical
    if (selectedDivision !== 'all' || selectedDistrict !== 'all' || selectedUpazila !== 'all') {
      const doctorIds = filtered.map(d => d.id);
      let locationQuery = supabase
        .from('chambers')
        .select('doctor_id')
        .in('doctor_id', doctorIds);

      if (selectedDivision !== 'all') {
        locationQuery = locationQuery.eq('division', selectedDivision);
      }
      if (selectedDistrict !== 'all') {
        locationQuery = locationQuery.eq('district', selectedDistrict);
      }
      if (selectedUpazila !== 'all') {
        locationQuery = locationQuery.eq('upazila', selectedUpazila);
      }

      const { data: chambers } = await locationQuery;

      if (chambers) {
        const locationDoctorIds = [...new Set(chambers.map(c => c.doctor_id))];
        filtered = filtered.filter(d => locationDoctorIds.includes(d.id));
      }
    }

    setDoctors(filtered);
  };

  // Update available districts when division changes
  useEffect(() => {
    if (selectedDivision !== 'all') {
      fetchDistrictsByDivision(selectedDivision);
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('all');
    }
  }, [selectedDivision]);

  // Update available upazilas when district changes
  useEffect(() => {
    if (selectedDistrict !== 'all') {
      fetchUpazilasByDistrict(selectedDistrict);
    } else {
      setAvailableUpazilas([]);
      setSelectedUpazila('all');
    }
  }, [selectedDistrict]);

  const fetchDistrictsByDivision = async (division: string) => {
    const doctorIds = allDoctors.map(d => d.id);
    const { data: chambers } = await supabase
      .from('chambers')
      .select('district')
      .eq('division', division)
      .in('doctor_id', doctorIds);

    if (chambers) {
      const uniqueDistricts = [...new Set(chambers.map(c => c.district))].filter(Boolean);
      setAvailableDistricts(uniqueDistricts.sort());
    }
  };

  const fetchUpazilasByDistrict = async (district: string) => {
    const doctorIds = allDoctors.map(d => d.id);
    const { data: chambers } = await supabase
      .from('chambers')
      .select('upazila')
      .eq('district', district)
      .in('doctor_id', doctorIds);

    if (chambers) {
      const uniqueUpazilas = [...new Set(chambers.map(c => c.upazila))].filter(Boolean);
      setAvailableUpazilas(uniqueUpazilas.sort());
    }
  };

  const getPageTitle = () => {
    if (filterType === 'specialization') {
      return `${filterValue} Specialists`;
    } else if (filterType === 'chamber') {
      return `Doctors at ${filterValue}`;
    } else if (filterType === 'institution') {
      return `Doctors from ${filterValue}`;
    }
    return 'Filtered Doctors';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to listings
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Filter className="h-6 w-6 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-800">{getPageTitle()}</h1>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gender Filter */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 mr-2 text-teal-600" />
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Division Filter */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 mr-2 text-teal-600" />
                Division
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setSelectedDistrict('all');
                  setSelectedUpazila('all');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Divisions</option>
                {availableDivisions.map((division) => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 mr-2 text-teal-600" />
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedUpazila('all');
                }}
                disabled={selectedDivision === 'all'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Districts</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Upazila Filter */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 mr-2 text-teal-600" />
                Upazila/Thana
              </label>
              <select
                value={selectedUpazila}
                onChange={(e) => setSelectedUpazila(e.target.value)}
                disabled={selectedDistrict === 'all'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Upazila/Thana</option>
                {availableUpazilas.map((upazila) => (
                  <option key={upazila} value={upazila}>
                    {upazila}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600">Loading doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">No doctors found matching this criteria.</p>
            <button
              onClick={() => onNavigate('home')}
              className="mt-4 inline-block text-teal-600 hover:text-teal-700 font-medium"
            >
              View all doctors
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} onNavigate={onNavigate} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
