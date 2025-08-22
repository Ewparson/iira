import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react"; // Optional: for icon (remove if not using lucide)

export default function KYCStart() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto p-6 bg-surface rounded-2xl shadow text-text">
      <h1 className="text-3xl font-bold mb-4 text-primary">Identity Verification (KYC)</h1>
      <p className="mb-4 text-gray-300">
        For your security and regulatory compliance, we require all users to verify their identity.
        This ensures we keep your account safe and follow international anti-fraud laws.
      </p>
      <ul className="mb-6 space-y-2">
        <li className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          Full legal name
        </li>
        <li className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          Date of birth
        </li>
        <li className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          Government-issued photo ID (front & back)
        </li>
        <li className="flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          Selfie (for liveness/identity match)
        </li>
      </ul>
      <button
        onClick={() => navigate("/kyc-upload")}
        className="w-full bg-primary text-white py-3 rounded-2xl font-bold text-lg hover:bg-primary/80 transition"
      >
        Start KYC Verification
      </button>
      <p className="mt-4 text-xs text-gray-500 text-center">
        We respect your privacy. Your documents are securely transmitted and handled by our regulated custodians.
      </p>
    </div>
  );
}
