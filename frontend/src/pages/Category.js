import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import DoctorCard from "../components/DoctorCard";

export default function Category() {
  const [params, setParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [divs, setDivs] = useState([]);
  const [loading, setLoading] = useState(true);

  const specialization = params.get("specialization") || "";
  const division = params.get("division") || "";

  useEffect(() => {
    setLoading(true);
    const q = {};
    if (specialization) q.specialization = specialization;
    if (division) q.division = division;
    Promise.all([
      api.get("/doctors", { params: q }),
      api.get("/specializations"),
      api.get("/divisions"),
    ]).then(([d, s, dv]) => {
      setDoctors(d.data);
      setSpecs(s.data);
      setDivs(dv.data);
    }).finally(() => setLoading(false));
  }, [specialization, division]);

  const update = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" data-testid="category-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Doctors</h1>
      <p className="text-gray-600 mb-6">{specialization && `Specialty: ${specialization}`} {division && `· Division: ${division}`}</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={specialization} onChange={(e) => update("specialization", e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" data-testid="category-spec-filter">
          <option value="">All Specializations</option>
          {specs.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={division} onChange={(e) => update("division", e.target.value)} className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" data-testid="category-div-filter">
          <option value="">All Divisions</option>
          {divs.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" /></div>
      ) : doctors.length === 0 ? (
        <div className="py-20 text-center text-gray-600" data-testid="category-empty">No doctors found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </div>
  );
}
