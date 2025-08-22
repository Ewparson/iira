// src/pages/Admin.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminKYCReview from "./AdminKYCReview";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Kick non-admins back cleanly
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/blocktech", { replace: true });
    }
  }, [user, navigate]);

  if (!user || !user.isAdmin) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <AdminKYCReview />
    </div>
  );
}
