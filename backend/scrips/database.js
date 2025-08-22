// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.DB_PATH || './users.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      email                TEXT UNIQUE,
      password             TEXT,
      email_verified       INTEGER DEFAULT 0,
      totp_secret          TEXT,
      twofa_enabled        INTEGER DEFAULT 0,
      kyc_status           TEXT DEFAULT 'pending',
      kyc_notes            TEXT DEFAULT '',
      first_name           TEXT,
      last_name            TEXT,
      dob                  TEXT,
      kyc_id_front         TEXT,
      kyc_id_back          TEXT,
      kyc_selfie           TEXT,
      kyc_submitted        INTEGER DEFAULT 0,
      payment_method_added INTEGER DEFAULT 0,
      created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      publicKey TEXT NOT NULL,
      encryptedPrivateKey TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
