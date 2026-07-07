const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_KEY = 'pension-funds-state';

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV not configured');
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` }
  });
  if (!res.ok) throw new Error('KV read failed: HTTP ' + res.status);
  const data = await res.json();
  if (!data.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return data.result;
  }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV not configured');
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(value)
  });
  if (!res.ok) throw new Error('KV write failed: HTTP ' + res.status);
  return true;
}

function getUKDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function getUKMinutesSinceMidnight() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const hh = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const mm = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return hh * 60 + mm;
}

const DAILY_APPLY_MINUTE = 9 * 60 + 10; // 09:10 UK

// Basic per-key validation. Fund key is arbitrary (client-driven), but we clamp
// to a sane length so KV isn't stuffed with garbage keys.
function isValidFundKey(k) {
  return typeof k === 'string' && k.length > 0 && k.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(k);
}

function normaliseState(state) {
  const out = {};
  if (state && typeof state === 'object') {
    for (const [key, entry] of Object.entries(state)) {
      if (!isValidFundKey(key) || !entry || typeof entry !== 'object') continue;
      out[key] = {
        value: Number(entry.value) || 0,
        lastApplied: entry.lastApplied || null
      };
    }
  }
  return out;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const state = normaliseState(await kvGet(KV_KEY));
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { action } = body;
      const currentState = normaliseState(await kvGet(KV_KEY));

      if (action === 'update') {
        const values = body.values || {};
        for (const [key, raw] of Object.entries(values)) {
          if (!isValidFundKey(key)) continue;
          const num = Number(raw);
          if (isNaN(num) || num < 0) continue;
          if (!currentState[key]) currentState[key] = { value: 0, lastApplied: null };
          currentState[key].value = num;
        }
        await kvSet(KV_KEY, currentState);
        return res.status(200).json(currentState);
      }

      if (action === 'apply-daily') {
        const ukDate = getUKDate();
        const ukMinutes = getUKMinutesSinceMidnight();

        if (ukMinutes < DAILY_APPLY_MINUTE) {
          return res.status(400).json({ error: 'Not yet 09:10 UK time' });
        }

        const percentages = body.percentages || {};
        const applied = {};
        for (const [key, raw] of Object.entries(percentages)) {
          if (!isValidFundKey(key) || raw === null || raw === undefined) continue;
          const pct = Number(raw);
          if (isNaN(pct)) continue;
          if (!currentState[key]) currentState[key] = { value: 0, lastApplied: null };
          if (currentState[key].lastApplied === ukDate) continue; // already applied today
          currentState[key].value = currentState[key].value * (1 + pct / 100);
          currentState[key].lastApplied = ukDate;
          applied[key] = pct;
        }

        await kvSet(KV_KEY, currentState);
        return res.status(200).json({ state: currentState, applied });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Funds API error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
