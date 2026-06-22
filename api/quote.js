export default async function handler(req, res) {
  const { symbol } = req.query;

  const allowed = [
    // Japan fund
    '7203.T', '8306.T', '6501.T', '6857.T', '9984.T', '8725.T', '8035.T', '6758.T', '8058.T', '8411.T',
    // Asia Pacific ex Japan fund
    '005930.KS', '000660.KS', 'CBA.AX', '1299.HK', 'WBC.AX', 'D05.SI', 'NAB.AX', '005935.KS', 'ANZ.AX', '0388.HK',
    // Veritas Asian fund
    '2330.TW', '2308.TW', '2354.TW', '329180.KS', '2383.TW', '2345.TW', '2454.TW', '600183.SS',
    // Artemis US Select fund
    'NVDA', 'GOOGL', 'BNY', 'AAPL', 'GS', 'CAH', 'TRGP', 'WMT', 'AVGO', 'PH'
  ];

  if (!allowed.includes(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  try {
    // Marketstack requires periods in symbols to be replaced with hyphens
    const apiSymbol = symbol.replace(/\./g, '-');
    const url = `https://api.marketstack.com/v2/eod?symbols=${apiSymbol}&access_key=${process.env.MARKETSTACK_KEY}&limit=2`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No data available');
    }

    const latest = data.data[0];
    const previous = data.data.length > 1 ? data.data[1] : latest;

    const finnhubFormat = {
      c: latest.adj_close || latest.close,
      pc: previous.adj_close || previous.close,
      t: Math.floor(new Date(latest.date).getTime() / 1000)
    };

    res.setHeader('Cache-Control', 's-maxage=3600');
    res.status(200).json(finnhubFormat);
  } catch (e) {
    console.error(`Quote error for ${symbol}:`, e.message);
    res.status(502).json({ error: e.message });
  }
}
