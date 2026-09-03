import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fmsp_token");
    const cachedUser = localStorage.getItem("fmsp_user");

    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
      // Verify token is still valid in the background
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("fmsp_user", JSON.stringify(res.data.user));
        })
        .catch(() => {
          // interceptor handles redirect on 401
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password, portal) {
    const res = await api.post("/auth/login", { email, password, ...(portal ? { portal } : {}) });
    localStorage.setItem("fmsp_token", res.data.token);
    localStorage.setItem("fmsp_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("fmsp_token", res.data.token);
    localStorage.setItem("fmsp_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("fmsp_token");
    localStorage.removeItem("fmsp_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
