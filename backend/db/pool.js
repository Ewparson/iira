"use strict";
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;

if (url) {
  const opts = { connectionString: url };
  if (process.env.PGSSL === "1") opts.ssl = { rejectUnauthorized: false };
  const pool = new Pool(opts);
  pool.on("error", (e) => console.error("PG pool error:", e));
  module.exports = pool;
} else {
  // Fallback stub so /api/health works without Postgres in dev
  module.exports = {
    query: async (text/*, params*/) => {
      if (/select\s+now\(\)/i.test(String(text))) {
        return { rows: [{ now: new Date().toISOString() }] };
      }
      return { rows: [] };
    }
  };
}
