import { pool, initDBIfNeeded } from '../_shared.js';

export default async function handler(req, res) {
  await initDBIfNeeded();

  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM modules ORDER BY created_at ASC');
    res.json({ data: result.rows, error: null });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
