// src/pages/Onboarding.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function Onboarding() {
  const [infoForm, setInfoForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
  });

  const [qrLink, setQrLink] = useState("");
  const [loadingQr, setLoadingQr] = useState(true);
  const [mode, setMode] = useState("qr"); // "qr" or "manual"
  const [files, setFiles] = useState({ id_front: null, id_back: null, selfie: null });
  const [uploadError, setUploadError] = useState(null);

  const navigate = useNavigate();
  const getTokenHdr = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    fetch(`${API_URL}/api/kyc/qr-link`, { headers: getTokenHdr() })
      .then((res) => res.json())
      .then((data) => { if (data.url) setQrLink(data.url); })
      .catch(() => {})
      .finally(() => setLoadingQr(false));
  }, [navigate]);

  const handleInfoChange = (e) => setInfoForm({ ...infoForm, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  // Enable submit only when all fields and files are set
  const canSubmit =
    infoForm.first_name &&
    infoForm.last_name &&
    infoForm.dob &&
    files.id_front &&
    files.id_back &&
    files.selfie;

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError(null);
    if (!canSubmit) return;

    const formData = new FormData();
    formData.append("first_name", infoForm.first_name);
    formData.append("middle_name", infoForm.middle_name);
    formData.append("last_name", infoForm.last_name);
    formData.append("dob", infoForm.dob);
    formData.append("id_front", files.id_front);
    formData.append("id_back", files.id_back);
    formData.append("selfie", files.selfie);

    try {
      const res = await fetch(`${API_URL}/api/kyc-upload`, {
        method: "POST",
        headers: getTokenHdr(),
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      // on success, navigate to the next page
      navigate("/kyc-status"); // replace with your desired route
    } catch (err) {
      setUploadError(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 text-text">
      <h1 className="text-3xl font-bold mb-6">🪩 Let’s Get You Started!</h1>

      {/* 1. User Info Inputs */}
      <form className="space-y-4 mb-8" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-xl font-semibold">1. Enter Your Info</h2>
        {[
          { name: "first_name", placeholder: "First Name", required: true },
          { name: "middle_name", placeholder: "Middle Name (optional)", required: false },
          { name: "last_name", placeholder: "Last Name", required: true },
        ].map(({ name, placeholder, required }) => (
          <input
            key={name}
            name={name}
            value={infoForm[name]}
            onChange={handleInfoChange}
            required={required}
            placeholder={placeholder}
            className="w-full p-2 bg-gray-800 text-white rounded"
          />
        ))}
        <input
          name="dob"
          type="date"
          value={infoForm.dob}
          onChange={handleInfoChange}
          required
          className="w-full p-2 bg-gray-800 text-white rounded"
        />
      </form>

      {/* 2. Mode Toggle */}
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setMode("qr")}
          className={`px-4 py-2 rounded ${mode === "qr" ? "bg-primary text-white" : "bg-surface"}`}
        >
          Scan QR
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded ${mode === "manual" ? "bg-primary text-white" : "bg-surface"}`}
        >
          Upload Manually
        </button>
      </div>

      {/* 3a. QR Code */}
      {mode === "qr" && (
        <div className="text-center">
          {loadingQr ? (
            <p>Loading QR code…</p>
          ) : qrLink ? (
            <>
              <QRCode value={qrLink} size={200} />
              <p className="mt-4 text-gray-400">
                Scan this QR code with your phone to continue on mobile.
              </p>
            </>
          ) : (
            <p className="text-red-500">Failed to load QR code</p>
          )}
        </div>
      )}

      {/* 3b. Manual Upload */}
      {mode === "manual" && (
        <form onSubmit={handleUpload} className="space-y-4">
          <h2 className="text-xl font-semibold">2. Upload Your Photos</h2>
          <div className="text-sm text-gray-400">Front of ID:</div>
          <input type="file" name="id_front" onChange={handleFileChange} accept="image/*" required />
          <div className="text-sm text-gray-400">Back of ID:</div>
          <input type="file" name="id_back" onChange={handleFileChange} accept="image/*" required />
          <div className="text-sm text-gray-400">Selfie with ID:</div>
          <input type="file" name="selfie" onChange={handleFileChange} accept="image/*" required />
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-6 py-2 text-white rounded ${canSubmit ? "bg-primary" : "bg-gray-600 cursor-not-allowed"}`}
          >
            Submit & Upload
          </button>
          {uploadError && <p className="text-red-400 mt-2">{uploadError}</p>}
        </form>
      )}
    </div>
  );
}
