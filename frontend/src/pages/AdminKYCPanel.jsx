import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function AdminKYCPanel() {
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState({});
  const [q, setQ] = useState("");

  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`${API_URL}/api/admin/kyc-pending`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setRows(arr);
      const initial = {};
      arr.forEach((u) => (initial[u.email] = u.kyc_notes || ""));
      setNotes(initial);
    } catch (e) {
      if (e.name !== "AbortError") setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const setNote = useCallback((email, val) => {
    setNotes((n) => ({ ...n, [email]: val }));
  }, []);

  const review = useCallback(
    async (email, status) => {
      if (!token) {
        alert("Missing admin token.");
        return;
      }
      if (status === "rejected" && !(notes[email] && notes[email].trim())) {
        alert("Add a rejection note before rejecting.");
        return;
      }
      if (
        status === "rejected" &&
        !confirm(`Reject KYC for ${email}? This will notify the user.`)
      ) {
        return;
      }
      setSaving((s) => ({ ...s, [email]: true }));
      const prev = rows;
      const optimistic = rows.map((u) =>
        u.email === email
          ? { ...u, kyc_status: status, kyc_notes: notes[email] || "" }
          : u
      );
      setRows(optimistic);

      try {
        const res = await fetch(`${API_URL}/api/admin/kyc-review`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, status, notes: notes[email] || "" }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${msg}`);
        }
      } catch (e) {
        setRows(prev);
        alert(`Failed to update ${email}: ${e.message || e}`);
      } finally {
        setSaving((s) => ({ ...s, [email]: false }));
      }
    },
    [rows, notes, token]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((u) => {
      const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      return (
        (u.email || "").toLowerCase().includes(needle) ||
        name.includes(needle) ||
        (u.kyc_status || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q]);

  return (
    <div className="p-6 text-text">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-bold">Admin KYC Review</h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email, name, status"
            className="px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm w-64"
            data-testid="kyc-search"
          />
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm disabled:opacity-50"
          >
            Reload
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/40 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="opacity-75">No records.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-left">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2 w-[280px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const busy = !!saving[u.email];
                return (
                  <tr
                    key={u.email}
                    className="border-t border-gray-800 align-top"
                  >
                    <td className="px-3 py-2">
                      <div className="font-mono">{u.email}</div>
                      {u.submitted_at && (
                        <div className="text-xs opacity-70">
                          Submitted:{" "}
                          {new Date(u.submitted_at).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {(u.first_name || "").trim()} {(u.last_name || "").trim()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          u.kyc_status === "approved"
                            ? "bg-green-900/40 border border-green-700"
                            : u.kyc_status === "rejected"
                            ? "bg-red-900/40 border border-red-700"
                            : "bg-yellow-900/40 border border-yellow-700"
                        }`}
                      >
                        {u.kyc_status || "pending"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <textarea
                        className="w-72 h-16 px-2 py-1 rounded bg-gray-900 border border-gray-700"
                        placeholder="Optional notes…"
                        value={notes[u.email] ?? ""}
                        onChange={(e) => setNote(u.email, e.target.value)}
                        disabled={busy}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => review(u.email, "approved")}
                          disabled={busy}
                          className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded disabled:opacity-50"
                        >
                          {busy ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => review(u.email, "manual_review")}
                          disabled={busy}
                          className="bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded disabled:opacity-50"
                        >
                          {busy ? "…" : "Manual Review"}
                        </button>
                        <button
                          onClick={() => review(u.email, "rejected")}
                          disabled={busy}
                          className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded disabled:opacity-50"
                        >
                          {busy ? "…" : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
