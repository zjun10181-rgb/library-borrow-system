import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { pool, JWT_SECRET, initDBIfNeeded } from '../_shared';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await initDBIfNeeded();

  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM modules ORDER BY created_at ASC');
    res.json({ data: result.rows, error: null });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
