import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Search } from "lucide-react";

// Default marker icon fix (Leaflet defaults break with bundlers)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [23.8103, 90.4125]; // Dhaka

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function InvalidateSize({ fallback }) {
  const map = useMap();
  useEffect(() => {
    const fix = () => {
      map.invalidateSize();
      map.setView(fallback, map.getZoom() || 11, { animate: false });
    };
    const t1 = setTimeout(fix, 80);
    const t2 = setTimeout(fix, 500);
    window.addEventListener("resize", fix);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", fix); };
  }, [map]);  // fallback intentionally omitted to keep init-time stable
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }
  }, [lat, lng, map]);
  return null;
}

/**
 * Interactive map picker. Click anywhere on the map to set lat/lng.
 * Also supports a free-text search via OpenStreetMap Nominatim (no API key).
 */
export default function LocationPicker({ lat, lng, onChange, testid = "location-picker" }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  const hasPoint = lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const center = hasPoint ? [Number(lat), Number(lng)] : DEFAULT_CENTER;
  const map_url = hasPoint ? `https://maps.google.com/?q=${lat},${lng}` : "";

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    if (!query.trim()) return;
    setSearching(true);
    setErr("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (data && data[0]) {
        onChange({ lat: Number(data[0].lat), lng: Number(data[0].lon), map_url: `https://maps.google.com/?q=${data[0].lat},${data[0].lon}` });
      } else {
        setErr("No location found for that search.");
      }
    } catch (e2) {
      setErr(e2.message || "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handlePick = (la, ln) => {
    onChange({ lat: la, lng: ln, map_url: `https://maps.google.com/?q=${la},${ln}` });
  };

  return (
    <div className="space-y-2" data-testid={testid}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address (e.g., Square Hospital Dhaka)"
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
            data-testid={`${testid}-search`}
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-sm"
          data-testid={`${testid}-search-btn`}
        >
          {searching ? "..." : "Search"}
        </button>
      </form>
      {err && <p className="text-xs text-red-600">{err}</p>}

      <div className="relative rounded-lg overflow-hidden border" style={{ height: 260 }}>
        <MapContainer center={center} zoom={hasPoint ? 14 : 11} className="h-full w-full" data-testid={`${testid}-map`}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPoint && <Marker position={center} icon={icon} />}
          <ClickHandler onPick={handlePick} />
          <Recenter lat={hasPoint ? center[0] : null} lng={hasPoint ? center[1] : null} />
          <InvalidateSize fallback={center} />
        </MapContainer>
      </div>

      {hasPoint ? (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="inline-flex items-center gap-1" data-testid={`${testid}-coords`}>
            <MapPin className="h-3 w-3" /> {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
          <a href={map_url} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">Open in Google Maps</a>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Click on the map to pick the chamber location.</p>
      )}
    </div>
  );
}
