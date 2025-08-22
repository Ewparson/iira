// Minimal fetch client. Uses CRA proxy if no base is provided.
// Base priority: window.__PAY_API__ > REACT_APP_PAY_API(_URL) > "" (proxy)
const pickBase = () => {
  const winBase =
    typeof window !== "undefined" && window.__PAY_API__ ? window.__PAY_API__ : "";
  const envBase =
    process.env.REACT_APP_PAY_API || process.env.REACT_APP_PAY_API_URL || "";
  return (winBase || envBase).replace(/\/+$/, "");
};

const API_BASE = pickBase();
const build = (p) => `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

async function req(method, path, body, headers = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(build(path), {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (res.status === 204) return undefined;
    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();
    if (!res.ok) {
      const msg =
        (isJson && (data?.detail || data?.error)) ||
        (isJson ? JSON.stringify(data) : String(data)) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

const api = {
  base: API_BASE,
  get: (p) => req("GET", p),
  post: (p, body) => req("POST", p, body),
  postAdmin: (p, body, adminKey) =>
    req("POST", p, body, { "X-Admin-Key": adminKey }),

  payments: {
    stripeCheckout: (sku, to_addr, count = 1) =>
      req("POST", "/payments/stripe/checkout", { sku, to_addr, count }),
    coinbaseCharge: (sku, to_addr, count = 1) =>
      req("POST", "/payments/coinbase/charge", { sku, to_addr, count }),
  },
};

export default api;
