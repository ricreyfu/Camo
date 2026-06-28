import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rooms auto-expire after 6 hours of inactivity so old games don't pile up.
const TTL_SECONDS = 6 * 60 * 60;

function keyFor(code) {
  return `camo:room:${String(code).toUpperCase()}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({
      error: 'Database not connected',
      detail: 'No Upstash Redis database is linked to this project yet. Go to your Vercel project → Storage → connect an Upstash database, then redeploy.'
    });
  }

  try {
    if (req.method === 'GET') {
      const code = req.query.code;
      if (!code) return res.status(400).json({ error: 'Missing room code' });

      const room = await redis.get(keyFor(code));
      if (!room) return res.status(404).json({ error: 'Room not found' });
      return res.status(200).json({ room });
    }

    if (req.method === 'POST') {
      const { code, room } = req.body || {};
      if (!code || !room) {
        return res.status(400).json({ error: 'Missing code or room payload' });
      }
      await redis.set(keyFor(code), room, { ex: TTL_SECONDS });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Room API error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}
