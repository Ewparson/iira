import React, { useState } from "react";

export default function DownloadNodeButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const doDownload = async () => {
    setErr(""); setBusy(true);
    try {
      // Get the license_jwt you stored earlier (after mint/anon-mint)
      const license_jwt = localStorage.getItem("poic_license_jwt");
      if (!license_jwt) {
        setErr("No license found. Buy/mint a license first.");
        setBusy(false); return;
      }

      // Exchange license -> one-time URL
      const r = await fetch("/v1/license/exchange", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ license_jwt })
      });
      if (!r.ok) {
        const j = await r.json().catch(()=>({detail:r.statusText}));
        throw new Error(j.detail || "exchange failed");
      }
      const j = await r.json();

      // Navigate browser to signed URL (starts download)
      window.location.href = j.download_url; // short-lived, one-time
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={doDownload}
        disabled={busy}
        className="px-4 py-2 rounded-2xl bg-red-600 text-white disabled:opacity-50"
      >
        {busy ? "Authorizing…" : "Download Node"}
      </button>
      {err && <span className="text-sm text-red-400">{err}</span>}
    </div>
  );
}
