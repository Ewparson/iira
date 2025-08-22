// src/lib/api.ts
// CRA/TS-safe helper (no import.meta). Supports window.__PAY_API__ and REACT_APP_*.

type Json = Record<string, unknown>;

declare global {
  interface Window {
    __PAY_API__?: string;
  }
}

const pickBase = (): string => {
  const fromWin =
    typeof window !== "undefined" ? window.__PAY_API__ : undefined;
  const raw =
    fromWin ||
    process.env.REACT_APP_PAY_API ||
    process.env.REACT_APP_PAY_API_URL ||
    "";

  return String(raw || "").replace(/\/+$/, "");
};

const API_BASE = pickBase();
const build = (path: string) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

type HeadersMap = Record<string, string>;

function headers(extra?: HeadersMap, token?: string): HeadersMap {
  const h: HeadersMap = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return { ...h, ...(extra || {}) };
}

async function toJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data: any = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg =
      (isJson && (data?.detail || data?.error)) ||
      (isJson ? JSON.stringify(data) : String(data)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

interface ReqOpts {
  body?: unknown;
  token?: string;
  headers?: HeadersMap;
  timeoutMs?: number;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  opts: ReqOpts = {}
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(build(path), {
      method,
      headers: headers(opts.headers, opts.token),
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    return await toJson<T>(res);
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  base: API_BASE,

  get<T>(path: string, token?: string, timeoutMs?: number) {
    return request<T>("GET", path, { token, timeoutMs });
  },
  post<T>(path: string, body?: unknown, token?: string, timeoutMs?: number) {
    return request<T>("POST", path, { body, token, timeoutMs });
  },
  postAuth<T>(path: string, body: unknown, token: string, timeoutMs?: number) {
    return request<T>("POST", path, { body, token, timeoutMs });
  },
  postAdmin<T>(
    path: string,
    body: unknown,
    adminKey: string,
    timeoutMs?: number
  ) {
    return request<T>("POST", path, {
      body,
      headers: { "X-Admin-Key": adminKey },
      timeoutMs,
    });
  },

  payments: {
    stripeCheckout<T = { checkout_url: string }>(
      sku: string,
      to_addr: string,
      count = 1
    ) {
      return request<T>("POST", "/api/payments/stripe/checkout", {
        body: { sku, to_addr, count },
      });
    },
    coinbaseCharge<T = Json>(
      sku: string,
      to_addr: string,
      count = 1
    ) {
      return request<T>("POST", "/payments/coinbase/charge", {
        body: { sku, to_addr, count },
      });
    },
  },
};

export default api;
