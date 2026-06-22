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

  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=30');
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
