// frontend/src/pages/Mail.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function Mail() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inbox, setInbox] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Fetch inbox + build system notifications
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    Promise.all([
      // 1) Fetch user inbox
      fetch(`${API_URL}/api/mail/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setInbox(data.inbox || [])),

      // 2) Fetch user status for system messages
      fetch(`${API_URL}/api/user/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data || data.error) {
            setSystemMessages([]);
            return;
          }

          const sysMsgs = [];

          // 🔧 UPDATED: Show pending whenever status === "pending" and no missing fields
          if (data.kyc_status === "pending" && data.kyc_needs.length === 0) {
            sysMsgs.push({
              id: "sys-kyc-pending",
              subject: "KYC Pending",
              body:
                "We’ve received your documents and they’re under review. We’ll notify you when it’s complete.",
              href: null,
              timestamp: new Date(),
              read: false,
              system: true,
            });
          }
          // Otherwise, fall back to “finish onboarding” for missing pieces
          else {
            const steps = [];
            if (!data.email_verified) {
              steps.push(
                `<a href="/verify-email" class="underline text-blue-400">verify your email</a>`
              );
            }
            if (data.kyc_needs?.length) {
              steps.push(
                `<a href="/onboarding" class="underline text-blue-400">upload KYC documents</a>`
              );
            }
            if (!data.twofa_enabled) {
              steps.push(
                `<a href="/enable-2fa" class="underline text-blue-400">enable 2FA</a>`
              );
            }
            if (!data.payment_method_added) {
              steps.push(
                `<a href="/add-payment" class="underline text-blue-400">add a payment method</a>`
              );
            }

            if (steps.length) {
              const sentence = steps
                .map((s, i) =>
                  i === 0
                    ? s
                    : i === steps.length - 1
                    ? `and ${s}`
                    : s
                )
                .join(", ");

              sysMsgs.push({
                id: "sys-onboarding",
                subject: "Finish your onboarding",
                body: `You need to finish your account setup to access all features: ${sentence}.`,
                href: "/onboarding",
                timestamp: new Date(),
                read: false,
                system: true,
              });
            }
          }

          // Always show 2FA prompt if not enabled
          if (!data.twofa_enabled) {
            sysMsgs.push({
              id: "sys-2fa-tx",
              subject: "Enable 2FA for transactions",
              body: `For security, you must <a href="/enable-2fa" class="underline text-blue-400">enable 2FA</a> before trading, deposits, or withdrawals.`,
              href: "/enable-2fa",
              timestamp: new Date(),
              read: false,
              system: true,
            });
          }

          setSystemMessages(sysMsgs);
        }),
    ]).finally(() => setLoading(false));
  }, [navigate]);

  // Mark a user message as read
  const markRead = (id) => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/mail/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    }).then(() => {
      setInbox((inbox) =>
        inbox.map((msg) => (msg.id === id ? { ...msg, read: 1 } : msg))
      );
    });
  };

  const allMessages = [...systemMessages, ...inbox];

  return (
    <div className="p-8 max-w-3xl mx-auto text-text">
      <h1 className="text-3xl font-bold mb-4">🛡️ Notifications & Account Status</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full">
          <h2 className="mb-2 text-lg">Messages from Iira.ai</h2>
          {loading && <div>Loading...</div>}
          <ul className="space-y-2">
            {allMessages.map((msg) => (
              <li
                key={msg.id}
                className={`p-3 rounded cursor-pointer transition hover:bg-gray-800 ${
                  selected?.id === msg.id ? "bg-gray-800" : "bg-surface"
                } ${
                  msg.read || msg.system
                    ? "opacity-70"
                    : "font-bold border-l-4 border-primary"
                }`}
                onClick={() => {
                  if (msg.system && msg.href) {
                    navigate(msg.href);
                  } else {
                    setSelected(msg);
                    if (!msg.read) markRead(msg.id);
                  }
                }}
              >
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{new Date(msg.timestamp).toLocaleString()}</span>
                  <span>{msg.read || msg.system ? "Read" : "Unread"}</span>
                </div>
                <div className="text-primary font-semibold">
                  {msg.subject || "(No subject)"}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  <span dangerouslySetInnerHTML={{ __html: msg.body }} />
                  {msg.system && msg.href && (
                    <span className="ml-2 underline text-blue-400">(Click to continue)</span>
                  )}
                </div>
              </li>
            ))}
            {allMessages.length === 0 && !loading && (
              <li className="text-gray-400">No system messages yet.</li>
            )}
          </ul>
        </div>
      </div>

      {selected && !selected.system && (
        <div className="mt-8 p-4 rounded bg-surface shadow">
          <div className="mb-2 text-xs text-gray-400">
            From: {selected.from_email || "system@iira.ai"}
          </div>
          <div className="mb-2 text-xs text-gray-400">
            Subject: <span className="text-text">{selected.subject || "(No subject)"}</span>
          </div>
          <div className="mb-2 text-xs text-gray-400">
            Sent: {new Date(selected.timestamp).toLocaleString()}
          </div>
          <div className="my-2 text-sm">{selected.body}</div>
          <button
            onClick={() => setSelected(null)}
            className="text-xs text-primary underline mt-2"
          >
            Back to List
          </button>
        </div>
      )}
    </div>
  );
}
