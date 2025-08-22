import React, { useState, useEffect } from "react";
import QRCode from "qrcode.react";

// If testing on your local network, replace <YOUR-PC-IP> with your machine's LAN address
const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function KYCUpload() {
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    id_number: "",
  });
  const [files, setFiles] = useState({ id_front: null, id_back: null, selfie: null });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(true);

  // Hide QR on small screens for better UX
  useEffect(() => {
    if (window.innerWidth < 640) setShowQR(false);
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFiles((f) => ({ ...f, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // Validate files
    if (!files.id_front || !files.id_back || !files.selfie) {
      setError("Please upload front, back and selfie images.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    Object.entries(files).forEach(([k, v]) => formData.append(k, v));

    try {
      const res = await fetch(`${API_URL}/api/kyc-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "KYC upload failed.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setStatus("✅ KYC documents uploaded. Verification in progress.");
      setForm({ first_name: "", middle_name: "", last_name: "", dob: "", id_number: "" });
      setFiles({ id_front: null, id_back: null, selfie: null });
      document.getElementById("kyc-form").reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setLoading(false);
      setError(
        "❌ Server error during KYC upload. Is the backend running and accessible?"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 text-text">
      <h1 className="text-2xl font-bold mb-4">Submit Your KYC Documents</h1>

      {showQR && (
        <div className="flex flex-col items-center my-6">
          <QRCode value={window.location.href} size={128} />
          <p className="mt-2 text-gray-400 text-sm text-center">
            Scan this QR code to pick up on mobile.
          </p>
        </div>
      )}

      <form
        id="kyc-form"
        onSubmit={handleSubmit}
        className="space-y-4"
        encType="multipart/form-data"
      >
        <input
          name="first_name"
          placeholder="First Name"
          required
          className="w-full p-2 rounded bg-surface border border-gray-700"
          value={form.first_name}
          onChange={handleChange}
        />
        <input
          name="middle_name"
          placeholder="Middle Name (optional)"
          className="w-full p-2 rounded bg-surface border border-gray-700"
          value={form.middle_name}
          onChange={handleChange}
        />
        <input
          name="last_name"
          placeholder="Last Name"
          required
          className="w-full p-2 rounded bg-surface border border-gray-700"
          value={form.last_name}
          onChange={handleChange}
        />
        <input
          name="dob"
          type="date"
          required
          className="w-full p-2 rounded bg-surface border border-gray-700"
          value={form.dob}
          onChange={handleChange}
        />
        <input
          name="id_number"
          placeholder="Government ID Number"
          required
          className="w-full p-2 rounded bg-surface border border-gray-700"
          value={form.id_number}
          onChange={handleChange}
        />

        <div className="text-sm text-gray-400">
          Upload front of ID, back of ID, and a selfie:
        </div>
        <input
          type="file"
          name="id_front"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full p-2 file:bg-primary file:text-white file:rounded file:px-4 file:py-2"
        />
        <input
          type="file"
          name="id_back"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full p-2 file:bg-primary file:text-white file:rounded file:px-4 file:py-2"
        />
        <input
          type="file"
          name="selfie"
          accept="image/*"
          required
          onChange={handleFileChange}
          className="w-full p-2 file:bg-primary file:text-white file:rounded file:px-4 file:py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-2xl font-bold text-lg hover:bg-primary/80 transition disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload KYC"}
        </button>
      </form>

      {status && <div className="text-green-400 mt-4">{status}</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
    </div>
  );
}
