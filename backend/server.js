// backend/server.js
"use strict";

const path         = require("path");
const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit    = require("express-rate-limit");
const fs           = require("fs");
const http         = require("http");
const dotenv       = require("dotenv");

dotenv.config();

// -----------------------------
// CORS allowlist (multi-origin)
// -----------------------------
const ALLOWED = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const app = express();
app.set("trust proxy", 1);

// --------------------------------------------------------------------
// Stripe webhook MUST be mounted BEFORE JSON body parser (raw body)
// --------------------------------------------------------------------
const stripeWebhook = require("./routes/stripe_webhook");
app.use("/api", stripeWebhook);

// -----------------------------
// CORS (dev-safe): allow no-origin + allowlist
// -----------------------------
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);           // curl / Stripe CLI / native apps
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(null, false);                       // block others; do NOT throw
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// -----------------------------
// Parsers / limits
// -----------------------------
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// -----------------------------
// Rate limit (API only)
// -----------------------------
app.use("/api", rateLimit({ windowMs: 60_000, max: 200 }));

// -----------------------------
// Static uploads
// -----------------------------
const uploads = path.join(__dirname, "uploads");
if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });
app.use("/uploads", express.static(uploads));

// -----------------------------
// Dev request logger
// -----------------------------
app.use((req, _res, next) => { try { console.log("[HTTP]", req.method, req.url); } catch {} next(); });

// -----------------------------
// Routers
// -----------------------------
const authRouter = require("./routes/auth");
app.use("/api/auth", authRouter);
console.log("🔗 mounted authRouter at /api/auth");

const db = require("./db/pool"); // DATABASE_URL optional in dev (stubbed)

const licensesRouter = require("./routes/licenses");
app.use("/api", licensesRouter);
console.log("🔗 mounted licensesRouter at /api");

const paymentsRouter = require("./routes/payments");
app.use("/api/payments", paymentsRouter); // API version
app.use("/payments", paymentsRouter);     // legacy/frontend
console.log("🔗 mounted paymentsRouter at /api/payments and /payments");

// -----------------------------
// Health
// -----------------------------
app.get("/api/health", async (_req, res) => {
  try {
    const r = await db.query("select now() as now");
    res.json({ ok: true, db: true, now: r.rows?.[0]?.now });
  } catch (_e) {
    // dev-friendly: don't 500 health just because DB is absent
    res.json({ ok: true, db: false });
  }
});

// -----------------------------
// Error handler
// -----------------------------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// -----------------------------
// Boot (bigger header size fixes 431)
// -----------------------------
const PORT = process.env.PORT || 3001;
const server = http.createServer({ maxHeaderSize: 262144 }, app);
server.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`));
