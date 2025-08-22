// frontend/src/pages/Enable2FA.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // ADD THIS LINE

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function Enable2FA() {
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();  // ADD THIS LINE

  const enable2FA = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`${API_URL}/api/2fa/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (data.qr) {
        setQr(data.qr);
        setSecret(data.secret); // optional display
      } else {
        setStatus(data.error || "❌ Failed to generate QR.");
      }
    } catch (err) {
      setStatus("❌ Error connecting to server.");
    }
    setLoading(false);
  };

  const verify2FA = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`${API_URL}/api/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("✅ 2FA enabled successfully!");
        setTimeout(() => navigate("/blocktech"), 1300); // Show msg, then redirect
      } else {
        setStatus(data.error || "❌ Invalid code.");
      }
    } catch (err) {
      setStatus("❌ Error verifying code.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-xl shadow text-white">
      <h2 className="text-2xl font-bold mb-4">Enable Two-Factor Authentication</h2>

      {!qr && (
        <button
          onClick={enable2FA}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-semibold"
        >
          {loading ? "Loading..." : "Generate 2FA QR"}
        </button>
      )}

      {qr && (
        <div className="mt-6 text-center">
          <p className="mb-2">Scan this QR code with Google Authenticator:</p>
          <img src={qr} alt="2FA QR Code" className="mx-auto border rounded-lg" />
          {secret && (
            <p className="text-sm mt-2 text-gray-400">
              Or enter manually: <code>{secret}</code>
            </p>
          )}

          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full mt-4 p-2 text-black rounded"
          />

          <button
            onClick={verify2FA}
            className="mt-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </button>
        </div>
      )}

      {status && <div className="mt-6 text-center text-lg">{status}</div>}
    </div>
  );
}
