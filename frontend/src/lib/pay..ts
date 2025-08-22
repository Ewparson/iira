// src/lib/pay.ts
const PAY_BASE =
  process.env.REACT_APP_PAY_API?.trim() || "http://127.0.0.1:8000";

function makeHeaders(extra: HeadersInit = {}, adminKey?: string): HeadersInit {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) base["X-Admin-Key"] = adminKey; // dev/admin only
  return { ...base, ...(extra as any) };
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const pay = {
  base: PAY_BASE,

  health<T = { ok: boolean; ts: number }>() {
    return fetch(`${PAY_BASE}/healthz`).then(asJson<T>);
  },

  // Start a Stripe checkout session
  checkout<T = { checkout_url: string }>(
    sku: string,
    to_addr: string,
    count = 1
  ) {
    return fetch(`${PAY_BASE}/payments/stripe/checkout`, {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({ sku, to_addr, count }),
    }).then(asJson<T>);
  },

  // Dev-only admin ops (mempool tx, etc.)
  admin: {
    post<T = any>(path: string, body: unknown, adminKey: string) {
      return fetch(`${PAY_BASE}${path}`, {
        method: "POST",
        headers: makeHeaders({}, adminKey),
        body: JSON.stringify(body),
      }).then(asJson<T>);
    },
  },
};
