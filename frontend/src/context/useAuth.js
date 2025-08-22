import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// useAuth returns the auth context
export function useAuth() {
  return useContext(AuthContext);
}
