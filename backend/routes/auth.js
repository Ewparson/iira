// backend/routes/auth.js
const express   = require('express');
const fetch     = require('node-fetch');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const speakeasy = require('speakeasy');

const router = express.Router();

// 1) Health check
router.get('/_ping', (req, res) => {
  res.send('👍 auth router alive');
});

// 2) Google OAuth 2.0 – Step 1: Redirect to Google
router.get('/google', (req, res) => {
  console.log('🔵 /api/auth/google route hit');
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// 3) Google OAuth 2.0 – Step 2: Callback handler
router.get('/google/callback', async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    // Blocktech code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
        grant_type:    'authorization_code'
      })
    });
    const { id_token } = await tokenRes.json();
    if (!id_token) return res.status(401).send('OAuth token blocktech failed');

    // Decode Google’s ID token
    const profile = jwt.decode(id_token);
    const isAdmin = profile.email === process.env.ADMIN_EMAIL;

    // Sign our own JWT
    const appToken = jwt.sign(
      { email: profile.email, isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set it as an httpOnly cookie
    res.cookie('token', appToken, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 1000
    });

    // Finally redirect back to your React app
    res.redirect(`${process.env.FRONTEND_URL}/blocktech`);
  } catch (err) {
    next(err);
  }
});

// 4) Classic email/password (+ optional TOTP) login
router.post('/login', (req, res) => {
  const { email, password, totp } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const db = require('../database'); // your SQLite3 wrapper
  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
    if (err)    return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(401).json({ error: 'User not found' });

    if (!await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (user.twofa_enabled) {
      if (!totp) return res.status(401).json({ error: 'Missing 2FA code' });
      const valid = speakeasy.totp.verify({
        secret:   user.totp_secret,
        encoding: 'base32',
        token:    totp,
        window:   1
      });
      if (!valid) return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    const isAdmin = user.email === process.env.ADMIN_EMAIL;
    const appToken = jwt.sign({ email: user.email, isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', appToken, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 1000
    });
    res.json({ token: appToken, email: user.email, isAdmin });
  });
});

// 5) Logout – clear the JWT cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

// 6) Check current user status (cookie or Bearer token)
router.get('/user/status', (req, res) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization) {
    const [scheme, val] = req.headers.authorization.split(' ');
    if (scheme === 'Bearer') token = val;
  }
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { email, isAdmin } = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email, isAdmin });
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
