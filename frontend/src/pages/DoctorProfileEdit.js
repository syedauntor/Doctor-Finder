import { useEffect, useState } from "react";
import { api, formatApiError } from "../api";
import { Save, Trash2, Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";
import ImageUpload from "../components/ImageUpload";
import LocationPicker from "../components/LocationPicker";

export default function DoctorProfileEdit() {
  const [doc, setDoc] = useState(null);
  const [edu, setEdu] = useState([]);
  const [awards, setAwards] = useState([]);
  const [research, setResearch] = useState([]);
  const [expertise, setExpertise] = useState([]);
  const [currExp, setCurrExp] = useState([]);
  const [prevExp, setPrevExp] = useState([]);
  const [chambers, setChambers] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadAll = async () => {
    try {
      const [d, e, a, r, ex, ce, pe, ch] = await Promise.all([
        api.get("/doctor/me"),
        api.get("/doctor/me/education"),
        api.get("/doctor/me/awards"),
        api.get("/doctor/me/research"),
        api.get("/doctor/me/expertise"),
        api.get("/doctor/me/current-experience"),
        api.get("/doctor/me/previous-experience"),
        api.get("/doctor/me/chambers"),
      ]);
      setDoc(d.data); setEdu(e.data); setAwards(a.data); setResearch(r.data);
      setExpertise(ex.data); setCurrExp(ce.data); setPrevExp(pe.data); setChambers(ch.data);
    } catch (er) {
      setErr(formatApiError(er.response?.data?.detail) || er.message);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const saveProfile = async () => {
    setErr(""); setMsg("");
    try {
      await api.put("/doctor/me", doc);
      setMsg("Profile saved.");
    } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); }
  };

  if (!doc) return <div className="py-12 text-center">Loading…</div>;

  const setField = (k, v) => setDoc({ ...doc, [k]: v });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" data-testid="profile-edit-page">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Edit My Profile</h1>
      {msg && <div className="bg-green-50 text-green-700 px-3 py-2 rounded mb-3" data-testid="profile-saved">{msg}</div>}
      {err && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-3" data-testid="profile-error">{err}</div>}

      <section className="bg-white rounded-2xl border shadow-sm p-6 space-y-4 mb-6">
        <h2 className="text-xl font-bold">Basic Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Name" value={doc.name} onChange={(v) => setField("name", v)} testid="profile-name" />
          <Input label="Title (Degrees)" value={doc.title} onChange={(v) => setField("title", v)} testid="profile-title" />
          <Input label="Phone" value={doc.phone} onChange={(v) => setField("phone", v)} testid="profile-phone" />
          <Input label="BMDC Number" value={doc.bmdc_number} onChange={(v) => setField("bmdc_number", v)} testid="profile-bmdc" />
          <Input label="Designation" value={doc.designation} onChange={(v) => setField("designation", v)} testid="profile-designation" />
          <Input label="Years of experience" type="number" value={doc.years_of_experience} onChange={(v) => setField("years_of_experience", Number(v))} testid="profile-yoe" />
          <Input label="Gender" value={doc.gender} onChange={(v) => setField("gender", v)} testid="profile-gender" />
        </div>
        <div>
          <span className="text-sm text-gray-600 block mb-1">Profile image</span>
          <ImageUpload
            value={doc.profile_image}
            onChange={(url) => setField("profile_image", url)}
            testid="profile-image-upload"
          />
        </div>
        <textarea value={doc.overview || ""} onChange={(e) => setField("overview", e.target.value)} rows="4" placeholder="About yourself" className="w-full px-4 py-3 border rounded-lg" data-testid="profile-overview" />
        <div className="grid md:grid-cols-3 gap-4">
          <Input label="Fee — New Patient" type="number" value={doc.fee_new_patient} onChange={(v) => setField("fee_new_patient", Number(v))} testid="profile-fee-new" />
          <Input label="Fee — Old Patient" type="number" value={doc.fee_old_patient} onChange={(v) => setField("fee_old_patient", Number(v))} testid="profile-fee-old" />
          <Input label="Fee — Report Checking" type="number" value={doc.fee_report_checking} onChange={(v) => setField("fee_report_checking", Number(v))} testid="profile-fee-report" />
        </div>
        <button onClick={saveProfile} className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg" data-testid="profile-save">
          <Save className="h-4 w-4" /> Save Profile
        </button>
      </section>

      <ListSection title="Education" items={edu} reload={loadAll} endpoint="education" fields={[
        { key: "degree", label: "Degree" },
        { key: "institution", label: "Institution" },
        { key: "year", label: "Year", type: "number" },
      ]} />

      <ListSection title="Awards" items={awards} reload={loadAll} endpoint="awards" fields={[
        { key: "title", label: "Title" },
        { key: "organization", label: "Organization" },
        { key: "year", label: "Year", type: "number" },
      ]} />

      <ListSection title="Research Publications" items={research} reload={loadAll} endpoint="research" fields={[
        { key: "title", label: "Title" },
        { key: "journal", label: "Journal" },
        { key: "year", label: "Year", type: "number" },
        { key: "authors", label: "Authors" },
        { key: "link", label: "Link" },
      ]} />

      <ListSection title="Expertise" items={expertise} reload={loadAll} endpoint="expertise" fields={[
        { key: "title", label: "Title" },
        { key: "description", label: "Description" },
      ]} />

      <ListSection title="Current Experience" items={currExp} reload={loadAll} endpoint="current-experience" fields={[
        { key: "institution", label: "Institution" },
        { key: "designation", label: "Designation" },
        { key: "department", label: "Department" },
        { key: "since_year", label: "Since (Year)", type: "number" },
      ]} />

      <ListSection title="Previous Experience" items={prevExp} reload={loadAll} endpoint="previous-experience" fields={[
        { key: "institution", label: "Institution" },
        { key: "position", label: "Position" },
        { key: "department", label: "Department" },
        { key: "start_year", label: "From Year", type: "number" },
        { key: "end_year", label: "To Year", type: "number" },
      ]} />

      <ChambersSection items={chambers} reload={loadAll} />
    </div>
  );
}

function Input({ label, value, onChange, type = "text", testid }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500" data-testid={testid} />
    </label>
  );
}

