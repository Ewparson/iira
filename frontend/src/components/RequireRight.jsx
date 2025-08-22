import React from "react";
import { useAuth } from "../context/AuthContext";

// Bitmask check: user has ALL bits in `right`
export default function RequireRight({ right, children, fallback = null }) {
  const { rights } = useAuth?.() || { rights: 0 };
  const has = (Number(rights) & Number(right)) === Number(right);
  return has ? children : fallback;
}
