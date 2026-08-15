import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedDatabase } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 数据库文件放在项目根目录的 data/ 下，便于整目录备份
const DATA_DIR = join(__dirname, '../data');
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = join(DATA_DIR, 'library.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/** 建表（幂等：IF NOT EXISTS） */
export function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'student',
      approved      INTEGER NOT NULL DEFAULT 0,
      family_id     TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id               TEXT PRIMARY KEY,
      title            TEXT NOT NULL,
      author           TEXT NOT NULL,
      category         TEXT,
      isbn             TEXT,
      description      TEXT,
      cover_url        TEXT,
      total_copies     INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      module_id        TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id              TEXT PRIMARY KEY,
      book_id         TEXT NOT NULL,
      user_id         TEXT,
      borrower_name   TEXT NOT NULL,
      borrower_contact TEXT NOT NULL,
      borrow_date     TEXT NOT NULL,
      due_date        TEXT NOT NULL,
      return_date     TEXT,
      status          TEXT NOT NULL DEFAULT 'borrowed',
      created_at      TEXT NOT NULL,
      updated_at      TEXT,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS modules (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      icon        TEXT,
      type        TEXT,
      owner_id    TEXT,
      is_public   INTEGER DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS families (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      head_of_family TEXT,
      members        TEXT,
      description    TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_books_module   ON books(module_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_book    ON borrow_records(book_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_user    ON borrow_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_borrow_status  ON borrow_records(status);
  `);
}

/** 启动时初始化：建表 + 首次种子写入 */
export function initDatabase() {
  initTables();
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) {
    seedDatabase();
    console.log('📚 数据库为空，已写入初始种子数据');
  }
}
