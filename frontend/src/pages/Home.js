import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Baby, Heart, Stethoscope, Activity, Brain, Users, MapPin, Phone } from "lucide-react";
import { api } from "../api";
import DoctorCard from "../components/DoctorCard";

const FEATURED_SPECIALTIES = [
  { name: "Gynecologist & Obstetrician", icon: Baby },
  { name: "Medicine Specialist", icon: Stethoscope },
  { name: "Cardiologist", icon: Heart },
  { name: "Pediatrician", icon: Users },
  { name: "General Surgeon", icon: Activity },
  { name: "Otolaryngologists (ENT)", icon: Brain },
];

export default function Home() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("all");
  const [filterDiv, setFilterDiv] = useState("");
  const [filterSpec, setFilterSpec] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/doctors"),
      api.get("/specializations"),
      api.get("/divisions"),
    ]).then(([d, s, dv]) => {
      setDoctors(d.data);
      setSpecializations(s.data);
      setDivisions(dv.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter((d) => {
    const matchesText =
      !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.title?.toLowerCase().includes(search.toLowerCase());
    const matchesSpec =
      selectedSpec === "all" ||
      (d.primary_specialization || "").toLowerCase() === selectedSpec.toLowerCase();
    return matchesText && matchesSpec;
  });

  const handleLocationSearch = () => {
    const params = new URLSearchParams();
    if (filterDiv) params.set("division", filterDiv);
    if (filterSpec) params.set("specialization", filterSpec);
    navigate(`/category?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" data-testid="home-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white" data-testid="home-page">
      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Find Your Perfect Doctor</h1>
          <p className="text-center text-teal-100 text-lg mb-8">
            Connect with top healthcare professionals in Bangladesh
          </p>
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-2">
            <div className="flex items-center">
              <Search className="h-5 w-5 text-gray-400 ml-3" />
              <input
                type="text"
                placeholder="Search by doctor name or qualification..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 text-gray-800 focus:outline-none"
                data-testid="home-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Doctor List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center space-x-4 flex-wrap gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            data-testid="home-spec-filter"
          >
            <option value="all">All Specializations</option>
            {specializations.map((s) => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
          <span className="text-gray-600" data-testid="home-doctor-count">{filtered.length} doctors found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" data-testid="home-no-results">
            <p className="text-gray-600 text-lg">No doctors found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Emergency hotline */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl">
            <img
              src="https://images.pexels.com/photos/7108344/pexels-photo-7108344.jpeg?auto=compress&cs=tinysrgb&w=400"
              alt="Healthcare Professional"
              className="w-full md:w-64 h-48 object-cover rounded-lg shadow-lg"
            />
            <div className="flex-1 text-white text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Emergency Service Hotline</h2>
              <p className="text-lg text-teal-100 mb-6">Call 16263, and an ambulance will arrive at your doorstep</p>
              <a
                href="tel:16263"
                className="inline-flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:scale-105"
                data-testid="emergency-call-btn"
              >
                <Phone className="h-5 w-5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Find by location */}
      <div className="bg-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Find Doctors Near You</h2>
            <p className="text-gray-600">Search by location and specialty</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterDiv}
                onChange={(e) => setFilterDiv(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                data-testid="home-location-division"
              >
                <option value="">Select a Division</option>
                {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterSpec}
                onChange={(e) => setFilterSpec(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                data-testid="home-location-specialty"
              >
                <option value="">Select a Specialty</option>
                {specializations.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <button
              onClick={handleLocationSearch}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition"
              data-testid="home-location-search-btn"
            >
              <Search className="h-5 w-5" /> Search Doctors
            </button>
          </div>
        </div>
      </div>

      {/* Find by specialty grid */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-teal-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Find By Specialty</h2>
            <button
              onClick={() => navigate("/category")}
              className="text-teal-600 hover:text-teal-700 font-medium"
              data-testid="home-view-all-specialties"
            >View all →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {FEATURED_SPECIALTIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.name}
                  onClick={() => navigate(`/category?specialization=${encodeURIComponent(c.name)}`)}
                  className="group flex flex-col items-center text-center transition-transform hover:scale-105"
                  data-testid={`specialty-tile-${c.name.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center mb-4 shadow-lg group-hover:bg-teal-600 transition-all">
                    <Icon className="w-12 h-12 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
