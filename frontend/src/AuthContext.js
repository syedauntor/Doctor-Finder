import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("df_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("df_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginDoctor = async (email, password) => {
    const res = await api.post("/auth/doctor/login", { email, password });
    localStorage.setItem("df_token", res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginAdmin = async (email, password) => {
    const res = await api.post("/auth/admin/login", { email, password });
    localStorage.setItem("df_token", res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("df_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginDoctor, loginAdmin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
