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
  const prevClose = meta.chartPreviousClose ?? meta.previousClose;

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
