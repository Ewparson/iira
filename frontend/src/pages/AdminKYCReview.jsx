// src/pages/AdminKYCReview.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default function AdminKYCReview() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [notes, setNotes] = useState({});
  const [reviews, setReviews] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // email currently being reviewed

  // get token from storage (unified)
  const authToken =
    sessionStorage.getItem("poic_jwt") ||
    localStorage.getItem("poic_jwt") ||
    localStorage.getItem("token") ||
    "";

  useEffect(() => {
    if (!user?.isAdmin) return;

    const ctrl = new AbortController();

    async function fetchPending() {
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch(`${API_BASE}/api/admin/kyc-pending`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPending(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") setStatus(`Failed to load KYC requests: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchPending();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleReview = async (email, decision) => {
    setStatus("");
    setBusy(email);
    try {
      const res = await fetch(`${API_BASE}/api/admin/kyc-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ email, status: decision, notes: notes[email] || "" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

      // record decision + optimistically remove from list
      setReviews((r) => ({ ...r, [email]: decision }));
      setPending((list) => list.filter((u) => u.email !== email));
      setStatus(`User ${email} KYC ${decision}.`);
    } catch (err) {
      setStatus(err.message || "Review failed.");
    } finally {
      setBusy(null);
    }
  };

  if (!user?.isAdmin) return <p>Access denied.</p>;
  if (loading) return <p>Loading pending KYC submissions…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🧾 KYC Review Board</h1>

      {status && (
        <div
          className={`text-sm ${
            /failed|error|HTTP/i.test(status) ? "text-red-400" : "text-yellow-300"
          }`}
          role="status"
          aria-live="polite"
        >
          {status}
        </div>
      )}

      {pending.length === 0 ? (
        <p className="text-white/60">No pending KYC submissions.</p>
      ) : (
        pending.map((u) => {
          const decision = reviews[u.email];
          const imgKeys = ["id_front_url", "id_back_url", "selfie_url"];

          return (
            <div key={u.email} className="card p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <p>
                  <strong>Name:</strong>{" "}
                  {u.first_name} {u.middle_name ? `${u.middle_name} ` : ""}
                  {u.last_name}
                </p>
                <p>
                  <strong>Email:</strong> {u.email}
                </p>
                <p className="sm:col-span-2">
                  <strong>Birthday:</strong>{" "}
                  {u.dob
                    ? new Date(u.dob).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {imgKeys.map((key, idx) => {
                  const label = ["ID Front", "ID Back", "Selfie"][idx];
                  const raw = u[key] || "";
                  const href = /^https?:/i.test(raw) ? raw : `${API_BASE}${raw}`;
                  return (
                    <div key={key} className="space-y-2">
                      <p className="text-sm text-white/60">{label}:</p>
                      <a href={href} target="_blank" rel="noreferrer">
                        <img
                          src={href}
                          alt={label}
                          className="w-full h-40 object-cover rounded"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  );
                })}
              </div>

              <textarea
                className="input min-h-[90px]"
                placeholder="Review notes (optional)"
                value={notes[u.email] || ""}
                onChange={(e) => setNotes({ ...notes, [u.email]: e.target.value })}
              />

              {decision ? (
                <p
                  className={`mt-2 font-bold ${
                    decision === "approved" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ➤ {decision.toUpperCase()}
                </p>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(u.email, "approved")}
                    className="btn bg-green-600 hover:bg-green-500 text-white disabled:opacity-50"
                    disabled={busy === u.email}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleReview(u.email, "rejected")}
                    className="btn btn-primary disabled:opacity-50"
                    disabled={busy === u.email}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
