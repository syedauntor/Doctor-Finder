import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatApiError } from "../api";
import { Calendar, Clock, User, Mail, Phone } from "lucide-react";

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");
  const [form, setForm] = useState({
    patient_name: "", patient_email: "", patient_phone: "",
    date_of_birth: "", gender: "", address: "",
    consultation_type: "in-person", notes: "", appointment_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`).then((r) => setDoctor(r.data)).finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (date) {
      api.get(`/doctors/${doctorId}/slots`, { params: { date } })
        .then((r) => setSlots(r.data.slots))
        .catch(() => setSlots([]));
    } else setSlots([]);
  }, [date, doctorId]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.appointment_time) { setErr("Please select a time slot."); return; }
    try {
      const payload = {
        doctor_id: doctorId,
        patient_name: form.patient_name,
        patient_email: form.patient_email,
        patient_phone: form.patient_phone,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address || null,
        appointment_date: date,
        appointment_time: form.appointment_time,
        consultation_type: form.consultation_type,
        notes: form.notes,
      };
      await api.post("/appointments", payload);
      setSuccess(true);
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin h-12 w-12 border-b-2 border-teal-600 rounded-full" /></div>;
  if (!doctor) return <div className="py-12 text-center">Doctor not found</div>;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center" data-testid="appointment-success">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-green-700">Appointment Booked!</h2>
          <p className="text-gray-700 mt-2">
            Your appointment with <strong>{doctor.name}</strong> on <strong>{date}</strong> at <strong>{form.appointment_time}</strong> has been submitted.
            The doctor will confirm shortly.
          </p>
          <button onClick={() => navigate("/")} className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg" data-testid="back-home-btn">Back to Home</button>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" data-testid="book-appointment-page">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Book Appointment</h1>
      <p className="text-gray-600 mb-6">with <strong>{doctor.name}</strong> — {doctor.title}</p>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4" data-testid="book-error">{err}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4 border">
        <div className="grid md:grid-cols-2 gap-4">
          <Field icon={User} name="patient_name" value={form.patient_name} onChange={handle} placeholder="Full name" required testid="book-name" />
          <Field icon={Mail} type="email" name="patient_email" value={form.patient_email} onChange={handle} placeholder="Email" required testid="book-email" />
          <Field icon={Phone} name="patient_phone" value={form.patient_phone} onChange={handle} placeholder="Phone" required testid="book-phone" />
          <Field type="date" name="date_of_birth" value={form.date_of_birth} onChange={handle} placeholder="Date of birth" testid="book-dob" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <select name="gender" value={form.gender} onChange={handle} className="w-full px-4 py-3 border rounded-lg" data-testid="book-gender">
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <select name="consultation_type" value={form.consultation_type} onChange={handle} className="w-full px-4 py-3 border rounded-lg" data-testid="book-consult-type">
            <option value="in-person">In-person</option>
            <option value="online">Online</option>
          </select>
        </div>
        <input name="address" value={form.address} onChange={handle} placeholder="Address (optional)" className="w-full px-4 py-3 border rounded-lg" data-testid="book-address" />

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> Appointment Date</label>
            <input type="date" min={todayStr} value={date} onChange={(e) => { setDate(e.target.value); setForm({ ...form, appointment_time: "" }); }} required className="w-full px-4 py-3 border rounded-lg" data-testid="book-date" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 inline-flex items-center gap-1"><Clock className="h-4 w-4" /> Available Time</label>
            {!date ? (
              <p className="text-sm text-gray-500 px-3 py-3 border rounded-lg">Pick a date first</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-red-500 px-3 py-3 border rounded-lg" data-testid="book-no-slots">No slots available for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm({ ...form, appointment_time: s })}
                    className={`px-2 py-2 rounded-lg text-sm border ${form.appointment_time === s ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 hover:bg-teal-50"}`}
                    data-testid={`book-slot-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea name="notes" rows="3" value={form.notes} onChange={handle} placeholder="Symptoms / notes (optional)" className="w-full px-4 py-3 border rounded-lg" data-testid="book-notes" />

        <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold" data-testid="book-submit">
          Book Appointment
        </button>
      </form>
    </div>
  );
}

function Field({ icon: Icon, testid, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
      <input data-testid={testid} {...props} className={`w-full ${Icon ? "pl-10" : "px-4"} pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500`} />
    </div>
  );
}
