import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("ev_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem("ev_access_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("ev_user", JSON.stringify(data.user));
      } catch (err) {
        localStorage.removeItem("ev_access_token");
        localStorage.removeItem("ev_refresh_token");
        localStorage.removeItem("ev_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("ev_access_token", data.accessToken);
    localStorage.setItem("ev_refresh_token", data.refreshToken);
    localStorage.setItem("ev_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("ev_refresh_token");
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch (err) {
      // ignore network errors on logout
    }
    localStorage.removeItem("ev_access_token");
    localStorage.removeItem("ev_refresh_token");
    localStorage.removeItem("ev_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
