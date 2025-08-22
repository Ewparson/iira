// frontend/src/pages/Signup.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => abortRef.current?.abort(), []);

  const validEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const pwScore = useMemo(() => {
    const pw = password;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw)) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    s = Math.min(4, Math.floor(s / 2));
    return { score: s, label: ["Too weak", "Weak", "Okay", "Strong", "Very strong"][s] };
  }, [password]);

  const policyOk = useMemo(
    () =>
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password),
    [password]
  );

  const canSubmit = validEmail && policyOk && confirm === password && !submitting;

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setInfo("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: ctrl.signal,
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setInfo(data.message || "Signup successful. Check your email to verify your account.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(
        err?.message === "Failed to fetch" ? "Could not connect to server." : err?.message || "Signup failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <h1 className="text-3xl font-bold">Create your account</h1>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm opacity-80">Email</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!validEmail && email.length > 0 && (
            <p className="text-xs text-red-400 mt-1">Enter a valid email.</p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm opacity-80">Password</label>
          <div className="relative">
            <input
              className="input pr-16"
              type={showPw ? "text" : "password"}
              placeholder="At least 8 chars, Aa1!"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span
              className={
                pwScore.score >= 3 ? "text-green-400" : pwScore.score >= 2 ? "text-amber-400" : "text-red-400"
              }
            >
              Strength: {pwScore.label}
            </span>
            <span className="opacity-70">Must include Aa, 1, and a symbol</span>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm opacity-80">Confirm Password</label>
          <input
            className="input"
            type="password"
            placeholder="Repeat password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {confirm && confirm !== password && (
            <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
          )}
        </div>

        <button type="submit" disabled={!canSubmit} className="btn btn-primary w-full disabled:opacity-50">
          {submitting ? "Creating…" : "Create Account"}
        </button>
      </form>

      {info && (
        <div className="text-green-400 text-sm" role="status" aria-live="polite">
          {info}
        </div>
      )}
      {error && (
        <div className="text-red-400 text-sm" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </div>
  );
}
