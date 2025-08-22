import React, { useEffect, useState } from "react";
import QRCode from "react-qr-code";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function KycQrInvite() {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in");
      return;
    }
    fetch(`${API_URL}/api/kyc/qr-link`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) setLink(data.url);
        else setError(data.error || "Failed to load QR link");
      })
      .catch(() => setError("Network error"));
  }, []);

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }
  if (!link) {
    return <div className="p-8">Loading QR code…</div>;
  }

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Scan to Complete KYC on Your Phone</h1>
      <div className="inline-block bg-white p-4 rounded-lg shadow">
        <QRCode value={link} size={256} />
      </div>
      <p className="mt-4 text-gray-600">Open your phone’s camera or a QR-scanner to continue.</p>
    </div>
  );
}
