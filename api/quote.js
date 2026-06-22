export default async function handler(req, res) {
  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const symbolList = symbols.split(',');

  try {
    const url = `https://api.marketstack.com/v2/eod?symbols=${encodeURIComponent(symbols)}&access_key=${process.env.MARKETSTACK_KEY}&limit=1000&sort=DESC`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Marketstack error:', JSON.stringify(data));
      return res.status(502).json({ error: data.error?.message || ('HTTP ' + response.status), raw: data });
    }

    if (!data.data || !Array.isArray(data.data)) {
      return res.status(502).json({ error: 'No data array in response', raw: data });
    }

    // Group records by symbol, sorted DESC by date so [0]=latest, [1]=previous
    const bySymbol = {};
    for (const record of data.data) {
      const sym = record.symbol;
      if (!bySymbol[sym]) bySymbol[sym] = [];
      bySymbol[sym].push(record);
    }

    // Build result map: { ticker: { c, pc, t } }
    const result = {};
    for (const ticker of symbolList) {
      const records = bySymbol[ticker];
      if (records && records.length > 0) {
        const latest = records[0];
        const previous = records.length > 1 ? records[1] : latest;
        result[ticker] = {
          c: latest.adj_close || latest.close,
          pc: previous.adj_close || previous.close,
          t: Math.floor(new Date(latest.date).getTime() / 1000)
        };
      } else {
        result[ticker] = null;
      }
    }

    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(result);
  } catch (e) {
    console.error('Quote error:', e.message);
    res.status(502).json({ error: e.message });
  }
}
