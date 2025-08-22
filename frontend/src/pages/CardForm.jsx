// src/components/CardForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default function CardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (!stripe || !elements) {
      setMsg("Stripe is not ready. Try again in a moment.");
      setLoading(false);
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      setMsg("Card element not found.");
      setLoading(false);
      return;
    }

    // 1) Create PaymentMethod
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card,
    });

    if (error) {
      setMsg(error.message || "Card error.");
      setLoading(false);
      return;
    }

    // 2) Send to backend to attach/store
    const token =
      sessionStorage.getItem("poic_jwt") ||
      localStorage.getItem("poic_jwt") ||
      localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE}/api/payments/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.error || `Request failed (HTTP ${res.status}).`);
      } else if (data.success) {
        setMsg("Payment method added successfully.");
        setTimeout(() => navigate("/blocktech"), 800);
      } else {
        setMsg(data.error || "Failed to add payment method.");
      }
    } catch {
      setMsg("Server error. Could not add payment method.");
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: "#ffffff",
        fontFamily: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": { color: "#aab7c4" },
      },
      invalid: { color: "#fa755a", iconColor: "#fa755a" },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-white/80">Credit or Debit Card</label>
      <div className="card p-4">
        <CardElement options={cardElementOptions} />
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full disabled:opacity-50"
        disabled={loading || !stripe}
      >
        {loading ? "Processing..." : "Add Payment Method"}
      </button>

      {msg && (
        <div
          className={`text-sm ${
            /successfully/i.test(msg) ? "text-green-400" : "text-red-400"
          }`}
          role="status"
          aria-live="polite"
        >
          {msg}
        </div>
      )}
    </form>
  );
}
