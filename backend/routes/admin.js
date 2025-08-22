/** @ts-nocheck */
// backend/routes/admin.js

const express = require("express");
const jwt     = require("jsonwebtoken");
const path    = require("path");
const router  = express.Router();
const sqlite3 = require("sqlite3").verbose();

// open the same DB used by the server
const db = new sqlite3.Database(path.join(__dirname, "..", "users.db"));

// Middleware to ensure the requester is an admin
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Invalid authorization header" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "SUPER_SECRET_KEY"
    );
    if (!payload.isAdmin) {
      return res.status(403).json({ error: "Admin access only" });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// GET /api/admin/kyc-pending
// Returns all users who have submitted KYC and whose status is still 'pending'
router.get("/kyc-pending", requireAdmin, (req, res) => {
  const sql = `
    SELECT
      email,
      first_name,
      middle_name,
      last_name,
      dob,
      kyc_id_front,
      kyc_id_back,
      kyc_selfie
    FROM users
    WHERE kyc_submitted = 1
      AND kyc_status   = 'pending'
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("❌ [admin/kyc-pending] sqlite error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const payload = rows.map((u) => ({
      email:        u.email,
      first_name:   u.first_name,
      middle_name:  u.middle_name,
      last_name:    u.last_name,
      dob:          u.dob,
      id_front_url: `/uploads/${u.kyc_id_front}`,
      id_back_url:  `/uploads/${u.kyc_id_back}`,
      selfie_url:   `/uploads/${u.kyc_selfie}`,
    }));

    res.json(payload);
  });
});

// POST /api/admin/kyc-review
// Approve or reject a KYC submission
router.post("/kyc-review", requireAdmin, (req, res) => {
  const { email, status } = req.body;
  if (!email || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  const sql = `
    UPDATE users
       SET kyc_status = ?
     WHERE email = ?
  `;
  db.run(sql, [status, email], function (err) {
    if (err) {
      console.error("❌ [admin/kyc-review] sqlite error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: `User KYC ${status}` });
  });
});

module.exports = router;
