// backend/flush_db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.run('DELETE FROM users', (err) => {
    if (err) {
      console.error("Failed to truncate users table:", err);
    } else {
      console.log("✅ users table emptied.");
    }
    db.close();
  });
});
