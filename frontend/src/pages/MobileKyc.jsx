// src/pages/MobileKyc.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MobileKyc() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      localStorage.setItem("token", t);
      navigate("/onboarding");
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="p-8 text-center">
      Redirecting to KYC…
    </div>
  );
}
