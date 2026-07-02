async function fetchYahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const data = await response.json();

  if (data.chart?.error) {
    throw new Error(data.chart.error.description || data.chart.error.code || 'Yahoo error');
  }

  const result = data.chart?.result?.[0];
  if (!result?.meta) {
    throw new Error('No data returned');
  }

  const meta = result.meta;
  const price = meta.regularMarketPrice;

  // Prefer Yahoo's authoritative previousClose - it's the same "prev close" shown on Yahoo/MSN etc.
  // Fall back to the closes array only if that field is missing.
  let prevClose = meta.previousClose;

  if (typeof prevClose !== 'number') {
    // Walk the daily closes and pick the last close that occurred before today's market bar.
    const closes = result.indicators?.quote?.[0]?.close;
    const timestamps = result.timestamp;
    const todayTs = meta.regularMarketTime || Math.floor(Date.now() / 1000);
    // Bars are stamped at market-day start; "today" bar's timestamp is within ~1 day of regularMarketTime.
    if (Array.isArray(closes) && Array.isArray(timestamps)) {
      for (let i = timestamps.length - 1; i >= 0; i--) {
        if (typeof closes[i] === 'number' && (todayTs - timestamps[i]) > 43200) { // >12h old = a prior day
          prevClose = closes[i];
          break;
        }
      }
    }
  }

  if (typeof prevClose !== 'number') {
    prevClose = meta.chartPreviousClose;
  }

  if (typeof price !== 'number' || typeof prevClose !== 'number') {
    throw new Error('Missing price data');
  }

  return {
    c: price,
    pc: prevClose,
    t: meta.regularMarketTime || Math.floor(Date.now() / 1000)
  };
}

export default async function handler(req, res) {
  const { symbols, debug } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const symbolList = symbols.split(',');
  const result = {};
  const errors = [];

  await Promise.all(symbolList.map(async (ticker) => {
    try {
      result[ticker] = await fetchYahooQuote(ticker);
    } catch (e) {
      errors.push({ ticker, message: e.message });
      console.error(`Yahoo fetch failed for ${ticker}:`, e.message);
      result[ticker] = null;
    }
  }));

  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json(debug ? { result, errors } : result);
}
