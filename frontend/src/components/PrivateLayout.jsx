import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth"; // <-- use curly braces!

export default function PrivateLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div>Checking authentication...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
