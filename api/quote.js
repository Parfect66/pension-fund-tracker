async function fetchMarketstackBatch(symbols) {
  const url = `https://api.marketstack.com/v2/eod?symbols=${encodeURIComponent(symbols)}&access_key=${process.env.MARKETSTACK_KEY}&limit=1000&sort=DESC`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || ('HTTP ' + response.status));
  }
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('No data array in response');
  }
  return data.data;
}

function buildResult(symbolList, records) {
  const bySymbol = {};
  for (const record of records) {
    const sym = record.symbol;
    if (!bySymbol[sym]) bySymbol[sym] = [];
    bySymbol[sym].push(record);
  }

  const result = {};
  for (const ticker of symbolList) {
    const recs = bySymbol[ticker];
    if (recs && recs.length > 0) {
      const latest = recs[0];
      const previous = recs.length > 1 ? recs[1] : latest;
      result[ticker] = {
        c: latest.adj_close || latest.close,
        pc: previous.adj_close || previous.close,
        t: Math.floor(new Date(latest.date).getTime() / 1000)
      };
    } else {
      result[ticker] = null;
    }
  }
  return result;
}

export default async function handler(req, res) {
  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const symbolList = symbols.split(',');

  try {
    // Try batched call first (fast, one request)
    const records = await fetchMarketstackBatch(symbols);
    const result = buildResult(symbolList, records);
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(result);
  } catch (batchErr) {
    console.warn('Batch failed, falling back to individual calls:', batchErr.message);

    // Fallback: fetch each symbol individually so one bad symbol doesn't kill the whole batch
    const result = {};
    await Promise.all(symbolList.map(async (ticker) => {
      try {
        const records = await fetchMarketstackBatch(ticker);
        const single = buildResult([ticker], records);
        result[ticker] = single[ticker];
      } catch (e) {
        console.error(`Individual fetch failed for ${ticker}:`, e.message);
        result[ticker] = null;
      }
    }));

    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(result);
  }
}
