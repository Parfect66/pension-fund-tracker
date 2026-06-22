module.exports = async (req, res) => {
  const { symbol } = req.query;

  if (!process.env.FINNHUB_KEY) {
    return res.status(500).json({ error: 'FINNHUB_KEY not configured' });
  }

  const allowed = [
    '7203.T', '8306.T', '6501.T', '6857.T', '9984.T', '8725.T', '8035.T', '6758.T', '8058.T', '8411.T',
    '005930.KS', '000660.KS', 'CBA.AX', '1299.HK', 'WBC.AX', 'D05.SI', 'NAB.AX', '005935.KS', 'ANZ.AX', '0388.HK',
    '2330.TW', '2308.TW', '2354.TW', '329180.KS', '2383.TW', '2345.TW', '2454.TW', '600183.SS',
    'NVDA', 'GOOGL', 'BNY', 'AAPL', 'GS', 'CAH', 'TRGP', 'WMT', 'AVGO', 'PH'
  ];

  if (!symbol || !allowed.includes(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Finnhub API error' });
    }

    res.setHeader('Cache-Control', 's-maxage=30');
    return res.status(200).json(data);
  } catch (e) {
    console.error('API Error:', e);
    return res.status(502).json({ error: 'API request failed' });
  }
};
