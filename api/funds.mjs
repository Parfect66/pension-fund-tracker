const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const KV_KEY = 'pension-funds-state';

const DEFAULT_STATE = {
  japan: { value: 0, lastApplied: null },
  asiapac: { value: 0, lastApplied: null },
  veritas: { value: 0, lastApplied: null },
  artemis: { value: 0, lastApplied: null }
};

const VALID_FUNDS = Object.keys(DEFAULT_STATE);

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

function getUKHour() {
  return parseInt(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', hour12: false
  }).format(new Date()), 10);
}

function mergeWithDefaults(state) {
  const result = { ...DEFAULT_STATE };
  if (state && typeof state === 'object') {
    for (const fund of VALID_FUNDS) {
      if (state[fund]) {
        result[fund] = {
          value: Number(state[fund].value) || 0,
          lastApplied: state[fund].lastApplied || null
        };
      }
    }
  }
  return result;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const state = mergeWithDefaults(await kvGet(KV_KEY));
      return res.status(200).json(state);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { action } = body;
      const currentState = mergeWithDefaults(await kvGet(KV_KEY));

      if (action === 'update') {
        // Manual edit from UI
        const values = body.values || {};
        for (const fund of VALID_FUNDS) {
          if (values[fund] !== undefined) {
            const num = Number(values[fund]);
            if (!isNaN(num) && num >= 0) {
              currentState[fund].value = num;
            }
          }
        }
        await kvSet(KV_KEY, currentState);
        return res.status(200).json(currentState);
      }

      if (action === 'apply-daily') {
        const ukDate = getUKDate();
        const ukHour = getUKHour();

        if (ukHour < 19) {
          return res.status(400).json({ error: 'Not yet 19:00 UK time' });
        }

        const percentages = body.percentages || {};
        const applied = {};
        for (const fund of VALID_FUNDS) {
          if (currentState[fund].lastApplied !== ukDate && percentages[fund] !== undefined && percentages[fund] !== null) {
            const pct = Number(percentages[fund]);
            if (!isNaN(pct)) {
              currentState[fund].value = currentState[fund].value * (1 + pct / 100);
              currentState[fund].lastApplied = ukDate;
              applied[fund] = pct;
            }
          }
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
