// src/pages/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying...");
  const [nextStep, setNextStep] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();
    const tokenParam = new URLSearchParams(location.search).get("token");

    (async () => {
      if (!tokenParam) {
        setStatus("❌ Missing token in URL");
        return;
      }

      try {
        const vRes = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenParam }),
          signal: ac.signal,
        });

        const vJson = await vRes.json().catch(() => ({}));
        if (!vRes.ok || !vJson?.success || !vJson?.token) {
          setStatus("❌ " + (vJson?.error || "Verification failed"));
          return;
        }

        localStorage.setItem("token", vJson.token);
        setStatus("✅ Email verified!");

        const sRes = await fetch("/api/user/status", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vJson.token}`,
          },
          signal: ac.signal,
        });

        const st = await sRes.json().catch(() => ({}));
        if (!sRes.ok) {
          setStatus("❌ Failed to load user status");
          return;
        }

        if (!st.twofa_enabled) {
          setNextStep({ label: "Set up 2FA", path: "/enable-2fa" });
        } else if (!st.payment_method_added) {
          setNextStep({ label: "Add Payment Method", path: "/add-payment" });
        } else if (st.kyc_status !== "approved") {
          setNextStep({ label: "Finish Onboarding", path: "/onboarding" });
        } else {
          setNextStep({ label: "Go to IntellaCoin", path: "/IntellaCoin" });
        }
      } catch {
        if (!ac.signal.aborted) setStatus("❌ Network error");
      }
    })();

    return () => ac.abort();
  }, [location.search, navigate]);

  return (
    <div className="p-10 text-text text-center space-y-6">
      <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
      <p className="text-lg">{status}</p>

      {nextStep && (
        <button
          onClick={() => navigate(nextStep.path)}
          className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition"
        >
          {nextStep.label}
        </button>
      )}
    </div>
  );
}
