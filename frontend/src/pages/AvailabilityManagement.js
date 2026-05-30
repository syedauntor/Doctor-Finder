import { useEffect, useState } from "react";
import { api, formatApiError } from "../api";
import { Plus, Trash2 } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityManagement() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({ day_of_week: 0, start_time: "09:00", end_time: "17:00", slot_duration: 30, is_active: true });
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const r = await api.get("/doctor/me/availability");
      setRows(r.data);
    } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr("");
    try {
      await api.post("/doctor/me/availability", { ...draft, day_of_week: Number(draft.day_of_week), slot_duration: Number(draft.slot_duration) });
      await load();
    } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); }
  };

  const del = async (id) => {
    try { await api.delete(`/doctor/me/availability/${id}`); await load(); } catch { /* ignore */ }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="availability-page">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Manage Availability</h1>
      {err && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4">{err}</div>}

      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold mb-3">Current Schedule</h2>
        {rows.length === 0 ? (
          <p className="text-gray-500 text-sm">No availability set. Add slots below to allow patients to book.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 border" data-testid={`avail-${r.id}`}>
                <div>
                  <strong>{DAYS[r.day_of_week]}</strong> · {r.start_time} - {r.end_time} · every {r.slot_duration} min {r.is_active ? "" : "(inactive)"}
                </div>
                <button onClick={() => del(r.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-lg font-bold mb-3">Add New Slot</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <select value={draft.day_of_week} onChange={(e) => setDraft({ ...draft, day_of_week: e.target.value })} className="px-3 py-2 border rounded-lg" data-testid="avail-day">
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <input type="time" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} className="px-3 py-2 border rounded-lg" data-testid="avail-start" />
          <input type="time" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} className="px-3 py-2 border rounded-lg" data-testid="avail-end" />
          <select value={draft.slot_duration} onChange={(e) => setDraft({ ...draft, slot_duration: e.target.value })} className="px-3 py-2 border rounded-lg" data-testid="avail-duration">
            {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <button onClick={add} className="mt-4 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg" data-testid="avail-add">
          <Plus className="h-4 w-4" /> Add Slot
        </button>
      </div>
    </div>
  );
}
