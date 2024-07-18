import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await logger.getLogs(limit);
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'An error occurred while fetching logs' });
  }
}
