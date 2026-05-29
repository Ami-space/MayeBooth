import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), '../../storage/mayebooth.db');

let _db: Database.Database | null = null;

export function initializeDatabase(): Database.Database {
  if (_db) return _db;

  // Ensure storage directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Run migrations
  runMigrations(db);

  _db = db;
  return db;
}

export function getDatabase(): Database.Database {
  if (!_db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return _db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    -- ── Sessions ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL,
      template_id   TEXT,
      status        TEXT NOT NULL DEFAULT 'idle',
      photo_count   INTEGER NOT NULL DEFAULT 0,
      output_path   TEXT,
      output_url    TEXT,
      gif_path      TEXT,
      qr_code       TEXT,
      print_job_id  TEXT
    );

    -- ── Photos ────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS photos (
      id              TEXT PRIMARY KEY,
      session_id      TEXT NOT NULL,
      sequence        INTEGER NOT NULL,
      raw_path        TEXT NOT NULL,
      processed_path  TEXT,
      created_at      INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    -- ── Templates ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS templates (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'custom',
      description TEXT,
      config      TEXT NOT NULL,   -- JSON
      thumbnail   TEXT,            -- base64 or path
      is_builtin  INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    -- ── Print Jobs ────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS print_jobs (
      id           TEXT PRIMARY KEY,
      session_id   TEXT NOT NULL,
      printer      TEXT NOT NULL,
      printer_type TEXT NOT NULL DEFAULT 'epson',
      status       TEXT NOT NULL DEFAULT 'queued',
      copies       INTEGER NOT NULL DEFAULT 1,
      size         TEXT NOT NULL DEFAULT '4x6',
      file_path    TEXT NOT NULL,
      error        TEXT,
      created_at   INTEGER NOT NULL,
      completed_at INTEGER,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    -- ── Settings ─────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL  -- JSON
    );

    -- ── Indexes ───────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id);
    CREATE INDEX IF NOT EXISTS idx_print_jobs_session ON print_jobs(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at);
  `);
}
