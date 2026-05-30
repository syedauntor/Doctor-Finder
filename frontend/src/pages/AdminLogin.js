import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { formatApiError } from "../api";
import { ShieldCheck, Mail, Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await loginAdmin(email, pwd);
      navigate("/admin/dashboard");
    } catch (e2) {
      setErr(formatApiError(e2.response?.data?.detail) || e2.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border">
        <div className="flex flex-col items-center mb-6">
          <ShieldCheck className="h-10 w-10 text-indigo-600" />
          <h1 className="text-2xl font-bold mt-2 text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500">Manage doctors, requests and appointments</p>
        </div>
        {err && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm" data-testid="admin-login-error">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" data-testid="admin-login-email" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Password" required className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" data-testid="admin-login-password" />
          </div>
          <button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold" data-testid="admin-login-submit">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-2 text-center text-xs text-gray-400">Demo: admin@demo.com / demo123456</div>
        <Link to="/" className="block text-center mt-4 text-sm text-gray-600 hover:underline">← Back to home</Link>
      </div>
    </div>
  );
}
