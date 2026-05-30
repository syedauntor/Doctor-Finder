import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { ShieldCheck, MapPin, Clock, Award, BookOpen, Briefcase, Star } from "lucide-react";

export default function DoctorDetail() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then((r) => setDoc(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "Doctor not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" /></div>;
  if (err) return <div className="max-w-3xl mx-auto py-16 text-center text-red-600" data-testid="doctor-detail-error">{err}</div>;
  if (!doc) return null;

  const primarySpec = doc.specializations?.find((s) => s.is_primary)?.name || "";
  const currentExp = doc.current_experience?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="doctor-detail-page">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-8 py-10 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <img src={doc.profile_image || "https://via.placeholder.com/200"} alt={doc.name} className="w-36 h-36 rounded-full border-4 border-white shadow-xl object-cover" />
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-4xl font-bold" data-testid="doctor-detail-name">{doc.name}</h1>
                {doc.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-green-500 px-2.5 py-1 rounded-full text-sm">
                    <ShieldCheck className="h-4 w-4" /> Verified
                  </span>
                )}
              </div>
              <p className="text-teal-100 mt-1 text-lg">{doc.title}</p>
              {currentExp && (
                <p className="text-white/90 mt-1">{currentExp.designation} {currentExp.department && `of ${currentExp.department}`}</p>
              )}
              {primarySpec && (
                <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-sm">{primarySpec}</span>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start text-sm">
                <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {doc.rating} ({doc.total_reviews} reviews)</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {doc.years_of_experience} years</span>
                <span>BMDC: {doc.bmdc_number}</span>
              </div>
            </div>
            <Link to={`/book/${doc.id}`} className="px-6 py-3 bg-green-500 hover:bg-green-400 rounded-lg font-semibold shadow-lg" data-testid="doctor-detail-book-btn">
              Book Appointment
            </Link>
          </div>
        </div>

        <div className="px-8 py-6 grid md:grid-cols-3 gap-6 border-b">
          <FeeCard label="New Patient" amount={doc.fee_new_patient} />
          <FeeCard label="Old Patient (6 mo)" amount={doc.fee_old_patient} />
          <FeeCard label="Report Checking" amount={doc.fee_report_checking} />
        </div>

        <div className="px-8 py-6 space-y-8">
          {doc.overview && <Section title="About">{doc.overview}</Section>}

          {doc.chambers?.length > 0 && (
            <Section title="Chambers" icon={MapPin}>
              <div className="grid gap-4">
                {doc.chambers.map((c) => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-4 border" data-testid={`chamber-${c.id}`}>
                    <h4 className="font-semibold text-gray-900">{c.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{c.address}, {c.area}, {c.city}</p>
                    {c.division && <p className="text-xs text-gray-500 mt-1">{c.division} {c.district && `→ ${c.district}`} {c.upazila && `→ ${c.upazila}`}</p>}
                    {c.schedules?.length > 0 && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Schedule:</strong>
                        <ul className="ml-4 mt-1">
                          {c.schedules.map((s) => (
                            <li key={s.id}>{s.day_of_week}: {s.start_time} - {s.end_time}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.map_url && <a href={c.map_url} target="_blank" rel="noreferrer" className="text-teal-600 text-sm hover:underline">View on Map →</a>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {doc.education?.length > 0 && (
            <Section title="Education" icon={BookOpen}>
              <ul className="space-y-2">
                {doc.education.map((e) => (
                  <li key={e.id} className="flex justify-between border-b pb-2">
                    <span><strong>{e.degree}</strong> — {e.institution}</span>
                    <span className="text-gray-500">{e.year}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {doc.current_experience?.length > 0 && (
            <Section title="Current Position" icon={Briefcase}>
              <ul className="space-y-2">
                {doc.current_experience.map((e) => (
                  <li key={e.id}>{e.designation} of {e.department} at <strong>{e.institution}</strong> (since {e.since_year})</li>
                ))}
              </ul>
            </Section>
          )}

          {doc.previous_experience?.length > 0 && (
            <Section title="Past Experience" icon={Briefcase}>
              <ul className="space-y-2">
                {doc.previous_experience.map((e) => (
                  <li key={e.id}>{e.position} of {e.department} at <strong>{e.institution}</strong> ({e.start_year} - {e.end_year})</li>
                ))}
              </ul>
            </Section>
          )}

          {doc.expertise?.length > 0 && (
            <Section title="Expertise">
              <div className="grid md:grid-cols-2 gap-3">
                {doc.expertise.map((e) => (
                  <div key={e.id} className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                    <h4 className="font-semibold text-teal-800">{e.title}</h4>
                    {e.description && <p className="text-sm text-gray-700 mt-1">{e.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {doc.awards?.length > 0 && (
            <Section title="Awards" icon={Award}>
              <ul className="space-y-2">
                {doc.awards.map((a) => (
                  <li key={a.id}><strong>{a.title}</strong> — {a.organization} ({a.year})</li>
                ))}
              </ul>
            </Section>
          )}

          {doc.research_publications?.length > 0 && (
            <Section title="Research Publications">
              <ul className="space-y-3">
                {doc.research_publications.map((r) => (
                  <li key={r.id} className="border-l-4 border-teal-500 pl-3">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-sm text-gray-600">{r.authors}</p>
                    <p className="text-sm text-gray-500">{r.journal} ({r.year})</p>
                    {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="text-teal-600 text-sm hover:underline">View Publication →</a>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function FeeCard({ label, amount }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-2xl font-bold text-teal-600 mt-1">৳{amount || 0}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-teal-600" />}
        {title}
      </h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}
