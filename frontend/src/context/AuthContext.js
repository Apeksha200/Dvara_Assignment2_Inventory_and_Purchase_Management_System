import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../utils/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Verify token and get user
      axios
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const forgotPassword = async (email) => {
    const response = await axios.post("/auth/forgot-password", { email });
    return response;
  };

  const resetPassword = async (token, password) => {
    const response = await axios.post("/auth/reset-password", { token, password });
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        forgotPassword,
        resetPassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
