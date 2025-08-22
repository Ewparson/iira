// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          throw new Error("unauthorized");
        }
        if (!res.ok) throw new Error(`fetch-failed-${res.status}`);

        const data = await res.json();
        setUserData(data);
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error(e);
        setErr("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    })();

    return () => controller.abort();
  }, [navigate]);

  if (err) return <div className="p-8 text-red-400">{err}</div>;

  if (!userData) {
    return (
      <div className="max-w-xl mx-auto p-8 text-neutral-300">
        <div className="h-6 w-56 mb-4 bg-neutral-800 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-64 bg-neutral-800 rounded animate-pulse" />
          <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 text-neutral-50">
      <h1 className="text-3xl font-bold mb-4">Welcome, {userData.email}</h1>
      <ul className="space-y-2 text-sm">
        <li>
          <strong>Email Verified:</strong>{" "}
          {userData.email_verified ? "✅ Yes" : "❌ No"}
        </li>
        <li>
          <strong>KYC Submitted:</strong>{" "}
          {userData.kyc_submitted ? "✅ Yes" : "❌ No"}
        </li>
        {/* Add more fields as needed (balances, 2FA, etc.) */}
      </ul>
    </div>
  );
}
