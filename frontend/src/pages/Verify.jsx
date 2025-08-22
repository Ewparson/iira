import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying...");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get("token");

    if (!token) {
      setStatus("Invalid token");
      return;
    }

    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus("✅ Email verified! Redirecting...");
          setTimeout(() => navigate("/signin"), 2000);
        } else {
          setStatus("❌ " + (data.error || "Verification failed"));
        }
      })
      .catch(() => setStatus("❌ Network error"));
  }, [location.search, navigate]);

  return (
    <div className="p-10 text-text text-center">
      <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
      <p>{status}</p>
    </div>
  );
}
