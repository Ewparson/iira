// backend/makeAdmin.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH      = process.env.DB_PATH || path.join(__dirname, 'users.db');
const ADMIN_EMAIL  = process.env.ADMIN_EMAIL;
const ADMIN_PASS   = process.env.ADMIN_PASSWORD || 'changeme';
const FIRST_NAME   = process.env.ADMIN_FIRST_NAME || 'Emaan';
const LAST_NAME    = process.env.ADMIN_LAST_NAME  || 'Wilson';

if (!ADMIN_EMAIL || !ADMIN_PASS) {
  console.error('❌ Please set ADMIN_EMAIL and ADMIN_PASSWORD in your .env');
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH);

// Add column is_admin if missing (for legacy DBs)
db.all(`PRAGMA table_info(users)`, (err, cols) => {
  if (!cols.some(c => c.name === "is_admin")) {
    db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, () => {});
  }
});

// Check if admin user exists
db.get('SELECT * FROM users WHERE email = ?', [ADMIN_EMAIL], (err, row) => {
  if (err) {
    console.error('DB error:', err);
    db.close();
    process.exit(1);
  }
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);
  if (!row) {
    // Insert new admin
    db.run(
      `INSERT INTO users
        (email, password, email_verified, is_admin, first_name, last_name)
       VALUES (?, ?, 1, 1, ?, ?)`,
      [ADMIN_EMAIL, hash, FIRST_NAME, LAST_NAME],
      function (err2) {
        if (err2) {
          console.error('❌ Failed to insert admin:', err2);
        } else {
          console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
        }
        db.close();
      }
    );
  } else {
    // Update to ensure admin, verified, and update password/name
    db.run(
      `UPDATE users
         SET is_admin = 1,
             email_verified = 1,
             password = ?,
             first_name = ?,
             last_name = ?
       WHERE email = ?`,
      [hash, FIRST_NAME, LAST_NAME, ADMIN_EMAIL],
      function (err2) {
        if (err2) {
          console.error('❌ Failed to promote admin:', err2);
        } else {
          console.log(`✅ Existing user promoted to admin and password reset: ${ADMIN_EMAIL}`);
        }
        db.close();
      }
    );
  }
});
