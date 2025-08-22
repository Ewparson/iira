// backend/routes/kyc.js

const express = require("express");
const jwt     = require("jsonwebtoken");
const router  = express.Router();
const SECRET  = process.env.JWT_SECRET || "SUPER_SECRET_KEY";
const FE_URL  = process.env.FRONTEND_URL || "http://localhost:3000";

router.get("/qr-link",    (req, res) => {
  const auth = req.headers.authorization?.split(" ")[1];
  if (!auth) return res.status(401).json({ error: "No token" });

  let payload;
  try {
    payload = jwt.verify(auth, SECRET);
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }

  // create a short‐lived “handoff” token
  const handoff = jwt.sign({ email: payload.email }, SECRET, { expiresIn: "10m" });
  const url = `${FE_URL}/onboarding?token=${handoff}`;

  res.json({ url });
});

module.exports = router;
