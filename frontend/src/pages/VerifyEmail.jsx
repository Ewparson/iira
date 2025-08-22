// frontend/src/pages/VerifyEmail.jsx

import React, { useEffect, useState } from "react";
import React from 'react';


export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying...");
  const [verified, setVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = new URLSearchParams(location.search).get("token");
    if (!tokenParam) {
      setStatus("❌ Missing token in URL");
      return;
    }

    // Call your backend's GET /verify endpoint
    fetch(`/api/verify?token=${encodeURIComponent(tokenParam)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Verification failed");
        }
        return res.text();
      })
      .then((msg) => {
        setStatus(`✅ ${msg}`); // e.g. "Email verified! You can now log in."
        setVerified(true);
      })
      .catch((err) => {
        setStatus(`❌ ${err.message}`);
      });
  }, [location.search]);

  const goTo2FA = () => navigate("/enable-2fa");
  const skip2FA = () => navigate("/onboarding");

  return (
    <div className="p-10 text-text text-center">
      <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
      <p className="text-lg mb-6">{status}</p>

      {verified && (
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={goTo2FA}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/80 transition"
          >
            Set Up 2FA
          </button>
          <button
            onClick={skip2FA}
            className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
          >
            Skip for Now
          </button>
        </div>
      )}
    </div>
  );
}
