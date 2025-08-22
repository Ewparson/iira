const express = require('express');
const db = require('../db/pool');
const router = express.Router();

// health
router.get('/health', async (_req, res) => {
  try {
    const r = await db.query('select 1 as ok');
    res.json({ ok: true, db: r.rows?.[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// create or upsert a license (for tests/dev)
router.post('/licenses', async (req, res) => {
  try {
    const { license_id, owner_addr, kind, status = 'active' } = req.body || {};
    if (!license_id || !owner_addr || !kind) {
      return res.status(400).json({ error: 'missing_fields' });
    }
    const { rows } = await db.query(
      `INSERT INTO licenses (license_id, owner_addr, kind, status)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (license_id) DO UPDATE
         SET owner_addr=EXCLUDED.owner_addr,
             kind=EXCLUDED.kind,
             status=EXCLUDED.status
       RETURNING license_id, owner_addr, kind, status, paid_at, expires_at, created_at, updated_at`,
      [license_id, owner_addr, kind, status]
    );
    res.json({ ok: true, license: rows[0] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// read one
router.get('/licenses/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT license_id, owner_addr, kind, status, paid_at, expires_at, created_at, updated_at
         FROM licenses WHERE license_id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'license_not_found' });
    res.json({ ok: true, license: rows[0] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// set expires_at (ISO string; default now)
router.put('/licenses/:id/expires', async (req, res) => {
  try {
    const iso = String(req.body?.expires_at || new Date().toISOString());
    const { rows } = await db.query(
      `UPDATE licenses
         SET expires_at = $1
       WHERE license_id = $2
       RETURNING license_id, owner_addr, kind, status, paid_at, expires_at, created_at, updated_at`,
      [iso, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'license_not_found' });
    res.json({ ok: true, license: rows[0] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// set paid_at (ISO string; default now)
router.put('/licenses/:id/paid', async (req, res) => {
  try {
    const iso = String(req.body?.paid_at || new Date().toISOString());
    const { rows } = await db.query(
      `UPDATE licenses
         SET paid_at = $1
       WHERE license_id = $2
       RETURNING license_id, owner_addr, kind, status, paid_at, expires_at, created_at, updated_at`,
      [iso, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'license_not_found' });
    res.json({ ok: true, license: rows[0] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
