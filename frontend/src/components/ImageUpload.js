import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { api, formatApiError, resolveImageUrl } from "../api";

/**
 * Image uploader. Accepts an existing URL (relative `/api/uploads/...` or absolute https),
 * lets the doctor upload a new image via POST /api/upload/image, and calls `onChange(newUrl)`
 * with the relative URL on success.
 */
export default function ImageUpload({ value, onChange, testid = "image-upload" }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const pick = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.url);
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clear = () => onChange("");

  return (
    <div className="flex items-start gap-4" data-testid={testid}>
      <div className="relative">
        <img
          src={resolveImageUrl(value) || "https://via.placeholder.com/120?text=No+Image"}
          alt="profile preview"
          className="w-28 h-28 rounded-full object-cover border-2 border-teal-100 bg-gray-100"
          data-testid={`${testid}-preview`}
        />
        {value && (
          <button
            type="button"
            onClick={clear}
            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            data-testid={`${testid}-clear`}
            title="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex-1">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
          data-testid={`${testid}-input`}
        />
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
          data-testid={`${testid}-btn`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading..." : "Upload Image"}
        </button>
        <p className="text-xs text-gray-500 mt-2">JPG, PNG, WEBP or GIF. Max 5 MB.</p>
        {err && <p className="text-xs text-red-600 mt-1" data-testid={`${testid}-error`}>{err}</p>}
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="...or paste an image URL"
          className="mt-2 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          data-testid={`${testid}-url`}
        />
      </div>
    </div>
  );
}
