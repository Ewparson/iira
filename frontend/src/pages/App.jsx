import React from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Login from "./Login";
import RequireRight from "../components/RequireRight";
import { Rights } from "../types";
import NavBar from "../components/NavBar";

function Dashboard() {
  const { rights, logout } = useAuth();
  return (
    <div className="space-y-6">
      <div>Rights bitmask: {rights}</div>
      <RequireRight right={Rights.NODE_EXECUTE} fallback={<div>No node rights</div>}>
        <button className="btn btn-ghost">Start Miner</button>
      </RequireRight>
      <RequireRight right={Rights.WALLET_ISSUE} fallback={<div>No wallet issue rights</div>}>
        <button className="btn btn-ghost ml-3">Issue Wallet</button>
      </RequireRight>
      <div><button onClick={logout} className="text-red-600">Logout</button></div>
    </div>
  );
}

export default function App() {
  const hasToken = !!sessionStorage.getItem("poic_jwt");
  return (
    <AuthProvider>
      <NavBar />
      <main className="app-main">
        <div className="app-container">
          {hasToken ? <Dashboard /> : <Login />}
        </div>
      </main>
    </AuthProvider>
  );
}
