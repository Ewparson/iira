import React, { useState } from "react";

export default function KYCUploadTest() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");

    if (!file || !email) {
      setError("Please provide an email and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("id_image", file);
    formData.append("email", email);

    try {
      const res = await fetch("http://localhost:3001/api/kyc-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      setStatus(`✅ Uploaded successfully as: ${data.filename}`);
    } catch (err) {
      setError("❌ Server error");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 text-text">
      <h1 className="text-2xl font-bold mb-4">Upload KYC Document</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-surface border border-gray-700"
          required
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 rounded bg-surface border border-gray-700"
          required
        />
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded font-bold"
        >
          Upload
        </button>
      </form>
      {status && <div className="text-green-400 mt-4">{status}</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
    </div>
  );
}
