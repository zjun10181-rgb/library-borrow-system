import pkg from 'pg';
const { Pool } = pkg;

export const JWT_SECRET = process.env.JWT_SECRET || 'library-secret-key-change-in-production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDBIfNeeded() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        approved BOOLEAN NOT NULL DEFAULT false,
        family_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        head_of_family TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        family_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        PRIMARY KEY (family_id, user_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        icon TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'school',
        owner_id TEXT,
        is_public BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT DEFAULT '',
        isbn TEXT DEFAULT '',
        description TEXT DEFAULT '',
        cover_url TEXT DEFAULT '',
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1,
        module_id TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS borrow_records (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        borrow_date DATE NOT NULL,
        due_date DATE,
        return_date DATE,
        status TEXT NOT NULL DEFAULT 'borrowed',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const bcrypt = await import('bcryptjs');
      const adminHash = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (id, email, password_hash, name, role, approved) VALUES ($1, $2, $3, $4, $5, $6)',
        ['admin-001', 'admin@library.com', adminHash, '管理员', 'admin', true]
      );

      const modules = [
        ['m1', '文学经典', 'school', true],
        ['m2', '科技科普', 'school', true],
        ['m3', '人文历史', 'school', true],
        ['m4', '儿童读物', 'school', true],
        ['m5', '世界名著', 'school', true],
        ['m6', '科普读物', 'school', true],
      ];

      for (const [id, name, type, isPublic] of modules) {
        await client.query(
          'INSERT INTO modules (id, name, type, is_public) VALUES ($1, $2, $3, $4)',
          [id, name, type, isPublic]
        );
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB init error:', err);
  } finally {
    client.release();
  }
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}
