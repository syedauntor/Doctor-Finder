import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiError } from "../api";

export default function DoctorRegistration() {
  const navigate = useNavigate();
  const [specs, setSpecs] = useState([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", specialty: "", bmdc_number: "",
    experience: "", message: "", password: "",
  });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/specializations").then((r) => setSpecs(r.data)); }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await api.post("/auth/doctor/register", form);
      setDone(true);
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center" data-testid="register-success">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-green-700">Registration Submitted</h2>
          <p className="text-gray-700 mt-2">Your application is pending admin review. You will be notified once approved.</p>
          <button onClick={() => navigate("/")} className="mt-6 px-6 py-3 bg-teal-600 text-white rounded-lg">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10" data-testid="doctor-register-page">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Register as Doctor</h1>
      <p className="text-gray-600 mb-6">Fill in your details to submit a registration request for review.</p>
      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4" data-testid="register-error">{err}</div>}
      <form onSubmit={submit} className="bg-white shadow rounded-2xl p-6 space-y-4 border">
        <div className="grid md:grid-cols-2 gap-4">
          <input required name="name" value={form.name} onChange={handle} placeholder="Full name" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-name" />
          <input required type="email" name="email" value={form.email} onChange={handle} placeholder="Email" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-email" />
          <input required name="phone" value={form.phone} onChange={handle} placeholder="Phone" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-phone" />
          <input required name="bmdc_number" value={form.bmdc_number} onChange={handle} placeholder="BMDC Number" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-bmdc" />
          <select required name="specialty" value={form.specialty} onChange={handle} className="w-full px-4 py-3 border rounded-lg" data-testid="reg-specialty">
            <option value="">Choose specialty</option>
            {specs.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <input required name="experience" value={form.experience} onChange={handle} placeholder="Years of experience" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-experience" />
          <input required type="password" name="password" minLength={6} value={form.password} onChange={handle} placeholder="Password (min 6 chars)" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-password" />
        </div>
        <textarea name="message" value={form.message} onChange={handle} rows="4" placeholder="Tell us about your practice (optional)" className="w-full px-4 py-3 border rounded-lg" data-testid="reg-message" />
        <button disabled={busy} className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold" data-testid="reg-submit">
          {busy ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </div>
  );
}
