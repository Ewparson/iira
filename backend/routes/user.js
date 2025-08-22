// backend/routes/user.js
const express = require('express');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Use env var for DB path
const db = new sqlite3.Database(process.env.DB_PATH || './users.db');

// GET /api/user/status
router.get('/status', (req, res) => {
  // 1️⃣ Grab token from cookie or Authorization header
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    const [scheme, val] = req.headers.authorization.split(' ');
    if (scheme === 'Bearer') token = val;
  }
  if (!token) return res.status(401).json({ error: 'No token provided' });

  // 2️⃣ Verify and decode
  let email;
  try {
    ({ email } = jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // 3️⃣ Fetch user status from DB
  db.get(
    `SELECT
       email_verified,
       kyc_submitted,
       kyc_status,
       kyc_id_front,
       kyc_id_back,
       kyc_selfie,
       first_name,
       last_name,
       dob,
       totp_secret,
       payment_method_added,
       is_admin
     FROM users WHERE email = ?`,
    [email],
    (err, u) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      if (!u) return res.status(404).json({ error: 'User not found' });

      // Determine which KYC steps remain
      const needs = [];
      if (!u.first_name)    needs.push('first_name');
      if (!u.last_name)     needs.push('last_name');
      if (!u.dob)           needs.push('dob');
      if (!u.kyc_id_front)  needs.push('id_front');
      if (!u.kyc_id_back)   needs.push('id_back');
      if (!u.kyc_selfie)    needs.push('selfie');

      res.json({
        email_verified:        !!u.email_verified,
        kyc_submitted:         !!u.kyc_submitted,
        kyc_status:            needs.length ? 'incomplete' : u.kyc_status,
        kyc_needs:             needs,
        twofa_enabled:         !!u.totp_secret,
        payment_method_added:  !!u.payment_method_added,
        isAdmin:               !!u.is_admin,
        email,                  // shorthand for email: email
      });
    }
  );
});

// POST /api/user/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

module.exports = router;
