// src/pages/Welcome.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] || ""));
        login(token, { email: payload?.email, isAdmin: payload?.isAdmin });
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.pathname);
      }
    } else if (!user) {
      navigate("/login", { replace: true });
    }
  }, [login, navigate, user]);

  // NOTE: removed any bg-* class; it's now transparent
  return (
    <div className="relative min-h-dvh flex items-center justify-center">
      <div className="text-center p-8 text-neutral-50">
        <h1 className="text-4xl font-bold mb-4">
          Welcome{user?.email ? `, ${user.email}` : "!"}
        </h1>
        <p className="text-lg text-neutral-400 mb-8">
          You have successfully logged in.
        </p>
        <button
          onClick={() => navigate("/IntellaCoin")}
          className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-500 transition-colors text-lg"
        >
          Go to IntellaCoin
        </button>
      </div>
    </div>
  );
}
