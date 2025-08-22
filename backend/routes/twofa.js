const express = require("express");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const sqlite3 = require("sqlite3").verbose();

const router = express.Router();
const db = new sqlite3.Database("./users.db");
const SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";
const twofaRoutes = require('./routes/twofa');
app.use('/api', twofaRoutes);


// Helper
function getToken(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const [t, tok] = h.split(" ");
  return t === "Bearer" ? tok : null;
}

// Setup 2FA - generate secret and return QR
router.post("/2fa/setup", (req, res) => {
  const tok = getToken(req);
  if (!tok) return res.status(401).json({ error: "No token" });

  let email;
  try {
    ({ email } = jwt.verify(tok, SECRET));
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }

  const secret = speakeasy.generateSecret({ name: `Iira (${email})` });

  db.run(
    `UPDATE users SET totp_secret = ? WHERE email = ?`,
    [secret.base32, email],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });

      QRCode.toDataURL(secret.otpauth_url, (err, imageUrl) => {
        if (err) return res.status(500).json({ error: "QR error" });
        res.json({ qr: imageUrl });
      });
    }
  );
});

// Verify 2FA code
router.post("/2fa/verify", (req, res) => {
  const tok = getToken(req);
  if (!tok) return res.status(401).json({ error: "No token" });

  let email;
  try {
    ({ email } = jwt.verify(tok, SECRET));
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });

  db.get(`SELECT totp_secret FROM users WHERE email = ?`, [email], (err, row) => {
    if (err || !row || !row.totp_secret) {
      return res.status(400).json({ error: "No 2FA setup found" });
    }

    const verified = speakeasy.totp.verify({
      secret: row.totp_secret,
      encoding: "base32",
      token: code,
    });

    if (!verified) return res.status(403).json({ error: "Invalid code" });

    res.json({ success: true });
  });
});

module.exports = router;
