import { kv } from '@vercel/kv';

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

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({
      error: 'KV not connected',
      detail: 'No Vercel KV database is linked to this project yet. Go to your Vercel project → Storage → Connect Database → KV, then redeploy.'
    });
  }

  try {
    if (req.method === 'GET') {
      const code = req.query.code;
      if (!code) return res.status(400).json({ error: 'Missing room code' });

      const room = await kv.get(keyFor(code));
      if (!room) return res.status(404).json({ error: 'Room not found' });
      return res.status(200).json({ room });
    }

    if (req.method === 'POST') {
      const { code, room } = req.body || {};
      if (!code || !room) {
        return res.status(400).json({ error: 'Missing code or room payload' });
      }
      await kv.set(keyFor(code), room, { ex: TTL_SECONDS });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Room API error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}
