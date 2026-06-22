// Convert original ticker (with periods) to Marketstack API format (with hyphens)
function toApiSymbol(ticker) {
  return ticker.replace(/\./g, '-');
}

async function fetchMarketstackBatch(originalSymbols) {
  // Convert all symbols to hyphen format for the API call
  const apiSymbols = originalSymbols.map(toApiSymbol).join(',');
  const url = `https://api.marketstack.com/v2/eod?symbols=${encodeURIComponent(apiSymbols)}&access_key=${process.env.MARKETSTACK_KEY}&limit=1000&sort=DESC`;
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

function buildResult(originalSymbols, records) {
  // Build a map: API-format symbol -> original ticker
  const apiToOriginal = {};
  originalSymbols.forEach(t => { apiToOriginal[toApiSymbol(t)] = t; });

  const bySymbol = {};
  for (const record of records) {
    const apiSym = record.symbol;
    const origSym = apiToOriginal[apiSym] || apiSym;
    if (!bySymbol[origSym]) bySymbol[origSym] = [];
    bySymbol[origSym].push(record);
  }

  const result = {};
  for (const ticker of originalSymbols) {
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
  const { symbols, debug } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const symbolList = symbols.split(',');
  const errors = [];

  try {
    const records = await fetchMarketstackBatch(symbolList);
    const result = buildResult(symbolList, records);
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(debug ? { result, errors: [] } : result);
  } catch (batchErr) {
    errors.push({ stage: 'batch', message: batchErr.message });
    console.warn('Batch failed, falling back to individual calls:', batchErr.message);

    const result = {};
    await Promise.all(symbolList.map(async (ticker) => {
      try {
        const records = await fetchMarketstackBatch([ticker]);
        const single = buildResult([ticker], records);
        result[ticker] = single[ticker];
        if (!result[ticker]) {
          errors.push({ stage: 'individual', ticker, message: 'No data returned' });
        }
      } catch (e) {
        errors.push({ stage: 'individual', ticker, message: e.message });
        console.error(`Individual fetch failed for ${ticker}:`, e.message);
        result[ticker] = null;
      }
    }));

    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.status(200).json(debug ? { result, errors } : result);
  }
}
