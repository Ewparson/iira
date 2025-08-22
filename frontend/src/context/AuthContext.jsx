// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

// 1. Export the context!
export const AuthContext = createContext();

// 2. AuthProvider implementation
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to check user status from backend
  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/user/status", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data?.email ? data : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On mount, check login status
  useEffect(() => {
    checkUserStatus();
  }, []);

  // Login function
  const login = async ({ email, password, totp }) => {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, totp }),
    });
    if (!res.ok) throw new Error("Login failed");
    await checkUserStatus();
  };

  // Logout function
  const logout = () => {
    fetch("http://localhost:3001/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      setUser(null);
      window.location.href = "/";
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. useAuth hook
export function useAuth() {
  return useContext(AuthContext);
}