function ListSection({ title, items, reload, endpoint, fields }) {
  const [draft, setDraft] = useState({});
  const [err, setErr] = useState("");

  const add = async () => {
    setErr("");
    try {
      const payload = {};
      fields.forEach((f) => {
        if (draft[f.key] !== undefined && draft[f.key] !== "") {
          payload[f.key] = f.type === "number" ? Number(draft[f.key]) : draft[f.key];
        }
      });
      await api.post(`/doctor/me/${endpoint}`, payload);
      setDraft({});
      await reload();
    } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); }
  };

  const del = async (id) => {
    try {
      await api.delete(`/doctor/me/${endpoint}/${id}`);
      await reload();
    } catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6 mb-6" data-testid={`section-${endpoint}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {err && <div className="text-red-600 text-sm mb-3">{err}</div>}
      <div className="space-y-2 mb-4">
        {items.map((i) => (
          <div key={i.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border">
            <span className="text-sm text-gray-700">
              {fields.map((f) => i[f.key]).filter(Boolean).join(" · ")}
            </span>
            <button onClick={() => del(i.id)} className="text-red-600 hover:text-red-700" data-testid={`del-${endpoint}-${i.id}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No items yet.</p>}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {fields.map((f) => (
          <input
            key={f.key}
            type={f.type || "text"}
            value={draft[f.key] || ""}
            placeholder={f.label}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            className="px-3 py-2 border rounded-lg"
            data-testid={`new-${endpoint}-${f.key}`}
          />
        ))}
      </div>
      <button onClick={add} className="mt-3 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm" data-testid={`add-${endpoint}`}>
        <Plus className="h-4 w-4" /> Add
      </button>
    </section>
  );
}

function ChambersSection({ items, reload }) {
  const empty = {
    name: "", address: "", area: "", city: "",
    division: "", district: "", upazila: "",
    latitude: null, longitude: null, map_url: "",
  };
  const [draft, setDraft] = useState(empty);
  const [err, setErr] = useState("");

  const set = (k, v) => setDraft({ ...draft, [k]: v });

  const add = async () => {
    setErr("");
    try {
      const payload = { ...draft };
      // Cast to numbers / strip nulls
      payload.latitude = payload.latitude != null && payload.latitude !== "" ? Number(payload.latitude) : null;
      payload.longitude = payload.longitude != null && payload.longitude !== "" ? Number(payload.longitude) : null;
      if (!payload.name?.trim()) { setErr("Chamber name is required."); return; }
      await api.post("/doctor/me/chambers", payload);
      setDraft(empty);
      await reload();
    } catch (e) { setErr(formatApiError(e.response?.data?.detail) || e.message); }
  };

  const del = async (id) => {
    try { await api.delete(`/doctor/me/chambers/${id}`); await reload(); }
    catch (e) { alert(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <section className="bg-white rounded-2xl border shadow-sm p-6 mb-6" data-testid="section-chambers">
      <h2 className="text-xl font-bold mb-4">Chambers</h2>
      {err && <div className="text-red-600 text-sm mb-3" data-testid="chamber-error">{err}</div>}

      <div className="space-y-2 mb-6">
        {items.map((c) => (
          <div key={c.id} className="bg-gray-50 px-3 py-3 rounded-lg border flex justify-between items-start gap-3" data-testid={`chamber-${c.id}`}>
            <div className="text-sm text-gray-700">
              <div className="font-semibold text-gray-900">{c.name}</div>
              <div>{[c.address, c.area, c.city].filter(Boolean).join(", ")}</div>
              <div className="text-xs text-gray-500">{[c.division, c.district, c.upazila].filter(Boolean).join(" → ")}</div>
              {c.latitude != null && c.longitude != null && (
                <div className="text-xs text-gray-500 mt-1">📍 {Number(c.latitude).toFixed(5)}, {Number(c.longitude).toFixed(5)}</div>
              )}
            </div>
            <button onClick={() => del(c.id)} className="text-red-600 hover:text-red-700" data-testid={`del-chamber-${c.id}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No chambers yet.</p>}
      </div>

      <div className="bg-gray-50 border rounded-xl p-4">
        <h3 className="font-semibold mb-3 text-gray-900">Add a new chamber</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            ["name", "Chamber name *"], ["address", "Address"], ["area", "Area"], ["city", "City"],
            ["division", "Division"], ["district", "District"], ["upazila", "Upazila"],
          ].map(([k, label]) => (
            <input
              key={k}
              value={draft[k] || ""}
              onChange={(e) => set(k, e.target.value)}
              placeholder={label}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              data-testid={`new-chamber-${k}`}
            />
          ))}
        </div>

        <div className="mt-4">
          <span className="text-sm font-medium text-gray-700 block mb-2">Pin chamber location on map</span>
          <LocationPicker
            lat={draft.latitude}
            lng={draft.longitude}
            onChange={({ lat, lng, map_url }) => setDraft({ ...draft, latitude: lat, longitude: lng, map_url })}
            testid="new-chamber-map"
          />
        </div>

        <button onClick={add} className="mt-4 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-sm" data-testid="add-chamber">
          <Plus className="h-4 w-4" /> Add Chamber
        </button>
      </div>
    </section>
  );
}

