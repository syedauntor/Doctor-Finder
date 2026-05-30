import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "../api";
import { Calendar, Clock, User, Phone, Check, X, FileText } from "lucide-react";

export default function DoctorDashboard() {
  const [appts, setAppts] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/doctor/me/appointments", { params: status ? { status } : {} });
      setAppts(r.data);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail) || e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const update = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}`, { status: newStatus });
      await load();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  const stats = {
    total: appts.length,
    pending: appts.filter((a) => a.status === "pending").length,
    confirmed: appts.filter((a) => a.status === "confirmed").length,
    completed: appts.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="doctor-dashboard-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/doctor/profile" className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50" data-testid="goto-profile-btn">Edit Profile</Link>
          <Link to="/doctor/availability" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700" data-testid="goto-availability-btn">Manage Availability</Link>
        </div>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} color="bg-blue-500" />
        <StatCard label="Pending" value={stats.pending} color="bg-yellow-500" />
        <StatCard label="Confirmed" value={stats.confirmed} color="bg-teal-600" />
        <StatCard label="Completed" value={stats.completed} color="bg-green-600" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${status === s ? "bg-teal-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
            data-testid={`filter-${s || "all"}`}
          >{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}</button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" /></div>
      ) : appts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-gray-500" data-testid="dashboard-empty">No appointments yet.</div>
      ) : (
        <div className="space-y-3">
          {appts.map((a) => <ApptCard key={a.id} a={a} onUpdate={update} />)}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm" data-testid={`stat-${label.toLowerCase()}`}>
      <div className={`${color} w-10 h-10 rounded-lg`} />
      <p className="text-xs text-gray-500 mt-3 uppercase">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ApptCard({ a, onUpdate }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-teal-100 text-teal-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-green-100 text-green-800",
  };
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm" data-testid={`appt-${a.id}`}>
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-gray-500" />
            <strong className="text-gray-900">{a.patient?.name}</strong>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{a.status}</span>
          </div>
          <p className="text-sm text-gray-600 inline-flex items-center gap-1"><Phone className="h-3 w-3" />{a.patient?.phone} · {a.patient?.email}</p>
          <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{a.appointment_date} <Clock className="h-3 w-3 ml-2" />{a.appointment_time} · {a.consultation_type}</p>
          {a.notes && <p className="text-sm text-gray-700 mt-1 inline-flex items-start gap-1"><FileText className="h-3 w-3 mt-1" />{a.notes}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status === "pending" && (
            <>
              <button onClick={() => onUpdate(a.id, "confirmed")} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm inline-flex items-center gap-1" data-testid={`confirm-${a.id}`}><Check className="h-4 w-4" />Confirm</button>
              <button onClick={() => onUpdate(a.id, "cancelled")} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm inline-flex items-center gap-1" data-testid={`cancel-${a.id}`}><X className="h-4 w-4" />Cancel</button>
            </>
          )}
          {a.status === "confirmed" && (
            <button onClick={() => onUpdate(a.id, "completed")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm" data-testid={`complete-${a.id}`}>Mark Completed</button>
          )}
        </div>
      </div>
    </div>
  );
}
