import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function IntellaCoin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // state
  const [status, setStatus] = useState({ loading: true, error: null, data: null });
  const [sales, setSales] = useState({
    loading: true,
    error: null,
    summary: {
      nodes: { totalSold: 0, totalRevenue: 0, currency: "USD" },
      wallets: { totalSold: 0, totalRevenue: 0, currency: "USD" },
    },
    recent: [],
  });

  // helpers (hooks must be BEFORE any early return)
  const currency = useMemo(
    () => sales?.summary?.nodes?.currency || sales?.summary?.wallets?.currency || "USD",
    [sales?.summary]
  );
  const money = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }),
    [currency]
  );
  const dateFmt = useCallback((s) => new Date(s).toLocaleString(), []);

  // data fetchers
  const fetchStatus = useCallback(() => {
    const ac = new AbortController();
    const token = localStorage.getItem("token") || "";
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/status`, {
          method: "GET",
          headers: token
            ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            : { "Content-Type": "application/json" },
          credentials: token ? "omit" : "include",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to load status");
        const data = await res.json();
        setStatus({ loading: false, error: null, data });
      } catch (e) {
        if (!ac.signal.aborted)
          setStatus({ loading: false, error: e.message || "Network error", data: null });
      }
    })();
    return () => ac.abort();
  }, []);

  const fetchSales = useCallback(() => {
    const ac = new AbortController();
    const token = localStorage.getItem("token") || "";
    (async () => {
      try {
        // summary (consolidated or per-type)
        let summary;
        const sumRes = await fetch(`${API_URL}/api/sales/summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: token ? "omit" : "include",
          signal: ac.signal,
        });
        if (sumRes.ok) {
          summary = await sumRes.json();
        } else {
          const [nodesRes, walletsRes] = await Promise.all([
            fetch(`${API_URL}/api/sales/nodes/summary`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: token ? "omit" : "include",
              signal: ac.signal,
            }),
            fetch(`${API_URL}/api/sales/wallets/summary`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              credentials: token ? "omit" : "include",
              signal: ac.signal,
            }),
          ]);
          const nodes = nodesRes.ok
            ? await nodesRes.json()
            : { totalSold: 0, totalRevenue: 0, currency: "USD" };
          const wallets = walletsRes.ok
            ? await walletsRes.json()
            : { totalSold: 0, totalRevenue: 0, currency: "USD" };
          summary = { nodes, wallets };
        }

        // recent
        const recRes = await fetch(`${API_URL}/api/sales/recent?limit=10`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: token ? "omit" : "include",
          signal: ac.signal,
        });
        const recent = recRes.ok ? await recRes.json() : [];

        setSales({ loading: false, error: null, summary, recent });
      } catch (e) {
        if (!ac.signal.aborted)
          setSales((s) => ({ ...s, loading: false, error: e.message || "Failed to load sales" }));
      }
    })();
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!user) return;
    const c1 = fetchStatus();
    const c2 = fetchSales();
    return () => {
      c1 && c1();
      c2 && c2();
    };
  }, [user, fetchStatus, fetchSales]);

  // guards
  if (loading) return <div className="p-8 text-center">Checking authentication…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (status.loading) return <div className="p-8 text-center">Loading IntellaCoin…</div>;
  if (status.error) return <div className="p-8 text-center text-red-600">{status.error}</div>;

  const {
    email_verified = false,
    kyc_status = "incomplete",
    twofa_enabled = false,
    payment_method_added = false,
  } = status.data || {};

  const blocked =
    !email_verified || kyc_status !== "approved" || !twofa_enabled || !payment_method_added;

  const nextStep =
    !email_verified
      ? { label: "Verify Email", to: "/verify" }
      : kyc_status === "pending" || kyc_status === "incomplete"
      ? { label: "Complete Onboarding", to: "/onboarding" }
      : !twofa_enabled
      ? { label: "Enable 2FA", to: "/enable-2fa" }
      : !payment_method_added
      ? { label: "Add Payment Method", to: "/add-payment" }
      : null;

  return (
    <div className="flex flex-col items-center min-h-[80vh] bg-[#f8fafc] dark:bg-background py-12 px-4">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">IntellaCoin</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchSales}
              className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Refresh
            </button>
          </div>
        </div>

        {blocked && nextStep && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-6 border border-yellow-300">
            <div className="font-semibold mb-1">🚧 Trading Locked</div>
            <div>
              You must complete: <b>{nextStep.label}</b>
            </div>
            <Link
              to={nextStep.to}
              className="inline-block mt-2 underline text-blue-700 hover:text-blue-900"
            >
              Go to {nextStep.label}
            </Link>
          </div>
        )}

        {/* SALES DASHBOARD */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sales</h2>

          {/* Summary cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
              <div className="text-sm opacity-70">Nodes Sold</div>
              <div className="text-3xl font-bold mt-1">
                {sales.loading ? "…" : sales.summary.nodes.totalSold}
              </div>
              <div className="mt-2 text-sm opacity-80">
                Revenue: {sales.loading ? "…" : money.format(sales.summary.nodes.totalRevenue || 0)}
              </div>
            </div>

            <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
              <div className="text-sm opacity-70">Wallets Sold</div>
              <div className="text-3xl font-bold mt-1">
                {sales.loading ? "…" : sales.summary.wallets.totalSold}
              </div>
              <div className="mt-2 text-sm opacity-80">
                Revenue:{" "}
                {sales.loading ? "…" : money.format(sales.summary.wallets.totalRevenue || 0)}
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="mt-6 rounded-xl border overflow-hidden bg-white dark:bg-neutral-900">
            <div className="px-4 py-3 border-b font-semibold">Recent Orders</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left opacity-70">
                  <tr>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Buyer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.loading ? (
                    <tr>
                      <td className="px-4 py-3" colSpan={5}>
                        Loading…
                      </td>
                    </tr>
                  ) : sales.error ? (
                    <tr>
                      <td className="px-4 py-3 text-red-600" colSpan={5}>
                        {sales.error}
                      </td>
                    </tr>
                  ) : sales.recent?.length ? (
                    sales.recent.map((o) => (
                      <tr
                        key={o.id || `${o.type}-${o.created_at}-${o.buyer || "anon"}`}
                        className="border-t"
                      >
                        <td className="px-4 py-2 capitalize">{o.type}</td>
                        <td className="px-4 py-2">
                          {o.buyer?.replace(/(.{2}).+(@)/, "$1***$2") || "—"}
                        </td>
                        <td className="px-4 py-2">
                          {money.format(o.amount || 0)} {o.currency || currency}
                        </td>
                        <td className="px-4 py-2">{o.status || "paid"}</td>
                        <td className="px-4 py-2">{o.created_at ? dateFmt(o.created_at) : "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-3 opacity-70" colSpan={5}>
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Core modules */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
            <div className="font-semibold mb-2">Wallet</div>
            <div className="text-sm opacity-80">Balances, deposit, withdraw.</div>
            <button
              className="mt-3 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/80"
              onClick={() => navigate("/wallet")}
            >
              Open Wallet
            </button>
          </div>

          <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
            <div className="font-semibold mb-2">Mine</div>
            <div className="text-sm opacity-80">Start/stop PoIC mining.</div>
            <button
              className="mt-3 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/80"
              onClick={() => navigate("/mine")}
            >
              Open Miner
            </button>
          </div>

          <div className="rounded-xl border p-4 shadow-sm bg-white dark:bg-neutral-900">
            <div className="font-semibold mb-2">Validate</div>
            <div className="text-sm opacity-80">Model validation & jobs.</div>
            <button
              className="mt-3 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/80"
              onClick={() => navigate("/validate")}
            >
              Open Validator
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
