const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка при подключении к БД:', err.message);
  } else {
    console.log('Подключено к SQLite базе данных (6_3_roygon).');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      current_q INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      answers TEXT DEFAULT '[]'
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      link_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
  `);
});

module.exports = db;
