// src/pages/AddPayment.jsx
import React, { useState } from "react";
import api from "../lib/api"; // resolves to src/lib/api/index.js

const getAdminKey = () =>
  process.env.REACT_APP_PAY_API_KEY ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_PAY_API_KEY) ||
  "";

export default function AddPayment() {
  const [addr, setAddr] = useState("itc1qdemo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startWalletCheckout = async () => {
    if (busy) return;
    const a = addr.trim();
    if (!a) {
      setError("Address required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { checkout_url } = await api.payments.stripeCheckout(
        "WALLET_LICENSE",
        a,
        1
      );
      if (!checkout_url) throw new Error("No checkout URL returned.");
      window.location.assign(checkout_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const destroyWallet = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const ADMIN = getAdminKey();
      if (!ADMIN)
        throw new Error(
          "Missing dev admin key (REACT_APP_PAY_API_KEY / VITE_PAY_API_KEY)."
        );
      await api.postAdmin(
        "/admin/op",
        { action: "destroy_wallet", address: addr.trim() },
        ADMIN
      );
      alert("Destroy submitted (mempool JSON written).");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const adminKeyPresent = !!getAdminKey();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <div className="space-y-2">
        <label className="block font-medium">PoIC Address</label>
        <input
          className="input"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="itc1q..."
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="btn btn-primary disabled:opacity-60"
          disabled={busy}
          onClick={startWalletCheckout}
          type="button"
        >
          {busy ? "Please wait..." : "Buy WALLET_LICENSE (Stripe)"}
        </button>

        {adminKeyPresent && (
          <button
            className="btn btn-ghost disabled:opacity-60"
            disabled={busy}
            onClick={destroyWallet}
            type="button"
          >
            Destroy wallet (admin)
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <p className="text-sm opacity-70">
        PoIC Payments API: <code>{api.base || "http://127.0.0.1:8000"}</code>
      </p>
    </div>
  );
}
