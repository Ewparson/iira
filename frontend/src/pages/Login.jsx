import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/blocktech");
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    const base = (process.env.REACT_APP_API_URL || "http://localhost:3001").replace(/\/$/, "");
    window.location.href = `${base}/api/auth/google`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pt-6">
      <h1 className="text-3xl font-bold">Login</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="input"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary w-full disabled:opacity-50" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && (
          <div className="text-red-400 text-sm" role="alert" aria-live="polite">
            {error}
          </div>
        )}
      </form>

      <div className="border-t border-white/10" />

      <button type="button" onClick={handleGoogleLogin} className="btn btn-ghost w-full disabled:opacity-50" disabled={loading}>
        <img src="/media/google-logo.png" alt="" className="h-5 mr-2" />
        <span>Sign in with Google</span>
      </button>
    </div>
  );
}
