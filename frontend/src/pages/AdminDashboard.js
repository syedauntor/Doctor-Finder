import { useEffect, useState } from "react";
import { api, formatApiError } from "../api";
import { Check, X, ShieldCheck, ShieldX, Users, FileText, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const [tab, setTab] = useState("requests");
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appts, setAppts] = useState([]);
  const [err, setErr] = useState("");

  const refresh = async () => {
    try {
      const [s, r, d, a] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/registration-requests"),
        api.get("/admin/doctors"),
        api.get("/admin/appointments"),
      ]);
      setStats(s.data); setRequests(r.data); setDoctors(d.data); setAppts(a.data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const approveReq = async (id) => {
    try { await api.post(`/admin/registration-requests/${id}/approve`, { notes: "Approved via admin dashboard" }); await refresh(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };
  const rejectReq = async (id) => {
    try { await api.post(`/admin/registration-requests/${id}/reject`, { notes: "Rejected via admin dashboard" }); await refresh(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };
  const verifyDoc = async (id, is_verified) => {
    try { await api.patch(`/admin/doctors/${id}/verify`, { is_verified, notes: is_verified ? "Verified" : "Unverified" }); await refresh(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="admin-dashboard-page">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>
      {err && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4">{err}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Pending Requests" value={stats.pending_requests} icon={FileText} color="text-yellow-600" />
          <Stat label="Verified Doctors" value={stats.verified_doctors} icon={ShieldCheck} color="text-green-600" />
          <Stat label="Total Doctors" value={stats.total_doctors} icon={Users} color="text-blue-600" />
          <Stat label="Appointments" value={stats.total_appointments} icon={Calendar} color="text-purple-600" />
        </div>
      )}

      <div className="flex gap-2 border-b mb-4">
        <Tab name="Registration Requests" id="requests" tab={tab} setTab={setTab} />
        <Tab name="All Doctors" id="doctors" tab={tab} setTab={setTab} />
        <Tab name="Appointments" id="appts" tab={tab} setTab={setTab} />
      </div>

      {tab === "requests" && (
        <div className="space-y-3" data-testid="admin-requests-list">
          {requests.length === 0 && <p className="text-gray-500">No requests.</p>}
          {requests.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between gap-3" data-testid={`req-${r.id}`}>
              <div className="flex-1 min-w-[260px]">
                <p className="font-semibold">{r.name} · <span className="text-sm text-gray-500">{r.specialty}</span></p>
                <p className="text-sm text-gray-600">{r.email} · {r.phone}</p>
                <p className="text-sm text-gray-600">BMDC: {r.bmdc_number} · Experience: {r.experience}</p>
                {r.message && <p className="text-sm text-gray-700 mt-1">{r.message}</p>}
                <p className="text-xs text-gray-400 mt-1">Status: {r.status}</p>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => approveReq(r.id)} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm inline-flex items-center gap-1" data-testid={`approve-${r.id}`}><Check className="h-4 w-4" />Approve</button>
                  <button onClick={() => rejectReq(r.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm inline-flex items-center gap-1" data-testid={`reject-${r.id}`}><X className="h-4 w-4" />Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "doctors" && (
        <div className="overflow-x-auto bg-white border rounded-2xl" data-testid="admin-doctors-list">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">BMDC</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-t" data-testid={`admin-doctor-${d.id}`}>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3">{d.email}</td>
                  <td className="px-4 py-3">{d.bmdc_number}</td>
                  <td className="px-4 py-3">
                    {d.is_verified ? <span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded-full">Verified</span>
                                   : <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs rounded-full">Unverified</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.is_verified ? (
                      <button onClick={() => verifyDoc(d.id, false)} className="text-red-600 inline-flex items-center gap-1 text-sm" data-testid={`unverify-${d.id}`}><ShieldX className="h-4 w-4" />Unverify</button>
                    ) : (
                      <button onClick={() => verifyDoc(d.id, true)} className="text-teal-600 inline-flex items-center gap-1 text-sm" data-testid={`verify-${d.id}`}><ShieldCheck className="h-4 w-4" />Verify</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "appts" && (
        <div className="overflow-x-auto bg-white border rounded-2xl" data-testid="admin-appts-list">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {appts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{a.appointment_date}</td>
                  <td className="px-4 py-3">{a.appointment_time}</td>
                  <td className="px-4 py-3">{a.patient?.name} <span className="text-xs text-gray-500">({a.patient?.email})</span></td>
                  <td className="px-4 py-3">{a.doctor?.name}</td>
                  <td className="px-4 py-3 capitalize">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-start gap-3" data-testid={`admin-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className={`h-8 w-8 ${color}`} />
      <div>
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Tab({ name, id, tab, setTab }) {
  const active = tab === id;
  return (
    <button onClick={() => setTab(id)} className={`px-4 py-2 text-sm font-medium border-b-2 ${active ? "border-teal-600 text-teal-600" : "border-transparent text-gray-600 hover:text-teal-600"}`} data-testid={`tab-${id}`}>{name}</button>
  );
}
